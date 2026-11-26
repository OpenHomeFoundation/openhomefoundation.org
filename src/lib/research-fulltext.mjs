const PRODUCT_NAMES =
  /Home Assistant|Hass\.io|home-assistant\.io|ESPHome|Music Assistant|\bZHA\b|Zigbee Home Automation|Z-Wave JS|zwave-js|\bPiper\b|Wyoming protocol|Nabu Casa/g;

const HEADING =
  /(?:^|\n|\s)(?:\d{1,2}(?:\.\d{1,2})*\.?\s+|[IVX]{1,4}\.\s+)?(Introduction|Related Work|Background|Literature Review|State of the Art|Theoretical Framework|Methods?|Methodology|Materials and Methods|Study Design|Experimental Setup|Setup|Implementation|System Design|System Architecture|System Overview|Proposed System|Design|Architecture|Prototype|Apparatus|Materials|Evaluation|Experiments?|Results|Discussion|Limitations|Future Work|Conclusions?)\b/g;

const NOT_METHODS = new Set([
  "Introduction",
  "Related Work",
  "Background",
  "Literature Review",
  "State of the Art",
  "Theoretical Framework",
  "Discussion",
  "Limitations",
  "Future Work",
  "Conclusion",
  "Conclusions",
]);

/** The main body: from the first Introduction heading to the last References heading. */
export function bodyOf(text) {
  const intro = text.search(/\b(?:\d\.?\s*|I\.\s*)?(Introduction|INTRODUCTION)\b/);
  const refs = [...text.matchAll(/(?:^|\n|\s)(References|REFERENCES|Bibliography|BIBLIOGRAPHY|Works Cited|Literature Cited)\s*(?:\n|$)/g)];
  const end = refs.length ? refs[refs.length - 1].index : text.length;
  const start = intro >= 0 && intro < end ? intro : 0;
  return text.slice(start, end);
}

function sectionAt(body, index) {
  let section = null;
  for (const m of body.slice(0, index).matchAll(HEADING)) section = m[1];
  return section;
}

const SPEECH = /text-to-speech|\bTTS\b|speech|voice|Wyoming|Rhasspy|ONNX|VITS/i;

/** Mentions that aren't the product: generic "smart home assistants", other things named Piper, citations. */
function isFalseHit(body, m) {
  const before = body.slice(Math.max(0, m.index - 120), m.index);
  const after = body.slice(m.index + m[0].length, m.index + m[0].length + 120);
  if (m[0] === "Home Assistant") {
    if (/\b(smart|Smart|SMART|virtual|Virtual|AI|voice|Voice)[\s-]+$/.test(before)) return true;
    if (/^s\b|^ Benchmark|^ \(HAB\)/.test(after)) return true;
  }
  if (m[0] === "Piper") {
    const named = /(?:^|[^.:\w])[A-Z][a-z]+(?: [A-Z]\.?| [A-Z][a-z]+)? $|-$/.test(before) && !/^ (TTS|text|voice|model|speech|synthes)/i.test(after);
    if (named || !SPEECH.test(`${before}${after}`)) return true;
  }
  const near = `${before.slice(-60)}${after}`;
  if (/^\.? \((n\.d\.|\d{4})\)|^\. (Available online|Retrieved)/.test(after) || /\((n\.d\.|\d{4})\)\.\s*$/.test(before)) return true;
  const citation = /\[\d{1,3}\][^\]]{0,110}$|(?:^|\s)\d{1,3}\.\s[^.]{0,60}$/.test(before) && /Available|Accessed|accessed|https?:\/\/|doi\.org|\(\d{4}\)|\b(19|20)\d{2}\./.test(near);
  return citation;
}

/** Exact, case-sensitive product mentions in the main body, with the section each falls in. */
export function mentions(text) {
  const body = bodyOf(text);
  const hits = [...body.matchAll(PRODUCT_NAMES)].filter((m) => !isFalseHit(body, m)).map((m) => ({
    term: m[0],
    section: sectionAt(body, m.index),
    context: body.slice(Math.max(0, m.index - 100), m.index + 80).replace(/\s+/g, " "),
  }));
  const counts = {};
  for (const h of hits) counts[h.term] = (counts[h.term] ?? 0) + 1;
  return {
    total: hits.length,
    counts,
    in_methods: hits.filter((h) => h.section && !NOT_METHODS.has(h.section)).length,
    sections: [...new Set(hits.map((h) => h.section ?? "unknown"))],
    hits,
  };
}

const DEGREES = [
  [
    "PhD",
    /Doctor of Philosophy|\bPh\.?\s?D\.?\b|doctoral (?:thesis|dissertation)|Dissertation zur Erlangung|th[èe]se de doctorat|doktorsavhandling|väitöskirja|disertační práce|tese de doutoramento|tesis doctoral/i,
  ],
  [
    "master's",
    /Master(?:'|’)?s? (?:thesis|degree|dissertation|project)|Master (?:of|in) (?:Science|Engineering|Arts|Design|Research|Technology|Computer|Informatics)|\bM\.?Sc\.?\b|\bMEng\b|\bResM\b|Masterarbeit|diplomová práce|Master(?:'|’)s Programme|pro gradu|diplomityö|examensarbete på avancerad nivå|dissertação de mestrado|mestrado em/i,
  ],
  [
    "bachelor's",
    /Bachelor|\bB\.?Sc\.?\b|\bBEng\b|Bachelorarbeit|bakalářská práce|opinnäytetyö|kandidaatintyö|final year project|undergraduate (?:thesis|project)|examensarbete på grundnivå|honors thesis/i,
  ],
];

const GREEK_UNIVERSITY = /Thessaly|Athens|Patras|Thessaloniki|Ioannina|Piraeus|Aegean|Crete|Greece|Hellenic/i;

/** Degree level stated on the title pages, or null. A Greek "Diploma Thesis" counts as a bachelor's. */
export function degreeOf(text) {
  const head = text.slice(0, 4000);
  if (/Diploma Thesis|Διπλωματική Εργασία/i.test(head) && GREEK_UNIVERSITY.test(head)) return "bachelor's";
  let best = null;
  for (const [level, re] of DEGREES) {
    const m = head.match(re);
    if (m && (best === null || m.index < best.index)) best = { level, index: m.index };
  }
  return best?.level ?? null;
}

const STOPWORDS = new Set(["the", "and", "of", "to", "in", "is", "that", "for", "with", "this", "are", "on", "as", "by"]);

/** Rough check that the body is written in English. */
export function isEnglish(text) {
  const words = bodyOf(text).slice(0, 30000).toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.length < 200) return null;
  return words.filter((w) => STOPWORDS.has(w)).length / words.length > 0.08;
}
