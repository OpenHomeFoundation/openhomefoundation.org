---
name: update-referrer-allowlist
description: Use this whenever adding, removing, or reviewing domains in list/allowed-referrers.txt (the public Plausible referrer allowlist). Enforces the project's rules — normalise www. to bare domains, reject IPs/ports/dynamic-DNS/tunnels/NAS-remote/login-SSO/personal instances, dedupe against existing and deny patterns — and validates that the build still passes with no prune warnings.
---

# Update Referrer Allowlist

Add, remove, or review entries in [list/allowed-referrers.txt](../../../list/allowed-referrers.txt) — the **public** allowlist published as `openhomefoundation.org/allowed-referrers.json` and consumed by every OHF site running Plausible. Any referrer not on this list is replaced with `https://unlisted.invalid/` before Plausible records it, so the list decides what real referrers get attributed.

Because the file is public and permanent (git history + CDN + Internet Archive), the cost of a wrong entry is high: it can publish a real person's home URL. Follow this process every time.

## When to use

- The user pastes a list of domains to add to the allowlist.
- The user wants to remove entries (for example login/SSO screens or self-hosted instances found in analytics).
- The user asks whether a domain (or its subdomains) would be covered.

## Source of truth and helpers

- Allowlist: `list/allowed-referrers.txt` (one bare domain per line; `#` comments; blank lines ignored).
- Deny patterns: `list/deny-patterns.txt` (build-time-only guard; suffix-matched; never published).
- Validation/parsing logic: `src/lib/referrers.js` (an ES module, pure — no filesystem access), which exports `loadAllowedReferrers(allowFileText, denyFileText)`, `classifyEntry`, `suffixMatch`, and `parseListFile`. The site loads the list files through `src/lib/allowed-referrers.js`.

Matching is **suffix-based**: an entry matches that domain AND all subdomains. So `reddit.com` covers `old.reddit.com`, and adding a bare domain makes any of its subdomains redundant.

## The rules

**Only add domains you recognise as public websites.** Be generous with recognised sites, ruthless with unknowns.

Never add (these are either rejected by the build or must be caught by review):

- **IP addresses** in any form, or hosts with **port numbers** — rejected automatically by `classifyEntry()`.
- **Dynamic DNS** hostnames (e.g. `*.duckdns.org`, `*.freeddns.org`, `*.homeip.net`) — some are in `list/deny-patterns.txt` and fail the build; others must be caught by review. If you find a dynamic-DNS provider that isn't in the deny file, propose adding it there.
- **Tunnels / dev exposure** (ngrok, trycloudflare, localtunnel, …) and **NAS/router remote access** (`quickconnect.to`, `myfritz.net`, …) — mostly in the deny file.
- **Personal / self-hosted instances** — anything that looks like someone's own Home Assistant, ESPHome, or other self-hosted service. Watch for tell-tale subdomains like `esphome.<personal-domain>`, `home.<personal-domain>`, `hass.*`, or a page that is really a **login/SSO screen** or a self-hosted app (Grafana, etc.). Exclude these even when they don't fail the build, and flag them to the user.
- **Unrecognisable / suspicious domains** (random strings, odd TLDs you can't place). Exclude and flag.

Normalise before adding:

- **Strip a leading `www.`** so the entry is the bare registrable domain (`www.cnet.com` → `cnet.com`). The bare domain covers `www` and every other subdomain.
- Drop entries already covered by a broader existing entry, or by a bare domain within the same batch (they would be auto-pruned anyway).

## Process

### 1. Stage the input

Write the raw pasted list to a temp file (trailing spaces and blank lines are fine — they get trimmed):

```shell
cat > /tmp/newrefs.txt <<'EOF'
<paste the domains here>
EOF
```

### 2. Analyse against existing entries, deny patterns, and the validator

Run this script (it normalises `www.`, classifies each entry, and buckets them). Do **not** hand-check large lists — let the code do it:

```shell
cat > /tmp/analyze.mjs <<'EOF'
import { classifyEntry, suffixMatch, parseListFile } from "/workspaces/openhomefoundation.org/src/lib/referrers.js";
import fs from "node:fs";
const R = "/workspaces/openhomefoundation.org/";

const existing = parseListFile(fs.readFileSync(R + "list/allowed-referrers.txt", "utf8"))
  .map((e) => classifyEntry(e.raw)).filter((r) => r.kind === "domain").map((r) => r.canonical);
const deny = parseListFile(fs.readFileSync(R + "list/deny-patterns.txt", "utf8"))
  .map((e) => classifyEntry(e.raw, { allowSingleLabel: true })).filter((r) => r.kind === "domain").map((r) => r.canonical);

const raw = fs.readFileSync("/tmp/newrefs.txt", "utf8")
  .split(/\r?\n/).map((s) => s.trim()).filter(Boolean).map((s) => s.replace(/^www\./, ""));

const rejected = [], denied = [], covered = [];
const addSet = new Set(); const add = [];
for (const line of raw) {
  const r = classifyEntry(line);
  if (r.kind !== "domain") { rejected.push([line, r.kind, r.detail || ""]); continue; }
  const host = r.canonical;
  if (deny.find((p) => suffixMatch(host, p))) { denied.push(host); continue; }
  if (existing.find((p) => suffixMatch(host, p))) { covered.push(host); continue; }
  if (addSet.has(host)) continue;
  addSet.add(host); add.push(host);
}
const finalAdd = add.filter((h) => !add.some((o) => o !== h && suffixMatch(h, o))).sort();
console.log("REJECTED (invalid/ip/port):", JSON.stringify(rejected));
console.log("DENIED (deny-pattern match):", denied);
console.log("COVERED/DUP (already/broader):", covered);
console.log("TO ADD (" + finalAdd.length + "):\n" + finalAdd.join("\n"));
EOF
node /tmp/analyze.mjs
```

### 3. Review the "TO ADD" list by hand for the judgement calls the code can't make

Scan for the review-only rules above: personal/self-hosted instances, login/SSO endpoints, unrecognisable domains, and dynamic-DNS providers not yet in the deny file. Pull those out of the add list and note them. When in doubt, exclude and flag rather than publish.

### 4. Apply the changes

- Add the reviewed domains to `list/allowed-referrers.txt`, editing the file with the edit tools (never via shell redirection into the tracked file). Group large batches under a dated section header, e.g. `# --- <topic> (reviewed YYYY-MM, batch N) ---`, kept flat and alphabetical.
- For removals, delete the exact lines.
- If a newly added bare domain makes an existing subdomain entry redundant, remove that subdomain line too (see step 5 — the build will warn about it).

### 5. Validate the build

The gate is the build itself: `loadAllowedReferrers()` throws on any invalid entry and warns on redundant ones.

```shell
node -e "import('./src/lib/referrers.js').then(async (m) => { const fs = await import('node:fs'); console.error('OK — published entries:', m.loadAllowedReferrers(fs.readFileSync('list/allowed-referrers.txt', 'utf8'), fs.readFileSync('list/deny-patterns.txt', 'utf8')).length); });"
```

- If it **throws**, fix the reported entries and re-run.
- If it prints a `redundant — already covered by …, pruned` **warning**, remove that now-redundant line from the file and re-run until there are no warnings.

### 6. Clean up temp files

```shell
rm -f /tmp/newrefs.txt /tmp/analyze.mjs
```

## Reporting

Summarise for the user with these buckets:

- **Added** — the domains that went in (with the section name for big batches).
- **Skipped — already covered/duplicate** — exact dupes and entries covered by a broader domain (existing or within the batch), plus any `www.`→bare normalisations and collapses.
- **Excluded — build-breakers / policy** — rejected (IP/port/invalid) and deny-pattern matches, with the reason.
- **Excluded — manual safety** — personal instances, login/SSO screens, dynamic-DNS, unrecognisable domains, with the reason. Offer to add any (e.g. a dynamic-DNS provider) to `list/deny-patterns.txt`.
- **Worth a second look** — borderline entries you kept but want the user to confirm.

Always end with the final published entry count from step 5.
