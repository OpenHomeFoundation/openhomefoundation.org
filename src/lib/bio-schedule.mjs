// Which items of a bio page list are showing at a given moment. Runs in the
// build (src/lib/bio-list.mjs) and in the browser (src/scripts/bio-schedule.js),
// so no Node imports here.

// Open from `starts` (inclusive) until `ends` (exclusive).
export function isOpen(entry, now) {
  const time = (value) => (value ? new Date(value).getTime() : null);
  const starts = time(entry.starts);
  const ends = time(entry.ends);
  const at = new Date(now).getTime();
  return (starts === null || starts <= at) && (ends === null || ends > at);
}

// The keys of the entries showing at `now`, in order. A link shown more than
// once goes to an open hand-added entry (`hand`) if there is one, otherwise to
// its earliest open entry within its source's `cap`. The cap counts only the
// entries showing.
export function select({ entries, limit = Infinity }, now) {
  const open = entries.filter((entry) => isOpen(entry, now));
  const handUrls = new Set(open.filter((entry) => entry.hand).map((entry) => entry.url));
  const urls = new Set();
  const counts = new Map();
  const keys = [];
  for (const entry of open) {
    if (keys.length >= limit) break;
    if (keys.includes(entry.key) || urls.has(entry.url)) continue;
    if (!entry.hand && handUrls.has(entry.url)) continue;
    const count = counts.get(entry.source) ?? 0;
    if (entry.cap && count >= entry.cap) continue;
    counts.set(entry.source, count + 1);
    urls.add(entry.url);
    keys.push(entry.key);
  }
  return keys;
}

// A `hero` version shows only in first place, a `row` version anywhere else.
export function isShowing(entry, keys) {
  const position = keys.indexOf(entry.key);
  if (position === -1) return false;
  if (entry.variant === "hero") return position === 0;
  if (entry.variant === "row") return position > 0;
  return true;
}

export function dataAttributes(entry) {
  return {
    "data-key": entry.key,
    "data-url": entry.url,
    "data-source": entry.source,
    "data-hand": entry.hand ? "" : undefined,
    "data-cap": entry.cap ?? undefined,
    "data-variant": entry.variant,
    "data-starts": entry.starts?.toISOString(),
    "data-ends": entry.ends?.toISOString(),
    "data-airs": entry.airs?.toISOString(),
    "data-note-after": entry.noteAfter ?? undefined,
  };
}

export function readEntry(dataset) {
  return {
    key: dataset.key,
    url: dataset.url,
    source: dataset.source,
    hand: dataset.hand !== undefined,
    cap: Number(dataset.cap) || null,
    variant: dataset.variant,
    starts: dataset.starts,
    ends: dataset.ends,
  };
}

// The website's time, and the performance.now() it belongs to: the middle of
// the request. Null if it can't be read.
export async function readServerTime(url, request = fetch, clock = () => performance.now()) {
  try {
    const sent = clock();
    const response = await request(url, { method: "HEAD", cache: "no-store" });
    const received = clock();
    // The CDN writes a fresh Date even on a cache hit, so adding Age would run
    // the clock fast by however long the page has been cached.
    const time = Date.parse(response.headers.get("Date") ?? "");
    if (!response.ok || Number.isNaN(time)) return null;
    return { time, at: (sent + received) / 2 };
  } catch {
    return null;
  }
}
