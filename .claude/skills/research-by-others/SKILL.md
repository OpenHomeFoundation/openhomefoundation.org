---
name: research-by-others
description: Use this to find and screen new published research that uses Home Assistant or other OHF projects for the "Research by others" page (src/content/research/by-others.yml), whenever someone asks to "update research by others", "run the research screening", "find new papers", "check OpenAlex", do the quarterly research run, or screen a self-submitted paper. Runs the OpenAlex candidate script, applies Idil's inclusion guidelines, writes a review file, and only adds entries to by-others.yml after a named person signs off.
---

# Research by others: find and screen

Finds published research that uses OHF products, screens it against the inclusion guidelines, and prepares entries for [src/content/research/by-others.yml](../../../src/content/research/by-others.yml).

**The rules live in [inclusion-guidelines.md](inclusion-guidelines.md). Read it in full before screening anything.** It is the source of truth; this file only says how to run it here.

Never add anything to `by-others.yml` until a named reviewer has signed off on it in this conversation.

## 1. Collect candidates (mechanical)

```sh
npm run research:candidates                 # past 12 months (quarterly run)
npm run research:candidates -- --first-run  # everything since 2013-01-01
npm run research:candidates -- --since 2026-01-01
```

The script ([scripts/research-candidates.mjs](../../../scripts/research-candidates.mjs), logic in [src/lib/research-candidates.mjs](../../../src/lib/research-candidates.mjs)):

- queries OpenAlex without an API key, using the Scope table's search terms (Step 1). It costs about $0.015 a run against a shared $0.10/day keyless budget. If it hits the daily budget, wait a day or pass a narrower `--since`.
- removes duplicates, and anything already in `by-others.yml`.
- applies the checks that need no judgement: retraction flag (X-RETRACTED), OHF or Nabu Casa affiliations (X-OHF, X-AFFILIATION), preprint/dataset/software types (X-PREPRINT, X-NOTPEER), and pre-approved venues (`quality_basis: "Pre-approved"`).
- writes `research-candidates/<date>.json` (gitignored). Records are `EXCLUDE` (mechanical) or `PENDING`, with `matched_in`, `abstract` and `hints`.

Semantic Scholar (the secondary source) isn't automated yet. Self-submissions come from GitHub issues on OpenHomeFoundation/user-research; ask the user for any to include and screen them alongside.

## 2. Screen the PENDING records (judgement)

Work through the JSON in batches (read it with `jq` or a short script, never all at once). For each PENDING record, apply Steps 2 to 5 of the guidelines and fill `decision`, `reason_codes`, `relevance`, `domain`, `quality_basis`, `summary` and `reviewer_note`.

- `matched_in: "title/abstract"`: screen these fully.
- `matched_in: "full text only"`: the product is only in the body text, so it's most often a passing mention. If the title, venue and abstract give no sign the product was studied or used, mark EXCLUDE X-MENTION with the reviewer note "full-text-only match". If they suggest it might be (e.g. a smart home deployment), open the `open_access_url` to check; if you can't, mark MANUAL REVIEW M-UNCLEAR.
- Step 4b/4c (CORE rank, SJR quartile): portal.core.edu.au and scimagojr.com block automated access, so don't try to fetch them and never rank from memory. Mark these MANUAL REVIEW and list each venue with its lookup link (`https://portal.core.edu.au/conf-ranks/?search=<name>&by=all`, `https://www.scimagojr.com/journalsearch.php?q=<name or ISSN>`) for the reviewer to check in a browser.
- When OpenAlex returns 429 with `daily_budget`, the shared keyless allowance is used up. Stop, say so, and use Crossref (`api.crossref.org/works`) for metadata lookups until it resets.
- Take every fact from the record. Write summaries in your own words, at most 60 words, never copied from the abstract.

Save the screened records back to the same JSON file.

## 3. Report for review

Give the user a short report:

- counts per decision and reason code
- every INCLUDE: title, venue, year, quality basis, one-line summary
- every MANUAL REVIEW: title and the question the reviewer needs to answer

Ask who is signing off. Spot checks: all INCLUDE items if there are 10 or fewer, otherwise at least 10.

## 4. Publish approved entries

After sign-off, add each approved record to `by-others.yml` in the "Ready" section, keeping the file's order (year descending, then title). Map the fields:

| Guideline field | by-others.yml |
| --- | --- |
| title, venue, year | `title`, `venue`, `year` (exactly as in the record) |
| authors | `authors`: "Surname, I., Surname, I., et al." (first three, then et al.) |
| institutions | `institution`: first author's institution, if any |
| publication_type | `type`: `thesis` for PhD theses, otherwise `paper` |
| products | `uses`: Home Assistant, ZHA, Z-Wave JS and hardware → `home-assistant`; ESPHome → `esphome`; Voice stack → `piper`; Music Assistant → `other` |
| domain | `fields`: HCI → `hci`; Privacy and security → `security-monitoring`; Energy → `energy`; Software / Systems and IoT → `systems-software`; Health and accessibility → `health-care` or `accessibility`; voice and language work → `voice-language` |
| doi, open_access_url | `links`: `{ label: "Paper", url: <doi url> }`, plus `{ label: "Free copy", url: ... }` if different; `openAccess: true` when there's a free copy |
| summary | `summary` |
| — | `added: <today>`, `peerReviewed: true`, `collectedFrom: automated` (or `submitted` for self-submissions) |

Use an `id` in kebab-case from the title's key words. Then run `npm run build` to check the schema, and leave the changes uncommitted for review.

Also recheck every entry already in `by-others.yml` for retractions (the OpenAlex `is_retracted` flag on its DOI) and tell the user about any that need removing.
