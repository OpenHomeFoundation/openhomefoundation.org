#!/usr/bin/env node
// Usage: npm run research:candidates -- [--first-run] [--since YYYY-MM-DD] [--out path]

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  PRODUCTS,
  existingKeys,
  isAlreadyListed,
  normaliseTitle,
  toRecord,
  workKey,
} from "../src/lib/research-candidates.mjs";

const API = "https://api.openalex.org/works";
const SELECT =
  "id,doi,title,display_name,publication_year,publication_date,type,language,primary_location,locations,authorships,is_retracted,open_access,abstract_inverted_index";

function parseArgs(argv) {
  const args = { firstRun: false, since: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--first-run") args.firstRun = true;
    else if (argv[i] === "--since") args.since = argv[++i];
    else if (argv[i] === "--out") args.out = argv[++i];
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return args;
}

function twelveMonthsAgo(today) {
  const d = new Date(today);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class BudgetExhausted extends Error {}

async function get(url, attempt = 1) {
  await sleep(1100 * 2 ** (attempt - 1));
  const res = await fetch(url, { headers: { "User-Agent": "research-candidates-script" } });
  if (res.ok) return res.json();
  const body = await res.text();
  if (res.status === 429 && body.includes("daily_budget")) throw new BudgetExhausted(body);
  if (res.status === 429 && attempt < 5) return get(url, attempt + 1);
  throw new Error(`OpenAlex ${res.status}: ${body}`);
}

async function fetchAll(query, since) {
  const works = [];
  let cost = 0;
  for (let page = 1; ; page++) {
    const url = new URL(API);
    url.searchParams.set("search", query);
    url.searchParams.set("filter", `from_publication_date:${since}`);
    url.searchParams.set("select", SELECT);
    url.searchParams.set("per_page", "200");
    url.searchParams.set("page", String(page));
    const body = await get(url);
    works.push(...body.results);
    cost += body.meta.cost_usd ?? 0;
    if (!body.results.length || works.length >= body.meta.count) break;
    if (works.length >= 10_000) {
      console.warn(`  Stopped at OpenAlex's 10,000-record limit (${body.meta.count} matched); narrow the query.`);
      break;
    }
  }
  return { works, cost };
}

const args = parseArgs(process.argv.slice(2));
const today = new Date().toISOString().slice(0, 10);
const since = args.since ?? (args.firstRun ? "2013-01-01" : twelveMonthsAgo(today));
const out = args.out ?? `research-candidates/${today}.json`;

const existing = existingKeys(await readFile("src/content/research/by-others.yml", "utf8"));
const byKey = new Map();
let totalCost = 0;

const queried = [];
const metrics = new Map();

function buildRecords() {
  let alreadyListed = 0;
  const records = [];
  for (const { work, products } of byKey.values()) {
    if (isAlreadyListed(work, existing)) {
      alreadyListed++;
      continue;
    }
    records.push(toRecord(work, products, today));
  }
  const published = new Map(
    records.filter((r) => !r.reason_codes.includes("X-PREPRINT")).map((r) => [normaliseTitle(r.title), r]),
  );
  for (const r of records) {
    if (!r.reason_codes.includes("X-PREPRINT")) continue;
    const match = published.get(normaliseTitle(r.title));
    if (!match) continue;
    r.reason_codes = ["X-DUPLICATE"];
    r.reviewer_note = `Preprint of ${match.doi ?? match.openalex_id}, which is screened instead.`;
    match.open_access_url ??= r.open_access_url ?? r.doi;
  }
  for (const r of records) if (r.venue_metrics) r.venue_metrics = metrics.get(r.venue_openalex_id) ?? {};
  const rank = (r) => (r.decision === "EXCLUDE" ? 2 : r.matched_in === "title/abstract" ? 0 : 1);
  records.sort((a, b) => rank(a) - rank(b));
  return { records, alreadyListed };
}

async function save() {
  const { records } = buildRecords();
  const notQueried = PRODUCTS.map((p) => p.tag).filter((tag) => !queried.includes(tag));
  const file = { since, screened_on: today, complete: notQueried.length === 0, queried, not_queried: notQueried, records };
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify(file, null, 2)}\n`);
}

for (const product of PRODUCTS) {
  let result;
  try {
    result = await fetchAll(product.query, since);
  } catch (error) {
    if (!(error instanceof BudgetExhausted)) throw error;
    await save();
    console.error(`
OpenAlex's daily budget is used up (429 daily_budget), stopped at ${product.tag}.
Spent this run: $${totalCost.toFixed(3)}. Saved results for ${queried.length ? queried.join(", ") : "no products"} to ${out}.
Wait for the budget to reset before running again.`);
    process.exit(2);
  }
  totalCost += result.cost;
  console.log(`${product.tag}: ${result.works.length} results`);
  for (const work of result.works) {
    const key = workKey(work);
    const entry = byKey.get(key) ?? { work, products: new Set() };
    entry.products.add(product.tag);
    byKey.set(key, entry);
  }
  queried.push(product.tag);
  await save();
}

async function fetchMetrics(ids) {
  let cost = 0;
  for (let i = 0; i < ids.length; i += 50) {
    const url = new URL("https://api.openalex.org/sources");
    url.searchParams.set("filter", `openalex_id:${ids.slice(i, i + 50).join("|")}`);
    url.searchParams.set("select", "id,summary_stats,works_count");
    url.searchParams.set("per_page", "50");
    const body = await get(url);
    cost += body.meta.cost_usd ?? 0;
    for (const s of body.results) {
      metrics.set(s.id.replace("https://openalex.org/", ""), {
        "2yr_mean_citedness": s.summary_stats?.["2yr_mean_citedness"] ?? null,
        h_index: s.summary_stats?.h_index ?? null,
        works_count: s.works_count ?? null,
      });
    }
  }
  return cost;
}

const venueIds = [...new Set(buildRecords().records.filter((r) => r.venue_metrics).map((r) => r.venue_openalex_id))];
try {
  totalCost += await fetchMetrics(venueIds);
} catch (error) {
  if (!(error instanceof BudgetExhausted)) throw error;
  console.error("OpenAlex's daily budget ran out while fetching venue_metrics; they are left empty.");
}
await save();

const { records, alreadyListed } = buildRecords();

const count = (d, m) => records.filter((r) => r.decision === d && (!m || r.matched_in === m)).length;
console.log(`
Since ${since}: ${byKey.size} unique works, ${alreadyListed} already listed.
${count("PENDING")} need screening (Steps 2–5): ${count("PENDING", "title/abstract")} name a product in the title or abstract, ${count("PENDING", "full text only")} only in the full text.
${count("EXCLUDE")} excluded mechanically (${records.filter((r) => r.reason_codes.includes("X-VENUE")).length} on venue, metrics for ${metrics.size} of ${venueIds.length} venues).
OpenAlex cost: $${totalCost.toFixed(3)} (keyless budget is $0.10/day per IP).
Wrote ${out}`);
