#!/usr/bin/env node
// Usage: npm run research:fulltext -- research-candidates/<date>.json [--rescore]

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import { degreeOf, isEnglish, mentions } from "../src/lib/research-fulltext.mjs";

const args = process.argv.slice(2);
const rescore = args.includes("--rescore");
const file = args.find((a) => !a.startsWith("--"));
if (!file) throw new Error("Pass the candidates JSON file.");
const cacheDir = join(dirname(file), "fulltext");
await mkdir(cacheDir, { recursive: true });
const cachePath = (r) => join(cacheDir, `${r.openalex_id.replace("https://openalex.org/", "")}.json`);
const data = JSON.parse(await readFile(file, "utf8"));
const HEADERS = { "User-Agent": "research-candidates-script" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(String(res.status));
  return { buf: Buffer.from(await res.arrayBuffer()), url: res.url };
}

async function getJson(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

const rewrite = (url) =>
  url.replace(/^(https?:\/\/[^/]+)\/bitstreams\/([0-9a-f-]{36})\/download$/, "$1/server/api/core/bitstreams/$2/content");

async function divaPdf(url) {
  if (!/urn\.kb\.se/.test(url)) return null;
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(20000) });
    const id = res.url.match(/diva2(?::|%3A)(\d+)/i)?.[1];
    return id ? `https://www.diva-portal.org/smash/get/diva2:${id}/FULLTEXT01.pdf` : null;
  } catch {
    return null;
  }
}

function pdfLinkIn(html, base) {
  const meta = html.match(/<meta[^>]+name=["']citation_pdf_url["'][^>]+content=["']([^"']+)/i)?.[1];
  const href = [...html.matchAll(/href=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .find((h) => /\.pdf(\?|$)|FULLTEXT\d*\.pdf|\/bitstreams?\/.+\/(download|content)|bitstream\/handle\/.+\.pdf/i.test(h));
  const link = meta ?? href;
  return link ? new URL(link.replace(/&amp;/g, "&"), base).href : null;
}

const htmlText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|h\d|div|section|li)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ");

const isPdf = (buf) => buf.subarray(0, 5).toString() === "%PDF-";

async function pdfText(buf) {
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  return (await extractText(pdf, { mergePages: true })).text;
}

async function candidateUrls(r) {
  const urls = [r.open_access_url, ...(r.pdf_urls ?? [])];
  const doi = r.doi?.replace("https://doi.org/", "");
  if (doi) {
    const crossref = await getJson(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
    urls.push(...(crossref?.message?.link ?? []).map((l) => l.URL));
    await sleep(1100);
    const s2 = await getJson(`https://api.semanticscholar.org/graph/v1/paper/DOI:${doi}?fields=openAccessPdf,externalIds`);
    urls.push(s2?.openAccessPdf?.url);
    if (s2?.externalIds?.ArXiv) urls.push(`https://arxiv.org/pdf/${s2.externalIds.ArXiv}`);
  }
  for (const u of [...urls]) if (u) urls.push(await divaPdf(u));
  urls.push(r.doi);
  return [...new Set(urls.filter(Boolean).map(rewrite))];
}

async function fullText(r) {
  try {
    return JSON.parse(await readFile(cachePath(r), "utf8"));
  } catch {}
  const found = await fetchFullText(r);
  if (found.text) await writeFile(cachePath(r), JSON.stringify(found));
  return found;
}

async function fetchFullText(r) {
  const tried = [];
  for (const url of await candidateUrls(r)) {
    try {
      const page = await fetchBuffer(url);
      if (isPdf(page.buf)) return { text: await pdfText(page.buf), source: page.url };
      const html = page.buf.toString("utf8");
      const link = pdfLinkIn(html, page.url);
      if (link && link !== url) {
        try {
          const pdf = await fetchBuffer(rewrite(link));
          if (isPdf(pdf.buf)) return { text: await pdfText(pdf.buf), source: pdf.url };
        } catch (error) {
          tried.push(`${link}: ${error.message}`);
        }
      }
      const text = htmlText(html);
      if (text.replace(/\s+/g, " ").length > 20000 && /Introduction/i.test(text)) return { text, source: `${page.url} (html)` };
      tried.push(`${url}: no full text on page`);
    } catch (error) {
      tried.push(`${url}: ${error.message}`);
    }
  }
  return { text: null, tried };
}

if (rescore) {
  for (const r of data.records) {
    if (r.fulltext?.status !== "read") continue;
    if (r.fulltext.excluded) Object.assign(r, { decision: "PENDING", reason_codes: [], reviewer_note: "" });
    if (r.decision === "PENDING") delete r.fulltext;
  }
}
const todo = data.records.map((r, i) => [r, i]).filter(([r]) => r.decision === "PENDING" && !r.fulltext);
console.log(`Fetching full text for ${todo.length} PENDING records…`);
const tally = { unavailable: 0, language: 0, student: 0, mention: 0, check: 0 };

for (const [n, [r, i]] of todo.entries()) {
  const { text, source, tried } = await fullText(r);
  if (!text) {
    r.fulltext = { status: "unavailable", tried: tried.slice(-6) };
    tally.unavailable++;
  } else {
    const m = mentions(text);
    const degree = r.publication_type === "dissertation" ? degreeOf(text) : null;
    const english = isEnglish(text);
    r.fulltext = {
      status: "read",
      source,
      english,
      degree,
      mentions: m.total,
      in_methods: m.in_methods,
      counts: m.counts,
      sections: m.sections,
      snippets: m.hits.slice(0, 8).map((h) => `[${h.section ?? "?"}] ${h.context}`),
    };
    const codes = [];
    if (english === false) codes.push("X-LANGUAGE");
    if (degree === "bachelor's") codes.push("X-STUDENT");
    if (m.total < 2) codes.push("X-MENTION");
    if (codes.length) {
      r.fulltext.excluded = true;
      Object.assign(r, { decision: "EXCLUDE", reason_codes: codes, reviewer_note: `Full text: ${m.total} exact product mention(s) in the body${degree ? `; ${degree} thesis` : ""}${english === false ? "; not in English" : ""}.` });
      if (codes.includes("X-LANGUAGE")) tally.language++;
      else if (codes.includes("X-STUDENT")) tally.student++;
      else tally.mention++;
    } else {
      if (degree === "PhD") r.label = "PhD thesis";
      if (degree === "master's") r.label = "Master's thesis";
      tally.check++;
    }
  }
  console.log(`${n + 1}/${todo.length} [${i}] ${r.fulltext.status}${r.fulltext.mentions !== undefined ? ` ${r.fulltext.mentions} mentions` : ""} ${r.title?.slice(0, 60)}`);
  if ((n + 1) % 10 === 0) await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
}

await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`
Read and excluded: ${tally.language} not English, ${tally.student} bachelor's, ${tally.mention} fewer than two mentions.
Read, needs a judgement (methods placement, 2a, degree): ${tally.check}.
No full text found: ${tally.unavailable} (MANUAL REVIEW M-UNCLEAR unless the abstract settles it).
Wrote ${file}`);
