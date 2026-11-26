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
  {
    tag: "Z-Wave JS",
    use: "home-assistant",
    query: anyOf(["Z-Wave JS", "zwave-js"]),
  },
  {
    tag: "Voice stack",
    use: "piper",
    query: `("Piper" AND ${anyOf(["text-to-speech", "TTS", "speech synthesis"])}) OR "Wyoming protocol"`,
  },
  {
    tag: "Home Assistant hardware, Cloud and Link",
    use: "home-assistant",
    query: anyOf([
      "Home Assistant Green",
      "Home Assistant Yellow",
      "Home Assistant Voice",
      "Home Assistant Cloud",
      "Home Assistant Link",
      "Nabu Casa",
    ]),
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
  /\bXoveTIC\b/i,
];

export const PRE_APPROVED_SOURCES = [
  {
    name: "Advances in Engineering Research",
    id: "S4210215495",
    issn: ["2352-5401", "2731-8079"],
  },
  { name: "Applied Sciences", id: "S4210205812", issn: ["2076-3417"] },
  { name: "Automation", id: "S4210241158", issn: ["2673-4052"] },
  { name: "Computers", id: "S4210228075", issn: ["2073-431X"] },
  {
    name: "Conference on Human System Interactions",
    id: "S4306418059",
    issn: [],
  },
  {
    name: "E3S Web of Conferences",
    id: "S4210186093",
    issn: ["2267-1242", "2555-0403"],
  },
  { name: "Energies", id: "S198098182", issn: ["1996-1073"] },
  {
    name: "EPJ Web of Conferences",
    id: "S19068271",
    issn: ["2100-014X", "2101-6275"],
  },
  {
    name: "eSim: IBPSA-Canada Building Simulation Conference",
    id: "S7407096442",
    issn: [],
  },
  {
    name: "IEEE Consumer Communications and Networking Conference",
    id: "S4393918466",
    issn: ["2331-9852"],
  },
  {
    name: "IEEE International Conference on AI in Cybersecurity (ICAIC)",
    id: "S7407087862",
    issn: [],
  },
  {
    name: "IEEE Jornadas Costarricenses de Investigación en Computación e Informática (JoCICI)",
    id: "S7407115708",
    issn: [],
  },
  {
    name: "IEEE Mediterranean Electrotechnical Conference (MELECON)",
    id: "S4363607984",
    issn: [],
  },
  {
    name: "IEEE Sensors Journal",
    id: "S189694085",
    issn: ["1530-437X", "1558-1748", "2379-9153"],
  },
  {
    name: "IEEE Transactions on Neural Systems and Rehabilitation Engineering",
    id: "S98183460",
    issn: ["1534-4320", "1558-0210"],
  },
  {
    name: "IET Conference Proceedings",
    id: "S4404663355",
    issn: ["2732-4494"],
  },
  {
    name: "International Conference in Electronic Engineering & Information Technology (EEITE)",
    id: "S7407097424",
    issn: [],
  },
  {
    name: "International Conference on Communications and Signal Processing (ICCSP)",
    id: "S7407088826",
    issn: [],
  },
  {
    name: "International Conference on Computational Problems of Electrical Engineering (CPEE)",
    id: "S7407086563",
    issn: [],
  },
  {
    name: "International Conference on Computer and Applications (ICCA)",
    id: "S7407088272",
    issn: [],
  },
  {
    name: "International Conference on Evaluation of Novel Approaches to Software Engineering",
    id: "S4306419450",
    issn: [],
  },
  {
    name: "International Conference on Recent Advances in Electrical, Electronics, Ubiquitous Communication, and Computational Intelligence (RAEEUCCI)",
    id: "S7407087136",
    issn: [],
  },
  {
    name: "International Conference on Robotics, Control and Automation (ICRCA)",
    id: "S7407087357",
    issn: [],
  },
  {
    name: "International Conference on Tangible, Embedded, and Embodied Interaction (TEI)",
    id: "S7407087804",
    issn: [],
  },
  {
    name: "International Conference on Vocational Education and Electrical Engineering (ICVEE)",
    id: "S7407088934",
    issn: [],
  },
  {
    name: "International Electronic Conference on Sensors and Applications (ECSA)",
    id: "S4306523398",
    issn: [],
  },
  {
    name: "International Electronics Symposium (IES)",
    id: "S4363606619",
    issn: [],
  },
  {
    name: "International Journal for Research in Applied Science and Engineering Technology",
    id: "S2764566388",
    issn: ["2321-9653"],
  },
  {
    name: "International Journal of Advanced Multidisciplinary",
    id: "S4394736141",
    issn: ["2829-6184", "2829-6192"],
  },
  {
    name: "International Journal of Drug Delivery Technology",
    id: "S4210211336",
    issn: ["0975-4415"],
  },
  {
    name: "International Journal of Engineering Continuity",
    id: "S4387285918",
    issn: ["2963-2390"],
  },
  {
    name: "International Journal of Engineering Research and Science & Technology",
    id: "S5406990484",
    issn: ["2319-5991"],
  },
  {
    name: "International Journal of Network Security & Its Applications",
    id: "S4210203298",
    issn: ["0974-9330", "0975-2307"],
  },
  {
    name: "Internet of Things",
    id: "S4210174276",
    issn: ["2542-6605", "2543-1536"],
  },
  {
    name: "IOP Conference Series Earth and Environmental Science",
    id: "S4210195883",
    issn: ["1755-1315", "1755-1307"],
  },
  {
    name: "Issues in Information Systems",
    id: "S4210199647",
    issn: ["1529-7314", "2331-3838"],
  },
  {
    name: "JATI EMAS (Jurnal Aplikasi Teknik dan Pengabdian Masyarakat)",
    id: "S4210218489",
    issn: ["2550-0821"],
  },
  {
    name: "Journal of Advanced Vocational Information and Communication Technology",
    id: "S7407055527",
    issn: ["3124-0437"],
  },
  {
    name: "Journal of Artificial Intelligence and Technology Information (JAITI)",
    id: "S4387287428",
    issn: ["2985-5306", "2985-6396"],
  },
  {
    name: "Journal of Systems Architecture",
    id: "S127660348",
    issn: ["1383-7621", "1873-6165"],
  },
  {
    name: "Journal of Telecommunication Electronics and Control Engineering (JTECE)",
    id: "S4210238274",
    issn: ["2654-8275"],
  },
  {
    name: "Journal of the Brazilian Computer Society",
    id: "S69801987",
    issn: ["0104-6500", "1678-4804"],
  },
  {
    name: "Jurnal Teknologi Terapan G-Tech",
    id: "S4210231345",
    issn: ["2580-8737", "2623-064X"],
  },
  {
    name: "Lecture Notes in Networks and Systems",
    id: "S4210169156",
    issn: ["2367-3389", "2367-3370"],
  },
  {
    name: "Research on Modern science and Utilizing Technological Innovation Journal (RMUTI Journal)",
    id: "S7407066269",
    issn: ["3027-6756"],
  },
  { name: "Scientific Reports", id: "S196734849", issn: ["2045-2322"] },
  { name: "Sensors", id: "S101949793", issn: ["1424-8220"] },
  {
    name: "Simpósio Brasileiro de Testes de Software Sistemático e Automatizado (SAST)",
    id: "S7407115429",
    issn: [],
  },
  {
    name: "Smart Agricultural Technology",
    id: "S4210238883",
    issn: ["2772-3755"],
  },
  {
    name: "Symposium on Internet of Things (SIoT)",
    id: "S7407087744",
    issn: [],
  },
  {
    name: "Technology audit and production reserves",
    id: "S2764402084",
    issn: ["2226-3780", "2312-8372", "2664-9969", "2706-5448"],
  },
];

export const PREDATORY_PUBLISHERS = /Iterative International Publishers|\bIIP Series\b/i;

const PREPRINT_SOURCES =
  /arXiv|SSRN|\bOSF\b|TechRxiv|Research Square|bioRxiv|medRxiv|Preprints\.org/i;

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
  for (const m of byOthersYaml.matchAll(/doi\.org\/([^\s"'}]+)/gi))
    dois.add(normaliseDoi(m[1]));
  for (const m of byOthersYaml.matchAll(
    /^[\s-]*title:\s*["']?(.+?)["']?\s*$/gm,
  ))
    titles.add(normaliseTitle(m[1]));
  return { dois, titles };
}

export function isAlreadyListed(work, existing) {
  const doi = normaliseDoi(work.doi);
  return (
    (doi && existing.dois.has(doi)) ||
    existing.titles.has(normaliseTitle(work.title))
  );
}

export function abstractText(index) {
  if (!index) return null;
  const words = [];
  for (const [word, positions] of Object.entries(index))
    for (const p of positions) words[p] = word;
  return words.filter(Boolean).join(" ");
}

const PRODUCT_TERMS =
  /Home Assistant|Hass\.io|home-assistant\.io|ESPHome|Music Assistant|\bZHA\b|Zigbee Home Automation|Z-Wave JS|zwave-js|\bPiper\b|Wyoming protocol|Nabu Casa/;

/** Where the exact product names appear: "title/abstract", or "full text only" (more likely a passing mention). */
export function matchedIn(work, abstract) {
  return PRODUCT_TERMS.test(`${work.title ?? ""} ${abstract ?? ""}`)
    ? "title/abstract"
    : "full text only";
}

export const shortId = (id) => id?.replace("https://openalex.org/", "") ?? null;

const PUBLISHED_SOURCE_TYPES = new Set([
  "journal",
  "conference",
  "book series",
  "ebook platform",
]);
const METRIC_SOURCE_TYPES = new Set(["journal", "book series"]);
const NOT_PEER_TYPES = new Set([
  "dataset",
  "software",
  "paratext",
  "report",
  "standard",
  "grant",
  "peer-review",
  "other",
  "editorial",
  "erratum",
  "letter",
  "retraction",
  "study-registration",
  "supplementary-materials",
  "libguides",
]);

export function isPreApproved(source, venueName) {
  if (source) {
    const id = shortId(source.id);
    const issns = new Set(
      [source.issn_l, ...(source.issn ?? [])].filter(Boolean),
    );
    if (
      PRE_APPROVED_SOURCES.some(
        (v) => v.id === id || v.issn.some((i) => issns.has(i)),
      )
    )
      return true;
  }
  const name = (venueName ?? "").trim().toLowerCase();
  if (PRE_APPROVED_SOURCES.some((v) => v.name.toLowerCase() === name))
    return true;
  return PRE_APPROVED_VENUES.some((re) => re.test(venueName ?? ""));
}

const isPreprintLocation = (work) => {
  const source = work.primary_location?.source;
  return (
    work.type === "preprint" ||
    source?.type === "repository" ||
    PREPRINT_SOURCES.test(source?.display_name ?? "")
  );
};

const publishedLocation = (work) =>
  (work.locations ?? []).find(
    (l) =>
      PUBLISHED_SOURCE_TYPES.has(l.source?.type) &&
      !PREPRINT_SOURCES.test(l.source?.display_name ?? ""),
  );

const sourceName = (location) =>
  location?.source?.display_name ?? location?.raw_source_name ?? null;

/**
 * The mechanical parts of the inclusion guidelines: retraction and affiliations (Step 5),
 * language, publication type and preprints (Step 3), and the venue lists (Step 4).
 * Judgement steps (2a/2b, thesis degree level, book chapters, ethics, predatory) are left PENDING.
 */
export function prescreen(work) {
  const codes = [];
  const hints = [];
  const institutions = (work.authorships ?? []).flatMap((a) => [
    ...(a.institutions ?? []).map((i) => i.display_name),
    ...(a.raw_affiliation_strings ?? []),
  ]);

  if (work.is_retracted) codes.push("X-RETRACTED");
  if (institutions.some((i) => /Open Home Foundation/i.test(i)))
    codes.push("X-OHF");
  if (institutions.some((i) => /Nabu Casa/i.test(i)))
    codes.push("X-AFFILIATION");

  if (work.language && work.language !== "en") codes.push("X-LANGUAGE");
  else if (!work.language)
    hints.push(
      "No language in the record: check the text is in English (X-LANGUAGE).",
    );

  let location = work.primary_location;
  let preprintUrl = null;
  let qualityBasis = null;
  let skipVenue = false;

  if (work.type === "dissertation") {
    skipVenue = true;
    hints.push(
      'Thesis: find the degree level. PhD → label "PhD thesis"; master\'s → "Master\'s thesis"; bachelor\'s → X-STUDENT; not found → X-DEGREE.',
    );
  } else if (NOT_PEER_TYPES.has(work.type)) {
    codes.push("X-NOTPEER");
  } else if (isPreprintLocation(work)) {
    const published = publishedLocation(work);
    if (published) {
      preprintUrl =
        work.primary_location?.landing_page_url ??
        work.primary_location?.pdf_url ??
        null;
      location = published;
      hints.push(
        "Preprint with a published version in the OpenAlex record: screened as the published version.",
      );
    } else {
      codes.push("X-PREPRINT");
      hints.push(
        "No published version in the OpenAlex record; search the exact title before confirming X-PREPRINT.",
      );
    }
  }

  const venue = sourceName(location);
  const source = location?.source ?? null;
  if (PREDATORY_PUBLISHERS.test(`${venue ?? ""} ${source?.host_organization_name ?? ""}`)) codes.push("X-PREDATORY");

  if (work.type === "book-chapter" && !isPreApproved(source, venue)) {
    skipVenue = true;
    hints.push(
      'Book chapter: if it is in an academic volume, quality basis "Book chapter"; if it is a conference paper in a proceedings series, judge the conference (not pre-approved → X-VENUE).',
    );
  } else if (
    /\bworkshops?\b/i.test(venue ?? "") &&
    !isPreApproved(source, venue)
  ) {
    skipVenue = true;
    qualityBasis = "Workshop paper";
  }

  let needsMetrics = false;
  if (
    !skipVenue &&
    !codes.includes("X-NOTPEER") &&
    !codes.includes("X-PREPRINT")
  ) {
    if (isPreApproved(source, venue)) qualityBasis = "Pre-approved";
    else {
      codes.push("X-VENUE");
      needsMetrics = METRIC_SOURCE_TYPES.has(source?.type);
    }
  }
  if (work.type === "dissertation") qualityBasis = "Thesis";

  return {
    decision: codes.length ? "EXCLUDE" : "PENDING",
    reason_codes: codes,
    quality_basis: qualityBasis,
    hints,
    venue,
    source,
    preprintUrl,
    needsMetrics,
  };
}

/** One record per candidate, in the guidelines' output format. */
export function toRecord(work, products, screenedOn) {
  const screen = prescreen(work);
  const abstract = abstractText(work.abstract_inverted_index);
  const oaUrl = work.open_access?.is_oa
    ? (work.open_access.oa_url ?? null)
    : null;
  return {
    decision: screen.decision,
    reason_codes: screen.reason_codes,
    title: work.title ?? work.display_name ?? null,
    authors: (work.authorships ?? [])
      .map((a) => a.author?.display_name)
      .filter(Boolean),
    institutions: [
      ...new Set(
        (work.authorships ?? []).flatMap((a) =>
          (a.institutions ?? []).map((i) => i.display_name),
        ),
      ),
    ],
    year: work.publication_year ?? null,
    publication_date: work.publication_date ?? null,
    venue: screen.venue,
    venue_openalex_id: shortId(screen.source?.id),
    venue_type: screen.source?.type ?? null,
    publication_type: work.type ?? null,
    label: null,
    language: work.language ?? null,
    doi: work.doi ?? null,
    open_access_url: screen.preprintUrl ?? oaUrl,
    pdf_urls: [...new Set((work.locations ?? []).map((l) => l.pdf_url).filter(Boolean))],
    products: [...products],
    relevance: null,
    domain: null,
    summary: null,
    quality_basis: screen.quality_basis,
    venue_metrics: screen.needsMetrics ? {} : null,
    screened_on: screenedOn,
    reviewer_note: "",
    openalex_id: work.id,
    matched_in: matchedIn(work, abstract),
    abstract,
    hints: screen.hints,
  };
}
