# Inclusion guidelines: Research by others

Source: OHF research page working doc, "Inclusion Guidelines" (Idil, 16 Nov 2026). Keep this file in sync with that doc.

This document decides which published research appears under "Research by others" on the OHF research page. It is written so a person can follow it, and so it can be pasted into an AI agent as its instructions.

The list exists to show that OHF products enable research and knowledge generation beyond the products themselves. Any field qualifies: HCI and user research, privacy and security, energy, software engineering, health, or anything else.

## Instructions for the agent

You are screening research papers for inclusion in a public list. Apply Steps 1 to 5 in order to every candidate.

- Stop at the first step that returns EXCLUDE, and record the reason code.
- If you are unsure at any step, return MANUAL REVIEW. Never guess.
- Take every fact (title, authors, venue, date, DOI) from the source record. Never fill in missing metadata from memory.
- Research that is critical of an OHF product (security flaws, usability problems, privacy concerns) is included on the same terms as positive research. Tone is never a reason to exclude.
- Write plain-language summaries in your own words. Never copy the abstract.

## Scope: which products count

A paper qualifies if it studies or uses at least one product below. Use the search terms in Step 1 and the product names as tags in the output.

| Product | Search terms | Notes |
| --- | --- | --- |
| Home Assistant | "Home Assistant", "Hass.io", "Home Assistant OS", "home-assistant.io" | Main platform. Hass.io is a former name. Includes Home Assistant Core, OS and Supervised. |
| ESPHome | "ESPHome" | Firmware framework for microcontrollers. |
| Music Assistant | "Music Assistant" | Generic phrase; needs the same disambiguation as Home Assistant. |
| Zigbee Home Automation | "ZHA", "Zigbee Home Automation" | Must refer to the Home Assistant integration, not the older Zigbee standard of the same name. |
| Z-Wave JS | "Z-Wave JS", "zwave-js" | Z-Wave driver used by Home Assistant. |
| Voice stack | "Piper" with "text-to-speech", "Wyoming protocol" | Piper is a common word; only count it alongside speech terms. |
| Home Assistant hardware, Cloud, and Link | "Home Assistant Green", "Home Assistant Yellow", "Home Assistant Voice", "Nabu Casa", "Home Assistant Link" | Made by Nabu Casa. Count them, since they run Home Assistant. |

## Step 1: Find candidates

Search OpenAlex first, Semantic Scholar second, then add self-submissions. Do not scrape Google Scholar: it has no official API and does not separate preprints from peer-reviewed work.

Sources:

- OpenAlex (primary). Free, open API. Each record includes publication type, venue, DOI, affiliations, open access status and a retraction flag. API documentation: docs.openalex.org.
- Semantic Scholar (secondary). Use it to catch papers OpenAlex misses.
- Self-submissions from the form on the research page (see Quarterly routine).

Time window:

- First run: everything published from 1 January 2013 (the year Home Assistant started) to today.
- Every later run: everything published in the past 12 months, not just the past 3. Databases often index papers months late, and a 3-month window lets them slip through.

Search queries:

- For each product, search the exact phrases from the Scope table in title, abstract and full text where available.
- For "Home Assistant" and "Music Assistant", require at least one of these terms as well: "home automation", "smart home", "open source", "open-source", "Internet of Things", "IoT", "integration", "automation". These phrases are generic and return many unrelated papers without them.

Clean the candidate set:

- Remove duplicates by DOI. If there is no DOI, match on title (lowercase, no punctuation) plus first author surname.
- Remove anything already on the published list.

## Step 2: Is an OHF product studied or used?

A paper continues only if an OHF product is the subject of the research or the infrastructure it runs on. A mention alone is not enough.

### 2a. Is it actually our product?

- Treat it as an OHF product if the text shows at least one of these: a link to home-assistant.io or the home-assistant GitHub organization; terms such as integration, add-on, automation, YAML, dashboard, Lovelace, HACS or Hass.io; or a description as an open-source home automation platform.
- Refers to commercial voice assistants (Alexa, Google Assistant, Siri), care workers, home robots or a generic "assistant": EXCLUDE, code X-NOTOHF.
- Cannot tell from the abstract, and no full text is available: MANUAL REVIEW, code M-UNCLEAR.

### 2b. How is it involved?

| Level | What it looks like | Decision |
| --- | --- | --- |
| Subject | The product is what is being studied: a usability study of Home Assistant, a security analysis of ESPHome, a survey or interviews with Home Assistant users, a study of the project's GitHub community. | Continue. Tag relevance as "subject". |
| Infrastructure | The research is built or run on the product: an energy management system implemented in Home Assistant, a field study that deploys sensors through ESPHome, a voice interface built on Piper. | Continue. Tag relevance as "infrastructure". |
| Mention only | The product appears only in related work, a list of platforms, a comparison table with no hands-on use, or future work. | EXCLUDE, code X-MENTION. |

If the paper compares several platforms and Home Assistant is one of those actually tested, count it as subject.

## Step 3: What type of publication is it?

Only peer-reviewed work and examined PhD theses qualify. Find the type in the OpenAlex record and the venue name, and apply this table.

| Publication type | Decision |
| --- | --- |
| Journal article | Continue to Step 4. |
| Full conference paper | Continue to Step 4. |
| Short paper, poster, late-breaking work, demo, extended abstract | Continue to Step 4, judging the conference it appeared at. |
| Workshop paper | If the workshop was held alongside a conference, continue to Step 4 and judge that conference. If standalone: MANUAL REVIEW, code M-WORKSHOP. |
| PhD thesis or dissertation from a university | INCLUDE. Skip Step 4; go to Step 5. Quality basis: "PhD thesis". |
| Master's thesis | MANUAL REVIEW, code M-MASTERS. |
| Book chapter in an academic volume | MANUAL REVIEW, code M-CHAPTER. |
| Bachelor's thesis, coursework, student project | EXCLUDE, code X-STUDENT. |
| Preprint (arXiv, SSRN, OSF, TechRxiv, Research Square, bioRxiv, a university repository copy with no venue) | EXCLUDE, code X-PREPRINT. First check whether a published version exists; if it does, screen that version instead. |
| Blog post, white paper, company or industry report, slides, video, patent, dataset without a paper | EXCLUDE, code X-NOTPEER. |

If a paper appears both at a conference and as a later, extended journal version, list the journal version and record the conference version in the reviewer note.

## Step 4: Is the venue good enough?

Check 4a first, then 4b or 4c. The first check that gives a result decides. Record which check passed as the quality basis.

### 4a. Pre-approved venues: PASS

These venues pass without further checks. Match on the venue name in the record, including its proceedings or journal name.

| Venue | Type | Field |
| --- | --- | --- |
| ACM CHI (Conference on Human Factors in Computing Systems) | Conference | HCI |
| ACM CSCW (published in Proceedings of the ACM on Human-Computer Interaction) | Conference / journal | HCI |
| ACM UbiComp / ISWC and Proceedings of the ACM on Interactive, Mobile, Wearable and Ubiquitous Technologies (IMWUT) | Conference / journal | HCI, ubiquitous computing |
| ACM DIS (Designing Interactive Systems) | Conference | HCI |
| ACM IUI (Intelligent User Interfaces) | Conference | HCI |
| ACM MobileHCI | Conference | HCI |
| IFIP INTERACT | Conference | HCI |
| NordiCHI | Conference | HCI |
| ACM Transactions on Computer-Human Interaction (TOCHI) | Journal | HCI |
| International Journal of Human-Computer Studies | Journal | HCI |
| IEEE Symposium on Security and Privacy | Conference | Security |
| USENIX Security Symposium | Conference | Security |
| ACM CCS (Conference on Computer and Communications Security) | Conference | Security |
| NDSS Symposium | Conference | Security |
| SOUPS (Symposium on Usable Privacy and Security) | Conference | Usable privacy |
| Proceedings on Privacy Enhancing Technologies (PETS / PoPETs) | Journal / conference | Privacy |
| IEEE PerCom | Conference | Pervasive computing |
| ACM SenSys | Conference | Sensing, IoT |
| ACM/IEEE IoTDI | Conference | IoT |
| ACM BuildSys | Conference | Smart buildings, energy |
| ACM e-Energy | Conference | Energy systems |
| IEEE Internet of Things Journal | Journal | IoT |
| ACM Transactions on Internet of Things | Journal | IoT |
| IEEE Pervasive Computing | Magazine / journal | Pervasive computing |
| Energy and Buildings | Journal | Energy |
| Applied Energy | Journal | Energy |
| Building and Environment | Journal | Energy, buildings |
| Energy Research & Social Science | Journal | Energy, social science |
| Sustainable Cities and Society | Journal | Energy, urban |
| ICSE (International Conference on Software Engineering) | Conference | Software engineering |
| ACM FSE (Foundations of Software Engineering) | Conference | Software engineering |
| MSR (Mining Software Repositories) | Conference | Software engineering, open source |
| Empirical Software Engineering | Journal | Software engineering |
| IEEE Transactions on Software Engineering | Journal | Software engineering |
| ACM Transactions on Software Engineering and Methodology (TOSEM) | Journal | Software engineering |

### 4b. Conferences not on the list: use the CORE ranking

Look up the conference in the most recent edition of the CORE conference rankings.

- Rank A*, A or B: PASS. Quality basis: "CORE" plus the rank.
- Rank C, unranked, or not found: EXCLUDE, code X-VENUE.

### 4c. Journals not on the list: use the SJR quartile

Look up the journal on Scimago Journal Rank. Use the best quartile across its subject categories for the most recent year listed.

- Q1 or Q2: PASS. Quality basis: "SJR" plus the quartile.
- Q3, Q4, or not listed: EXCLUDE, code X-VENUE.

Journals from MDPI, Frontiers and Hindawi are never pre-approved. Quality varies a lot between their titles, so judge each through 4c.

## Step 5: Check for red flags

Run these checks on every paper that passed Steps 2 to 4. Any match overrides the earlier result.

| Red flag | How to check | Decision |
| --- | --- | --- |
| Retracted | OpenAlex retraction flag, or the retraction notice on the publisher page | EXCLUDE, code X-RETRACTED. If already on the list, remove it. |
| Expression of concern or major correction | Publisher page | EXCLUDE, code X-CONCERN. |
| Possible predatory publisher | No DOI; promises publication within days; no named editorial board; journal name imitates a known one; journal dropped from Scopus | EXCLUDE, code X-PREDATORY. |
| An author is affiliated with OHF | Author affiliations in the record | EXCLUDE, code X-OHF. Pass it to whoever maintains "Research by us". |
| An author is affiliated with Nabu Casa | Author affiliations in the record | EXCLUDE, code X-AFFILIATION. |
| Possible research ethics problem | For example, collecting data from Home Assistant users or instances without consent | MANUAL REVIEW, code M-ETHICS. |

Critical or negative findings about an OHF product are not a red flag.

## Decisions and reason codes

Every candidate ends with one of three decisions: INCLUDE, MANUAL REVIEW or EXCLUDE. Record every reason code that applies, not just the first.

| Code | Decision | Meaning |
| --- | --- | --- |
| X-NOTOHF | EXCLUDE | "Home Assistant" or another term refers to something other than an OHF product. |
| X-MENTION | EXCLUDE | The product is only mentioned, not studied or used. |
| X-PREPRINT | EXCLUDE | Preprint with no published version. |
| X-NOTPEER | EXCLUDE | Not peer-reviewed (blog, report, white paper, slides, patent). |
| X-STUDENT | EXCLUDE | Bachelor's thesis or coursework. |
| X-VENUE | EXCLUDE | Venue is CORE C, SJR Q3 or Q4, or unranked. |
| X-RETRACTED | EXCLUDE | Retracted. |
| X-CONCERN | EXCLUDE | Expression of concern or major correction. |
| X-PREDATORY | EXCLUDE | Signs of a predatory publisher. |
| X-OHF | EXCLUDE | OHF author; pass to "Research by us". |
| X-AFFILIATION | EXCLUDE | Nabu Casa author. |
| X-DUPLICATE | EXCLUDE | Another version of a paper already listed or in this run. |
| M-UNCLEAR | MANUAL REVIEW | Cannot tell whether an OHF product is meant. |
| M-WORKSHOP | MANUAL REVIEW | Standalone workshop paper. |
| M-MASTERS | MANUAL REVIEW | Master's thesis. |
| M-CHAPTER | MANUAL REVIEW | Book chapter. |
| M-ETHICS | MANUAL REVIEW | Possible research ethics problem. |

A paper is INCLUDE only if it passed Steps 2, 3 and 4 and triggered nothing in Step 5.

## Entry fields and output format

The agent returns one record per candidate, including excluded ones, so reviewers can audit the run. Only INCLUDE records appear on the website.

| Field | Content | Shown on site |
| --- | --- | --- |
| decision | INCLUDE, MANUAL REVIEW or EXCLUDE | No |
| reason_codes | List of codes from the table above | No |
| title | Exact title from the record | Yes |
| authors | Full author list, in order | Yes |
| institutions | Author affiliations | Yes |
| year | Publication year | Yes |
| publication_date | Full date if known (YYYY-MM-DD); used for chronological sorting | No |
| venue | Full journal or conference name | Yes |
| publication_type | Journal article, conference paper, short paper, workshop paper, PhD thesis, and so on | Yes |
| doi | DOI, written as https://doi.org/... | Yes, as the main link |
| open_access_url | Link to a free copy, if one exists | Yes |
| products | Tags from the Scope table | Yes, as filters |
| relevance | "subject" or "infrastructure" | Optional |
| domain | One of: HCI and user research; Privacy and security; Energy and sustainability; Software and open source; Systems and IoT; Health and accessibility; Other | Yes, as filters |
| summary | 2 to 3 sentences, at most 60 words, in your own words, for a non-specialist reader. Say what was studied and what was found. | Yes |
| quality_basis | Why it passed: "Pre-approved", "CORE A", "SJR Q1", "PhD thesis", "Manual review" | Optional |
| screened_on | Date of the run | No |
| reviewer_note | Free text: conference version of a journal paper, reasons for manual decisions | No |

## Quarterly routine

The list updates once a quarter, in the first two weeks of January, April, July and October. A named person signs off before anything goes live.

Each quarter:

- Run the agent with this document over the past 12 months, plus any self-submissions since the last run.
- Recheck every paper already on the list for retractions, and remove any that are retracted.
- The reviewer decides every MANUAL REVIEW item and spot-checks INCLUDE items: all of them if there are 10 or fewer, otherwise at least 10.
- The reviewer signs off, and the web team publishes the approved records.
- Record every judgment call in the edge-case log.

Once a year:

- Review the pre-approved venue list, adding venues that keep passing manual review.
- Recheck the CORE rankings and SJR quartiles, which change between editions.

## Self-submission form

Researchers can submit their own work through a form on the research page. Ask for the DOI, which OHF product was studied or used, one line on how, and an optional contact email. Submissions go through Steps 2 to 5 like any other candidate.
