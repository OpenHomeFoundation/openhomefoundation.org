#!/usr/bin/env node
// Usage: npm run research:candidates -- [--first-run] [--since YYYY-MM-DD] [--out path]

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { PRODUCTS, existingKeys, isAlreadyListed, toRecord, workKey } from "../src/lib/research-candidates.mjs";

const API = "https://api.openalex.org/works";
const SELECT = "id,doi,title,display_name,publication_year,publication_date,type,primary_location,authorships,is_retracted,open_access,abstract_inverted_index";

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

async function get(url, attempt = 1) {
  await sleep(1100);
  const res = await fetch(url, { headers: { "User-Agent": "research-candidates-script" } });
  if (res.status === 429 && attempt < 5) return get(url, attempt + 1);
  if (!res.ok) throw new Error(`OpenAlex ${res.status}: ${await res.text()}`);
  return res.json();
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

for (const product of PRODUCTS) {
  const { works, cost } = await fetchAll(product.query, since);
  totalCost += cost;
  console.log(`${product.tag}: ${works.length} results`);
  for (const work of works) {
    const key = workKey(work);
    const entry = byKey.get(key) ?? { work, products: new Set() };
    entry.products.add(product.tag);
    byKey.set(key, entry);
  }
}

let alreadyListed = 0;
const records = [];
for (const { work, products } of byKey.values()) {
  if (isAlreadyListed(work, existing)) {
    alreadyListed++;
    continue;
  }
  records.push(toRecord(work, products, today));
}
const rank = (r) => (r.decision === "EXCLUDE" ? 2 : r.matched_in === "title/abstract" ? 0 : 1);
records.sort((a, b) => rank(a) - rank(b));

await mkdir(dirname(out), { recursive: true });
await writeFile(out, `${JSON.stringify({ since, screened_on: today, records }, null, 2)}\n`);

const count = (d, m) => records.filter((r) => r.decision === d && (!m || r.matched_in === m)).length;
console.log(`
Since ${since}: ${byKey.size} unique works, ${alreadyListed} already listed.
${count("PENDING")} need screening (Steps 2–5): ${count("PENDING", "title/abstract")} name a product in the title or abstract, ${count("PENDING", "full text only")} only in the full text.
${count("EXCLUDE")} excluded mechanically.
OpenAlex cost: $${totalCost.toFixed(3)} (keyless budget is $0.10/day per IP).
Wrote ${out}`);
