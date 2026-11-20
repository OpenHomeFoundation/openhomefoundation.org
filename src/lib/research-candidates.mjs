const CONTEXT_TERMS = [
  "home automation",
  "smart home",
  "open source",
  "open-source",
  "Internet of Things",
  "IoT",
  "integration",
  "automation",
];

const anyOf = (terms) => `(${terms.map((t) => `"${t}"`).join(" OR ")})`;

export const PRODUCTS = [
  {
    tag: "Home Assistant",
    use: "home-assistant",
    query: `${anyOf(["Home Assistant", "Hass.io", "Home Assistant OS", "home-assistant.io"])} AND ${anyOf(CONTEXT_TERMS)}`,
  },
  { tag: "ESPHome", use: "esphome", query: `"ESPHome"` },
  {
    tag: "Music Assistant",
    use: "other",
    query: `"Music Assistant" AND ${anyOf(CONTEXT_TERMS)}`,
  },
  {
    tag: "Zigbee Home Automation",
    use: "home-assistant",
    query: `${anyOf(["ZHA", "Zigbee Home Automation"])} AND "Home Assistant"`,
  },
  { tag: "Z-Wave JS", use: "home-assistant", query: anyOf(["Z-Wave JS", "zwave-js"]) },
  {
    tag: "Voice stack",
    use: "piper",
    query: `("Piper" AND ${anyOf(["text-to-speech", "TTS", "speech synthesis"])}) OR "Wyoming protocol"`,
  },
  {
    tag: "Home Assistant hardware, Cloud, and Link",
    use: "home-assistant",
    query: anyOf(["Home Assistant Green", "Home Assistant Yellow", "Home Assistant Voice", "Nabu Casa", "Home Assistant Link"]),
  },
];

export const PRE_APPROVED_VENUES = [
  /\bCHI\b.*Human Factors in Computing Systems|Conference on Human Factors in Computing Systems/i,
  /Proceedings of the ACM on Human-Computer Interaction|\bCSCW\b/i,
  /Interactive,? Mobile,? Wearable and Ubiquitous Technologies|\bIMWUT\b|\bUbiComp\b|\bISWC\b/i,
  /Designing Interactive Systems|\bDIS '?\d/i,
  /Intelligent User Interfaces|\bIUI\b/i,
  /\bMobileHCI\b|Human-Computer Interaction with Mobile Devices/i,
  /\bINTERACT\b/,
  /\bNordiCHI\b|Nordic Conference on Human-Computer Interaction/i,
  /Transactions on Computer-Human Interaction|\bTOCHI\b/i,
  /International Journal of Human-Computer Studies/i,
  /IEEE Symposium on Security and Privacy/i,
  /USENIX Security/i,
  /Computer and Communications Security|\bCCS\b/i,
  /\bNDSS\b|Network and Distributed System Security/i,
  /\bSOUPS\b|Symposium on Usable Privacy and Security/i,
  /Privacy Enhancing Technologies|\bPoPETs\b/i,
  /\bPerCom\b|Pervasive Computing and Communications/i,
  /\bSenSys\b|Embedded Networked Sensor Systems/i,
  /\bIoTDI\b|Internet-of-Things Design and Implementation/i,
  /\bBuildSys\b|Systems for Energy-Efficient Buildings/i,
  /\be-Energy\b|Future Energy Systems/i,
  /IEEE Internet of Things Journal/i,
  /ACM Transactions on Internet of Things/i,
  /IEEE Pervasive Computing/i,
  /^Energy and Buildings$/i,
  /^Applied Energy$/i,
  /^Building and Environment$/i,
  /^Energy Research (&|and) Social Science$/i,
  /^Sustainable Cities and Society$/i,
  /International Conference on Software Engineering|\bICSE\b/i,
  /Foundations of Software Engineering|\bESEC\/FSE\b|\bFSE\b/i,
  /Mining Software Repositories|\bMSR\b/i,
  /^Empirical Software Engineering$/i,
  /IEEE Transactions on Software Engineering/i,
  /Transactions on Software Engineering and Methodology|\bTOSEM\b/i,
];

const NEVER_PRE_APPROVED = /\bMDPI\b|Frontiers|Hindawi/i;

const PREPRINT_SOURCES = /arXiv|SSRN|\bOSF\b|TechRxiv|Research Square|bioRxiv|medRxiv|Preprints\.org/i;

export function normaliseDoi(doi) {
  if (!doi) return null;
  return doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
    .replace(/^doi:/, "");
}

export function normaliseTitle(title) {
  return (title ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function surname(name) {
  const parts = (name ?? "").trim().split(/\s+/);
  return normaliseTitle(parts[parts.length - 1] ?? "");
}

export function workKey(work) {
  const doi = normaliseDoi(work.doi);
  if (doi) return `doi:${doi}`;
  return `title:${normaliseTitle(work.title)}|${surname(work.authorships?.[0]?.author?.display_name)}`;
}

/** DOIs and normalised titles already on the published list, read from by-others.yml text. */
export function existingKeys(byOthersYaml) {
  const dois = new Set();
  const titles = new Set();
  for (const m of byOthersYaml.matchAll(/doi\.org\/([^\s"'}]+)/gi)) dois.add(normaliseDoi(m[1]));
  for (const m of byOthersYaml.matchAll(/^[\s-]*title:\s*["']?(.+?)["']?\s*$/gm)) titles.add(normaliseTitle(m[1]));
  return { dois, titles };
}

export function isAlreadyListed(work, existing) {
  const doi = normaliseDoi(work.doi);
  return (doi && existing.dois.has(doi)) || existing.titles.has(normaliseTitle(work.title));
}

export function abstractText(index) {
  if (!index) return null;
  const words = [];
  for (const [word, positions] of Object.entries(index)) for (const p of positions) words[p] = word;
  return words.filter(Boolean).join(" ");
}

const PRODUCT_TERMS =
  /Home Assistant|Hass\.io|home-assistant\.io|ESPHome|Music Assistant|\bZHA\b|Zigbee Home Automation|Z-Wave JS|zwave-js|\bPiper\b|Wyoming protocol|Nabu Casa/i;

/** Where the product terms appear: "title/abstract", or "full text only" (more likely a passing mention). */
export function matchedIn(work, abstract) {
  return PRODUCT_TERMS.test(`${work.title ?? ""} ${abstract ?? ""}`) ? "title/abstract" : "full text only";
}

const venueOf = (work) => work.primary_location?.source?.display_name ?? work.primary_location?.raw_source_name ?? null;

/**
 * The mechanical parts of the inclusion guidelines: retraction flag, affiliations,
 * publication type from the record, and pre-approved venues. Steps that need
 * judgement (subject vs mention, CORE/SJR, ethics) are left as PENDING.
 */
export function prescreen(work) {
  const codes = [];
  const hints = [];
  const venue = venueOf(work);
  const sourceType = work.primary_location?.source?.type;
  const institutions = (work.authorships ?? []).flatMap((a) => [
    ...(a.institutions ?? []).map((i) => i.display_name),
    ...(a.raw_affiliation_strings ?? []),
  ]);

  if (work.is_retracted) codes.push("X-RETRACTED");
  if (institutions.some((i) => /Open Home Foundation/i.test(i))) codes.push("X-OHF");
  if (institutions.some((i) => /Nabu Casa/i.test(i))) codes.push("X-AFFILIATION");

  const type = work.type;
  if (type === "preprint" || (sourceType === "repository" && PREPRINT_SOURCES.test(venue ?? ""))) {
    codes.push("X-PREPRINT");
    hints.push("Check whether a published version exists; if so, screen that instead.");
  } else if (["dataset", "software", "paratext", "report", "standard", "grant", "peer-review", "other"].includes(type)) {
    codes.push("X-NOTPEER");
  } else if (type === "dissertation") {
    hints.push("Dissertation: PhD thesis is INCLUDE (skip Step 4); master's is M-MASTERS; bachelor's is X-STUDENT.");
  } else if (type === "book-chapter") {
    hints.push("Book chapter: if in an academic volume, M-CHAPTER; if conference proceedings, judge the conference.");
  }

  let qualityBasis = null;
  if (venue && !NEVER_PRE_APPROVED.test(venue) && PRE_APPROVED_VENUES.some((re) => re.test(venue))) {
    qualityBasis = "Pre-approved";
  } else if (venue && NEVER_PRE_APPROVED.test(venue)) {
    hints.push("MDPI/Frontiers/Hindawi: never pre-approved; check the SJR quartile (Step 4c).");
  }

  return {
    decision: codes.length ? "EXCLUDE" : "PENDING",
    reason_codes: codes,
    quality_basis: qualityBasis,
    hints,
  };
}

/** One record per candidate, in the guidelines' output format. */
export function toRecord(work, products, screenedOn) {
  const screen = prescreen(work);
  const abstract = abstractText(work.abstract_inverted_index);
  return {
    decision: screen.decision,
    reason_codes: screen.reason_codes,
    title: work.title ?? work.display_name ?? null,
    authors: (work.authorships ?? []).map((a) => a.author?.display_name).filter(Boolean),
    institutions: [
      ...new Set((work.authorships ?? []).flatMap((a) => (a.institutions ?? []).map((i) => i.display_name))),
    ],
    year: work.publication_year ?? null,
    publication_date: work.publication_date ?? null,
    venue: venueOf(work),
    publication_type: work.type ?? null,
    doi: work.doi ?? null,
    open_access_url: work.open_access?.is_oa ? (work.open_access.oa_url ?? null) : null,
    products: [...products],
    relevance: null,
    domain: null,
    summary: null,
    quality_basis: screen.quality_basis,
    screened_on: screenedOn,
    reviewer_note: "",
    openalex_id: work.id,
    matched_in: matchedIn(work, abstract),
    abstract,
    hints: screen.hints,
  };
}
