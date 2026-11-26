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

- queries OpenAlex without an API key, using the Scope table's search terms (Step 1). It costs about $0.02 a run against a shared $0.10/day keyless budget. If it hits the daily budget, it stops at once (exit code 2) and keeps what it has: the output file is saved after each product query, and its `complete` and `not_queried` fields say which products are missing. Wait a day, or pass a narrower `--since`.
- removes duplicates, and anything already in `by-others.yml`. A preprint whose published version is also in the run becomes X-DUPLICATE, and its link goes on the published record as `open_access_url`.
- applies every check that needs no judgement:
  - Step 3: language (X-LANGUAGE), preprints with no published location in the OpenAlex record (X-PREPRINT), non-peer-reviewed types (X-NOTPEER). A preprint with a published location is screened as that published version.
  - Step 4: both pre-approved lists in 4a. The second list matches on OpenAlex source ID, then ISSN, then name (`PRE_APPROVED_SOURCES`). Anything else is X-VENUE. For journals and book series it fetches `venue_metrics` from the OpenAlex source record. Theses, book chapters and workshop papers skip Step 4.
  - Step 5: retraction flag (X-RETRACTED), OHF and Nabu Casa affiliations (X-OHF, X-AFFILIATION).
- writes `research-candidates/<date>.json` (gitignored). Records are `EXCLUDE` (mechanical) or `PENDING`, with `matched_in`, `abstract` and `hints`.

When the guidelines' venue lists change, update `PRE_APPROVED_VENUES` and `PRE_APPROVED_SOURCES` in the lib to match, and run `npm test`. Venues the team reviewed and turned down are listed under "Reviewed and not approved" in the guidelines; they stay X-VENUE, so don't put them up for review again.

When the reviewer settles a judgement call (a degree, a publisher, a venue), add it to the edge-case log in the guidelines, and to the lib if a script can apply it, so later runs decide the same way.

Semantic Scholar (the secondary source) isn't automated yet. Self-submissions come from GitHub issues on OpenHomeFoundation/user-research; ask the user for any to include and screen them alongside.

## 2. Fetch full text (mechanical)

```sh
npm run research:fulltext -- research-candidates/<date>.json
```

[scripts/research-fulltext.mjs](../../../scripts/research-fulltext.mjs) (logic in [src/lib/research-fulltext.mjs](../../../src/lib/research-fulltext.mjs)) looks for an open copy of every PENDING record. It tries the OpenAlex open-access and PDF links, Crossref full-text links, Semantic Scholar's open-access PDF and arXiv copy, DSpace and DiVA repository downloads, then the DOI page. It identifies itself honestly and never tries to get past a publisher's block. It saves after every 10 records, so it can be rerun to pick up where it stopped.

For each copy it reads, it fills `fulltext` with the exact, case-sensitive mention count in the main body (introduction to references), the section each mention falls in, context snippets, the thesis degree from the title pages and an English check. It then excludes mechanically:

- not in English: X-LANGUAGE
- thesis whose title pages say bachelor's (or a Greek Diploma Thesis): X-STUDENT
- fewer than two mentions in the body: X-MENTION

Records it couldn't read get `fulltext.status: "unavailable"` and stay PENDING.

## 3. Screen the PENDING records (judgement)

Work through the JSON in batches (read it with `jq` or a short script, never all at once). For each PENDING record, apply the judgement parts of Steps 2, 3 and 5 and fill `decision`, `reason_codes`, `label`, `relevance`, `domain`, `quality_basis`, `summary` and `reviewer_note`. Don't reopen mechanical EXCLUDE records.

- **`fulltext.status: "read"`** (two or more mentions): use `fulltext.sections` and `fulltext.snippets` for Step 2a (is it our product?) and 2b (is a mention in the methods or setup, whatever the section is called?). Section labels are a best guess from headings, so read the snippets. All mentions in background, related work or conclusions: X-MENTION.
- **`fulltext.status: "unavailable"`**: decide from the record when it settles the question. `matched_in: "full text only"` with no sign in the title, venue or abstract that the product was studied or used: X-MENTION, note "full-text-only match". An abstract that shows the term means something else (a generic "smart home assistant", Alexa): X-NOTOHF. An abstract that says the work is built on, runs on or evaluates the product: carry on as if Step 2b passed, and start `reviewer_note` with "Abstract only: no open copy to count mentions." (the abstract-only rule in Step 2b). No abstract, or it doesn't say how the product is used: MANUAL REVIEW M-UNCLEAR, giving the reviewer the DOI to check.
- **Theses** (`quality_basis: "Thesis"`): find the degree level from the record, abstract, title page or repository page. PhD sets `label: "PhD thesis"`; master's sets `label: "Master's thesis"`; bachelor's or applied-sciences final project is X-STUDENT; not found is X-DEGREE.
  - Only trust a degree level that is stated outright. Don't infer it from a thesis type or national convention (for example a Portuguese "Dissertação"): that is X-DEGREE.
  - A Greek "Diploma Thesis" counts as a bachelor's: X-STUDENT.
- **Book chapters**: a chapter in an academic volume gets `quality_basis: "Book chapter"`. A conference paper published as a chapter in a proceedings series isn't one: judge the conference, which is X-VENUE unless it is in 4a. Iterative International Publishers (IIP Series) is X-PREDATORY; the script flags it (`PREDATORY_PUBLISHERS`).
- Before asking the reviewer about a judgement call, check the edge-case log at the end of the guidelines; earlier decisions there set the rule.
- **Workshop papers** (`quality_basis: "Workshop paper"`) skip Step 4 but get Steps 2 and 5 like everything else.
- **Step 5** red flags that need a look: X-PREDATORY, X-CONCERN, M-ETHICS.
- Never look up CORE or SCImago, and never rank a venue from memory. The 4a lists are the only venue approval.
- When OpenAlex returns 429 with `daily_budget`, the shared keyless allowance is used up. Stop, say so, and use Crossref (`api.crossref.org/works`) for metadata lookups until it resets.
- Take every fact from the record. Write summaries in your own words, at most 60 words, never copied from the abstract.

Save the screened records back to the same JSON file.

## 4. Report for review

Give the user a short report:

- counts per decision and reason code
- every INCLUDE: title, venue, year, label (for theses), quality basis, one-line summary
- every MANUAL REVIEW: title and the question the reviewer needs to answer
- if there was an earlier run, what changed against it

Ask who is signing off. Spot checks: all INCLUDE items if there are 10 or fewer, otherwise at least 10.

## 5. Publish approved entries

After sign-off, add each approved record to `by-others.yml`, which has no sections: every entry in it shows on the page. Put new entries above older ones, ordered by year descending, then title. Map the fields:

| Guideline field | by-others.yml |
| --- | --- |
| title, venue, year | `title`, `venue`, `year` (exactly as in the record) |
| authors | `authors`: "Surname, I., Surname, I., et al." (first three, then et al.) |
| institutions | `institution`: first author's institution, if any |
| publication_type | `type`: `thesis` for PhD and master's theses, otherwise `paper` |
| products | `uses`: Home Assistant, ZHA, Z-Wave JS and hardware → `home-assistant`; ESPHome → `esphome`; Voice stack → `piper`; Music Assistant → `other` |
| domain | `fields`: HCI → `hci`; Privacy and security → `security-monitoring`; Energy → `energy`; Software / Systems and IoT → `systems-software`; Health and accessibility → `health-care` or `accessibility`; voice and language work → `voice-language` |
| doi, open_access_url | `links`: `{ label: "Paper", url: <doi url> }`, plus `{ label: "Free copy", url: ... }` if different; `openAccess: true` when there's a free copy |
| summary | `summary` |
| — | `added: <today>`, `collectedFrom: automated` (or `submitted` for self-submissions) |

Use an `id` in kebab-case from the title's key words. Only use fields defined in the `researchByOthers` schema in [src/content.config.ts](../../../src/content.config.ts): the schema drops unknown keys without an error. It has no field for `label` yet, so the "Master's thesis" / "PhD thesis" tag can't be shown until one is added. Then run `npm run build` to check the schema, and leave the changes uncommitted for review.

Also recheck every entry already in `by-others.yml` for retractions (the OpenAlex `is_retracted` flag on its DOI) and tell the user about any that need removing.
