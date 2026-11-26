# Inclusion guidelines: Research by others

Source: OHF research page working doc, "Research by Others: Inclusion Guidelines" (Idil, 16 Nov 2026; new version 25 Nov 2026). Keep this file in sync with that doc.

This document decides which published research appears under "Research by others" on the OHF research page. It is written so a person can follow it, and so it can be pasted into an AI agent as its instructions.

The list exists to show that OHF products enable research and knowledge generation beyond the products themselves. Any field qualifies: HCI and user research, privacy and security, energy, software engineering, health, or anything else.

## Instructions for the agent

1. You are screening research papers for inclusion in a public list. Apply Steps 1 to 5 in order to every candidate.
2. Stop at the first step that returns EXCLUDE, and record the reason code.
3. If you are unsure at any step, return MANUAL REVIEW. Never guess.
4. Take every fact (title, authors, venue, date, DOI) from the source record. Never fill in missing metadata from memory.
5. Research that is critical of an OHF product (security flaws, usability problems, privacy concerns) is included on the same terms as positive research. Tone is never a reason to exclude.
6. Write plain-language summaries in your own words. Never copy the abstract.

## Scope: which products count

A paper qualifies if it studies or uses at least one product below. Use the search terms in Step 1 and the product names as tags in the output. Match product names exactly as written in the Search terms column, including capitalization.

| Product | Search terms | Notes |
| --- | --- | --- |
| Home Assistant | "Home Assistant", "Hass.io", "Home Assistant OS", "home-assistant.io" | Main platform. Hass.io is a former name. Includes Home Assistant Core, OS and Supervised. |
| ESPHome | "ESPHome" | Firmware framework for microcontrollers. |
| Music Assistant | "Music Assistant" | Generic phrase; needs the same disambiguation as Home Assistant. |
| Zigbee Home Automation | "ZHA", "Zigbee Home Automation" | Must refer to the Home Assistant integration, not the older Zigbee standard of the same name. |
| Z-Wave JS | "Z-Wave JS", "zwave-js" | Z-Wave driver used by Home Assistant. |
| Voice stack | "Piper" with "text-to-speech", "Wyoming protocol" | Piper is a common word; only count it alongside speech terms. |
| Home Assistant hardware, Cloud and Link | "Home Assistant Green", "Home Assistant Yellow", "Home Assistant Voice", "Home Assistant Cloud", "Home Assistant Link", "Nabu Casa" | Hardware and services made by Nabu Casa for Home Assistant. Home Assistant Cloud is being renamed Home Assistant Link; search both names. |

If a paper uses an OHF product that is not in this table, screen it as normal and name the product in reviewer_note.

## Step 1: Find candidates

Search OpenAlex first, Semantic Scholar second, then add self-submissions. Do not scrape Google Scholar: it has no official API and does not separate preprints from peer-reviewed work.

**Sources**

- OpenAlex (primary). Free, open API. Each record includes publication type, venue, DOI, affiliations, open access status and a retraction flag. API documentation: docs.openalex.org.
- Semantic Scholar (secondary). Use it to catch papers OpenAlex misses.
- Self-submissions from the form on the research page (see Quarterly routine).

**Time window**

- First run: everything published from 1 January 2013 (the year Home Assistant started) to today.
- Every later run: everything published in the past 12 months, not just the past 3. Databases often index papers months late, and a 3-month window lets them slip through.

**Search queries**

- For each product, search the exact phrases from the Scope table in title, abstract and full text where available.
- For "Home Assistant" and "Music Assistant", require at least one of these terms as well: "home automation", "smart home", "open source", "open-source", "Internet of Things", "IoT", "integration", "automation". These phrases are generic and return many unrelated papers without them.

**Clean the candidate set**

- Remove duplicates by DOI. If there is no DOI, match on title (lowercase, no punctuation) plus first author surname.
- Remove anything already on the published list.

## Step 2: Is an OHF product studied or used?

A paper continues only if an OHF product is the subject of the research or the infrastructure it runs on. In practice, this means at least two exact mentions of the product name in the main body, with at least one in the methods or study setup (see 2b).

**2a. Is it actually our product?**

Treat it as an OHF product if the text shows at least one of these: a link to home-assistant.io or the home-assistant GitHub organization; terms such as integration, add-on, automation, YAML, dashboard, Lovelace, HACS or Hass.io; or a description as an open-source home automation platform.

- Refers to commercial voice assistants (Alexa, Google Assistant, Siri), care workers, home robots or a generic "assistant": EXCLUDE, code X-NOTOHF.
- Cannot tell from the abstract, and no full text is available: MANUAL REVIEW, code M-UNCLEAR.

**2b. How is it involved?**

Count how many times the product name appears in the main body, matched exactly as written in the Scope table, including capitalization. The main body runs from the introduction to the conclusion. Do not count the title, abstract, references, appendices, acknowledgements or footnotes.

- Fewer than two exact mentions in the main body: EXCLUDE, code X-MENTION.
- No mention in the methods or study setup: EXCLUDE, code X-MENTION. Count any section that describes how the study was run or the system was built, whatever its title: Method, Study design, Setup, Implementation, System, Materials, Apparatus.
- Two or more mentions, with at least one in the methods or study setup: continue, and tag the relevance level from the table below.
- No full text available to check (no open copy):
  - If the abstract says the work is built on, runs on or evaluates the product: continue, and add "abstract only" to reviewer_note. Treat the mention count as met.
  - If the product is named only in the full text, not the title or abstract: EXCLUDE, code X-MENTION.
  - If there is no abstract, or it doesn't say how the product is used: MANUAL REVIEW, code M-UNCLEAR.

| Relevance | What it looks like |
| --- | --- |
| Subject | The product is what is being studied: a usability study of Home Assistant, a security analysis of ESPHome, a survey or interviews with Home Assistant users, a study of the project's GitHub community. |
| Infrastructure | The research is built or run on the product, even if the paper describes it only briefly: an energy management system implemented in Home Assistant, a field study that deploys sensors through ESPHome, a voice interface built on Piper. |

If the paper compares several platforms and Home Assistant is one of those actually tested, count it as subject.

## Step 3: What type of publication is it?

Peer-reviewed work, preprints that were later published, and master's and PhD theses qualify. Find the type in the OpenAlex record and the venue name, and apply this table.

Only work written in English qualifies. Check the language field in the OpenAlex record, and the text itself if the field is empty. If the work is not in English: EXCLUDE, code X-LANGUAGE.

| Publication type | Decision |
| --- | --- |
| Journal article | Continue to Step 4. |
| Full conference paper | Continue to Step 4. |
| Short paper, poster, late-breaking work, demo, extended abstract | Continue to Step 4, judging the conference it appeared at. |
| Workshop paper | Skip Step 4; go to Step 5. Quality basis: "Workshop paper". |
| Book chapter in an academic volume | Skip Step 4; go to Step 5. Quality basis: "Book chapter". |
| PhD thesis or dissertation from a university | Skip Step 4; go to Step 5. Set label to "PhD thesis". Quality basis: "Thesis". |
| Master's thesis from a university (MSc, MA, MEng or similar) | Skip Step 4; go to Step 5. Set label to "Master's thesis". Quality basis: "Thesis". |
| Thesis with no degree level stated | Check the title page and the university repository record. If the level is found, apply the matching row. If not: EXCLUDE, code X-DEGREE. |
| Preprint (arXiv, SSRN, OSF, TechRxiv, Research Square, bioRxiv, a university repository copy with no venue) | Look for a published version: check the other locations in the OpenAlex record, search the exact title, and check the preprint page for a DOI or "published in" note. If found, screen the published version from Step 3 onward and put the preprint link in open_access_url. If not found: EXCLUDE, code X-PREPRINT. |
| Bachelor's thesis, coursework, student project, internship report | EXCLUDE, code X-STUDENT. |
| Blog post, white paper, company or industry report, slides, video, patent, dataset without a paper | EXCLUDE, code X-NOTPEER. |

If a paper appears both at a conference and as a later, extended journal version, list the journal version and record the conference version in the reviewer note.

## Step 4: Is the venue good enough?

Check the paper's venue against the two pre-approved lists in 4a. If it is on either list, it passes, and the quality basis is "Pre-approved". If not, apply 4b or 4c.

Do not look up rankings on the CORE or Scimago websites; both block automated access. The lists in 4a are the only source of venue approval in this version.

**4a. Pre-approved venues: PASS**

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

The venues below are also pre-approved. Match on the OpenAlex source ID of the paper's primary location first, then the ISSN, then the name.

| Venue | Type | ISSN | OpenAlex source ID |
| --- | --- | --- | --- |
| Advances in Engineering Research | Book series | 2352-5401, 2731-8079 | S4210215495 |
| Applied Sciences | Journal | 2076-3417 | S4210205812 |
| Automation | Journal | 2673-4052 | S4210241158 |
| Computers | Journal | 2073-431X | S4210228075 |
| Conference on Human System Interactions | Conference | — | S4306418059 |
| E3S Web of Conferences | Conference | 2267-1242, 2555-0403 | S4210186093 |
| Energies | Journal | 1996-1073 | S198098182 |
| EPJ Web of Conferences | Conference | 2100-014X, 2101-6275 | S19068271 |
| eSim: IBPSA-Canada Building Simulation Conference | Conference | — | S7407096442 |
| IEEE Consumer Communications and Networking Conference | Conference | 2331-9852 | S4393918466 |
| IEEE International Conference on AI in Cybersecurity (ICAIC) | Conference | — | S7407087862 |
| IEEE Jornadas Costarricenses de Investigación en Computación e Informática (JoCICI) | Conference | — | S7407115708 |
| IEEE Mediterranean Electrotechnical Conference (MELECON) | Conference | — | S4363607984 |
| IEEE Sensors Journal | Journal | 1530-437X, 1558-1748, 2379-9153 | S189694085 |
| IEEE Transactions on Neural Systems and Rehabilitation Engineering | Journal | 1534-4320, 1558-0210 | S98183460 |
| IET Conference Proceedings | Conference | 2732-4494 | S4404663355 |
| International Conference in Electronic Engineering & Information Technology (EEITE) | Conference | — | S7407097424 |
| International Conference on Communications and Signal Processing (ICCSP) | Conference | — | S7407088826 |
| International Conference on Computational Problems of Electrical Engineering (CPEE) | Conference | — | S7407086563 |
| International Conference on Computer and Applications (ICCA) | Conference | — | S7407088272 |
| International Conference on Evaluation of Novel Approaches to Software Engineering | Conference | — | S4306419450 |
| International Conference on Recent Advances in Electrical, Electronics, Ubiquitous Communication, and Computational Intelligence (RAEEUCCI) | Conference | — | S7407087136 |
| International Conference on Robotics, Control and Automation (ICRCA) | Conference | — | S7407087357 |
| International Conference on Tangible, Embedded, and Embodied Interaction (TEI) | Conference | — | S7407087804 |
| International Conference on Vocational Education and Electrical Engineering (ICVEE) | Conference | — | S7407088934 |
| International Electronic Conference on Sensors and Applications (ECSA) | Conference | — | S4306523398 |
| International Electronics Symposium (IES) | Conference | — | S4363606619 |
| International Journal for Research in Applied Science and Engineering Technology | Journal | 2321-9653 | S2764566388 |
| International Journal of Advanced Multidisciplinary | Journal | 2829-6184, 2829-6192 | S4394736141 |
| International Journal of Drug Delivery Technology | Journal | 0975-4415 | S4210211336 |
| International Journal of Engineering Continuity | Journal | 2963-2390 | S4387285918 |
| International Journal of Engineering Research and Science & Technology | Journal | 2319-5991 | S5406990484 |
| International Journal of Network Security & Its Applications | Journal | 0974-9330, 0975-2307 | S4210203298 |
| Internet of Things | Journal | 2542-6605, 2543-1536 | S4210174276 |
| IOP Conference Series Earth and Environmental Science | Conference | 1755-1315, 1755-1307 | S4210195883 |
| Issues in Information Systems | Journal | 1529-7314, 2331-3838 | S4210199647 |
| JATI EMAS (Jurnal Aplikasi Teknik dan Pengabdian Masyarakat) | Journal | 2550-0821 | S4210218489 |
| Journal of Advanced Vocational Information and Communication Technology | Journal | 3124-0437 | S7407055527 |
| Journal of Artificial Intelligence and Technology Information (JAITI) | Journal | 2985-5306, 2985-6396 | S4387287428 |
| Journal of Systems Architecture | Journal | 1383-7621, 1873-6165 | S127660348 |
| Journal of Telecommunication Electronics and Control Engineering (JTECE) | Journal | 2654-8275 | S4210238274 |
| Journal of the Brazilian Computer Society | Journal | 0104-6500, 1678-4804 | S69801987 |
| Jurnal Teknologi Terapan G-Tech | Journal | 2580-8737, 2623-064X | S4210231345 |
| Lecture Notes in Networks and Systems | Book series | 2367-3389, 2367-3370 | S4210169156 |
| Proceedings XoveTIC (any year) | Conference | — | — (match on the name "XoveTIC") |
| Research on Modern science and Utilizing Technological Innovation Journal (RMUTI Journal) | Journal | 3027-6756 | S7407066269 |
| Scientific Reports | Journal | 2045-2322 | S196734849 |
| Sensors | Journal | 1424-8220 | S101949793 |
| Simpósio Brasileiro de Testes de Software Sistemático e Automatizado (SAST) | Conference | — | S7407115429 |
| Smart Agricultural Technology | Journal | 2772-3755 | S4210238883 |
| Symposium on Internet of Things (SIoT) | Conference | — | S7407087744 |
| Technology audit and production reserves | Journal | 2226-3780, 2312-8372, 2664-9969, 2706-5448 | S2764402084 |

**Reviewed and not approved**

The research team reviewed these venues (25 Nov 2026) and did not approve them. They stay X-VENUE; don't put them up for review again unless the team asks.

| Venue | OpenAlex source ID | Reason |
| --- | --- | --- |
| 2026 16th International Conference on Power, Energy, and Electrical Engineering (CPEEE) | — | Not approved |
| Academic Journal of Emerging Technologies | S5407050982 | Not approved |
| Aerospace technic and technology | S4210182258 | language |
| Anais do XVIII Simpósio Brasileiro de Computação Ubíqua e Pervasiva (SBCUP 2026) | — | Not approved |
| Arabian journal of science. | S7407075335 | language |
| Archiving Conference | S4210214950 | Not approved |
| Bulletin of the National Engineering Academy of the Republic of Kazakhstan | S4210198950 | language |
| DOAJ (DOAJ: Directory of Open Access Journals) | S4306401280 | check later |
| Electrotehnica Electronica Automatica | S4210171096 | Not approved |
| European Journal of Applied Science Engineering and Technology | S5407030798 | weird vibes. Offering discount and notifications on the website |
| Herald of Khmelnytskyi National University Technical sciences | S4210218115 | language |
| Indonesian Journal of Multidisciplinary on Social and Technology | S4387289437 | language |
| Informatics | S4210210458 | language |
| INTERANTIONAL JOURNAL OF SCIENTIFIC RESEARCH IN ENGINEERING AND MANAGEMENT | S4210240841 | flagged by Claude as low quality |
| International Conference on Electronics, Computers and Artificial Intelligence (ECAI) | S4363608455 | Not approved |
| International Journal of Innovative Research in Technology | S5407050925 | flagged by Claude as low level |
| International Research Journal of Modernization in Engineering Technology and Science | S4387282513 | Not approved |
| Jurnal Penelitian Inovatif | S4210230595 | language |
| Jurnal Pustaka Robot Sister | S4404670303 | language |
| Jurnal Teknologi Industri | S4394736593 | Not approved |
| Revista fisio&terapia. | S4404677285 | language |
| Scientific Notes of Junior Academy of Sciences of Ukraine | S4210171988 | website difficult to find |
| Simpósio Brasileiro de Jogos e Entretenimento Digital (SBGames) | S7407096996 | language |
| Вестник Воронежского государственного технического университета | S4306538432 | Cyrillic |
| ГРААЛЬ НАУКИ | S4210217841 | Cyrillic |
| Наука і техніка сьогодні | S4220651744 | Cyrillic |
| Репозиторий БГУИР (BSUIR Repository) | S4406923062 | language |

**4b. Conferences not on the list**

EXCLUDE, code X-VENUE.

This includes short papers, posters, demos and extended abstracts at conferences not on the list.

**4c. Journals and book series not on the list**

EXCLUDE, code X-VENUE. Also record the venue's citation metrics from its OpenAlex source record in the venue_metrics field. OHF will use these to set an automatic quality threshold in a later version, so record them even though the paper is excluded:

- `2yr_mean_citedness` (from summary_stats)
- `h_index` (from summary_stats)
- `works_count`

MDPI, Frontiers and Hindawi journals pass only if listed in 4a.

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
| X-MENTION | EXCLUDE | The exact product name appears fewer than two times in the main body, or never in the methods or study setup. |
| X-LANGUAGE | EXCLUDE | Not written in English. |
| X-PREPRINT | EXCLUDE | Preprint with no published version found. |
| X-NOTPEER | EXCLUDE | Not peer-reviewed (blog, report, white paper, slides, patent). |
| X-STUDENT | EXCLUDE | Bachelor's thesis, coursework, student project or internship report. |
| X-DEGREE | EXCLUDE | Thesis whose degree level cannot be found. |
| X-VENUE | EXCLUDE | Venue is not on either pre-approved list. For journals and book series, venue_metrics is filled in. |
| X-RETRACTED | EXCLUDE | Retracted. |
| X-CONCERN | EXCLUDE | Expression of concern or major correction. |
| X-PREDATORY | EXCLUDE | Signs of a predatory publisher. |
| X-OHF | EXCLUDE | OHF author; pass to "Research by us". |
| X-AFFILIATION | EXCLUDE | Nabu Casa author. |
| X-DUPLICATE | EXCLUDE | Another version of a paper already listed or in this run. |
| M-UNCLEAR | MANUAL REVIEW | Cannot tell whether an OHF product is meant, or no full text to check mentions in. |
| M-ETHICS | MANUAL REVIEW | Possible research ethics problem. |

A paper is INCLUDE only if it passed Steps 2 and 3, passed Step 4 where it applies, and triggered nothing in Step 5.

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
| venue | Full journal or conference name; for theses, the university | Yes |
| venue_openalex_id | OpenAlex source ID of the paper's primary location | No |
| publication_type | Journal article, conference paper, short paper, workshop paper, book chapter, Master's thesis or PhD thesis | Yes |
| label | Exactly "Master's thesis" or "PhD thesis" for theses; empty for everything else | Yes, as a visible tag on the entry |
| doi | DOI, written as https://doi.org/... | Yes, as the main link |
| open_access_url | Link to a free copy, if one exists, including the preprint of a published paper | Yes |
| products | Tags from the Scope table | Yes, as filters |
| relevance | "subject" or "infrastructure" | Optional |
| domain | One of: HCI and user research; Privacy and security; Energy and sustainability; Software and open source; Systems and IoT; Health and accessibility; Other | Yes, as filters |
| summary | 2 to 3 sentences, at most 60 words, in your own words, for a non-specialist reader. Say what was studied and what was found. | Yes |
| quality_basis | Why it passed: "Pre-approved", "Workshop paper", "Book chapter", "Thesis" or "Manual review" | Optional |
| venue_metrics | Only for journals and book series excluded under X-VENUE: 2yr_mean_citedness, h_index and works_count from OpenAlex | No |
| screened_on | Date of the run | No |
| reviewer_note | Free text: conference version of a journal paper, OHF products not in the Scope table, reasons for manual decisions | No |

Example record:

```json
{
  "decision": "INCLUDE",
  "reason_codes": [],
  "title": "Example title of a study on smart home automations",
  "authors": ["A. Researcher", "B. Researcher"],
  "institutions": ["Example University"],
  "year": 2025,
  "publication_date": "2025-04-26",
  "venue": "Proceedings of the 2025 CHI Conference on Human Factors in Computing Systems",
  "publication_type": "Conference paper",
  "label": null,
  "doi": "https://doi.org/10.xxxx/xxxxx",
  "open_access_url": null,
  "products": ["Home Assistant"],
  "relevance": "subject",
  "domain": "HCI and user research",
  "summary": "Plain-language summary in the agent's own words.",
  "quality_basis": "Pre-approved",
  "screened_on": "2026-01-05",
  "reviewer_note": ""
}
```

## Quarterly routine

The list updates once a quarter, in the first two weeks of January, April, July and October. A named person signs off before anything goes live.

**Each quarter**

1. Run the agent with this document over the past 12 months, plus any self-submissions since the last run.
2. Recheck every paper already on the list for retractions, and remove any that are retracted.
3. The reviewer decides every MANUAL REVIEW item and spot-checks INCLUDE items: all of them if there are 10 or fewer, otherwise at least 10.
4. The reviewer signs off, and the web team publishes the approved records.
5. Record every judgment call in the edge-case log below.

**Once a year**

- Review the pre-approved venue lists. Skim the year's X-VENUE exclusions for strong work in venues worth adding.
- Use the venue_metrics collected under X-VENUE to set an automatic quality threshold for journals not on the lists.

**Self-submission form**

Researchers can submit their own work through a form on the research page. Ask for the DOI, which OHF product was studied or used, one line on how, and an optional contact email. Submissions go through Steps 2 to 5 like any other candidate.

**Edge-case log**

When a manual decision sets a precedent, add it here so later runs and reviewers decide the same way.

| Date | Paper | Question | Decision | Rule change |
| --- | --- | --- | --- | --- |
| 2026-11-26 | "IoT based smart home automation using AI voice assistant capabilities" (University of Thessaly) | Does a Greek "Diploma Thesis" count as a master's? | No: treat as bachelor's. EXCLUDE X-STUDENT. | Greek Diploma theses are X-STUDENT. |
| 2026-11-26 | "Gamifying Sustainability" (FEUP, listed as "Dissertação") | Can the degree level be inferred from the repository's thesis type? | No: only trust a degree level that is stated outright. EXCLUDE X-DEGREE. | A degree inferred from a thesis type or national convention is X-DEGREE. |
| 2026-11-26 | "GoodWatts" (Iterative International Publishers book chapter) | Is IIP an academic volume publisher? | No: the publisher's site looks untrustworthy (AI-generated visuals). EXCLUDE X-PREDATORY. | Iterative International Publishers (IIP Series) is X-PREDATORY. |
| 2026-11-26 | 28 papers in the 26 Nov run with no open copy | Can Step 2b pass without full text? | Yes, when the abstract says the product is used. When the full text could be read, 20 of 22 such papers passed. | Abstract-only rule in Step 2b (agreed by Dan Long). |
| 2026-11-26 | "Decentralized HAOS" and "Multi-agent System for Intelligent Heating Control" (Springer, paywalled) | Should paywalled papers be included? | Yes: researchers can usually get them through their institution, ResearchGate or Academia.edu. INCLUDE. | A paywall is never a reason to exclude. When OpenAlex has no abstract, check the abstract on the publisher's page. |
| 2026-11-26 | "Design and evaluation of a web app to foster energy saving in families" (University of Vienna) | German abstract: is the thesis in English? | Yes: only the abstract is German. INCLUDE. | Judge the language by the main text, not the abstract. |
| 2026-11-26 | "An Analysis of Matter IoT Security Against International Standards and Regulatory Framework" (SDIoTSec) | Does comparing ecosystems, including Home Assistant, count as using it? | Yes: it compares how ecosystems such as Google Nest and Home Assistant handle Matter security. INCLUDE. | A comparison that assesses the product alongside others passes Step 2b, even with no system build. |
| 2026-11-26 | "iTantra" (IJRASET) | Does "such as Piper and eSpeak" mean Piper is used? | Yes: the paper's setup says it uses both engines to generate speech. INCLUDE. | Check the setup section before treating a "such as" mention as an example only. |

Manual review items and quarterly sign-off are handled by the OHF research team. The agent only proposes; it never publishes.
