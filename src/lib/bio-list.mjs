// Validates src/data/bio.yml and builds the lists the bio page renders.
import { isShowing, select } from "./bio-schedule.mjs";

export class BioConfigError extends Error {}

const fail = (keyPath, message) => {
  throw new BioConfigError(`src/data/bio.yml ${keyPath}: ${message}`);
};

const blank = (value) => value === undefined || value === null || String(value).trim() === "";
const isMap = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const has = (object, key) => Object.hasOwn(object, key);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?(?: ?(?:Z|[+-]\d{2}:?\d{2}))?)?$/;
const DAY_MS = 24 * 60 * 60 * 1000;

// Times without an offset are UTC.
export function parseTime(value, keyPath) {
  if (blank(value)) return null;
  if (value instanceof Date) return value;
  const text = String(value).trim();
  const invalid = () => fail(keyPath, `"${value}" is not a date. Use 2026-11-15 or 2026-11-15T18:00:00Z`);
  if (!ISO_DATE.test(text)) invalid();
  const [day, rest = "00:00"] = [text.slice(0, 10), text.slice(11).trim()].filter(Boolean);
  const offset = rest.match(/\s?(Z|[+-]\d{2}:?\d{2})$/)?.[1] ?? "Z";
  const date = new Date(`${day}T${rest.replace(/\s?(Z|[+-]\d{2}:?\d{2})$/, "")}${offset.replace(/^([+-]\d{2})(\d{2})$/, "$1:$2")}`);
  const calendar = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || Number.isNaN(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== day) invalid();
  return date;
}

// The YAML loader turns most dates into Date objects, so exactly midnight UTC
// reads as a date with no time.
const hasTime = (value) =>
  value instanceof Date ? value.getUTCHours() !== 0 || value.getUTCMinutes() !== 0 : String(value).trim().length > 10;

// A date-only `ends` keeps the item up through the whole of that day.
export function parseEnd(value, keyPath) {
  const date = parseTime(value, keyPath);
  return date && !hasTime(value) ? new Date(date.getTime() + DAY_MS) : date;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeId(value) {
  const text = String(value ?? "").trim();
  if (YOUTUBE_ID.test(text)) return text;
  let url;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m)\./, "");
  let id = null;
  if (host === "youtu.be") id = url.pathname.slice(1);
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:live|shorts|embed)\/([^/]+)/)?.[1] ?? null;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

// -- Validation ---------------------------------------------------------------

const ITEM_KEYS = ["title", "url", "image", "note", "label", "starts", "ends"];
const VIDEO_KEYS = ["type", "video", "title", "airs", "label", "starts", "ends"];
const LINK_KEYS = ["label", "url", "logo", "note", "highlight", "starts", "ends"];
const FEED_KEYS = { blog: ["limit"], newsletter: ["limit", "title", "note", "url", "image"] };

function checkKeys(item, allowed, keyPath, startKey = "starts") {
  for (const key of Object.keys(item)) {
    if (allowed.includes(key)) continue;
    if (/end|until|expir|stop|finish/i.test(key) && allowed.includes("ends")) fail(`${keyPath}.${key}`, "isn't a key we use. Use ends instead");
    if (/start|begin|from|publish|date|time|when|air/i.test(key) && allowed.includes(startKey)) {
      fail(`${keyPath}.${key}`, `isn't a key we use. Use ${startKey} instead`);
    }
    if (/start|begin|from|publish|date|time|when|air|end|until|expir|stop|finish/i.test(key)) {
      fail(`${keyPath}.${key}`, "can't be set here: this comes and goes by itself, so it takes no dates");
    }
    fail(`${keyPath}.${key}`, `isn't a key we use. Use one of: ${allowed.join(", ")}`);
  }
}

function requireUrl(item, keyPath) {
  const url = String(item.url ?? "");
  if (url.startsWith("/") || url.startsWith("https://") || url.startsWith("http://")) return;
  fail(`${keyPath}.url`, "must be a site path like /blog/ or a full https:// URL");
}

function requireKeys(item, keys, keyPath) {
  for (const key of keys) if (blank(item[key])) fail(`${keyPath}.${key}`, "is required");
}

function validateLimit(limit, keyPath) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) fail(keyPath, "must be a whole number from 1 to 10");
}

const named = (keyPath, item, name) => (blank(item?.[name]) ? keyPath : `${keyPath} ("${item[name]}")`);

function validateWindow(item, keyPath, airs = null) {
  const starts = parseTime(item.starts, `${keyPath}.starts`);
  const ends = parseEnd(item.ends, `${keyPath}.ends`);
  if (starts && ends && ends <= starts) fail(`${keyPath}.ends`, "must be after starts");
  if (airs && ends && ends <= airs) fail(`${keyPath}.ends`, "must be after airs");
  if (airs && starts && !ends && videoEnd(airs) <= starts) fail(`${keyPath}.starts`, "must be before the video comes down, or add an ends");
}

function validateItem(item, index) {
  const keyPath = named(`latest.items[${index}]`, item, "title");
  if (!isMap(item)) fail(keyPath, "must be a map with title, url, image and starts");
  if (item.type === "youtube") {
    checkKeys(item, VIDEO_KEYS, keyPath, "airs");
    requireKeys(item, ["title", "airs"], keyPath);
    if (!youtubeId(item.video)) fail(`${keyPath}.video`, "must be a YouTube video ID or link, e.g. https://www.youtube.com/watch?v=XyAL1to3Lm4");
    validateWindow(item, keyPath, parseTime(item.airs, `${keyPath}.airs`));
    return;
  }
  if (has(item, "type")) fail(`${keyPath}.type`, "must be youtube, or left out for a plain item");
  checkKeys(item, ITEM_KEYS, keyPath);
  requireKeys(item, ["title", "image"], keyPath);
  requireUrl(item, keyPath);
  if (blank(item.starts)) fail(`${keyPath}.starts`, "is required: when it appears, e.g. 2026-11-01");
  validateWindow(item, keyPath);
}

function validateLink(link, sectionPath, index) {
  const keyPath = named(`${sectionPath}.links[${index}]`, link, "label");
  if (!isMap(link)) fail(keyPath, "must be a map with label and url");
  checkKeys(link, LINK_KEYS, keyPath);
  requireKeys(link, ["label"], keyPath);
  requireUrl(link, keyPath);
  validateWindow(link, keyPath);
}

export function validate(config) {
  if (!isMap(config)) fail("", "is empty or missing");

  const latest = config.latest;
  if (!isMap(latest)) fail("latest", "must be a map with limit, feeds and items");
  checkKeys(latest, ["limit", "feeds", "items"], "latest");
  validateLimit(latest.limit, "latest.limit");
  if (!isMap(latest.feeds)) fail("latest.feeds", "must set blog and newsletter");
  checkKeys(latest.feeds, ["blog", "newsletter"], "latest.feeds");
  for (const [name, keys] of Object.entries(FEED_KEYS)) {
    const feed = latest.feeds[name];
    const keyPath = `latest.feeds.${name}`;
    if (!isMap(feed)) fail(keyPath, "must be a map with limit");
    checkKeys(feed, keys, keyPath);
    validateLimit(feed.limit, `${keyPath}.limit`);
  }
  requireKeys(latest.feeds.newsletter, ["title", "note", "image"], "latest.feeds.newsletter");
  requireUrl(latest.feeds.newsletter, "latest.feeds.newsletter");
  if (!Array.isArray(latest.items)) fail("latest.items", "must be a list");
  latest.items.forEach(validateItem);

  if (!Array.isArray(config.sections)) fail("sections", "must be a list");
  config.sections.forEach((section, index) => {
    const keyPath = named(`sections[${index}]`, section, "title");
    if (!isMap(section)) fail(keyPath, "must be a map with title and links");
    checkKeys(section, ["title", "links"], keyPath);
    requireKeys(section, ["title"], keyPath);
    if (!Array.isArray(section.links) || section.links.length === 0) fail(`${keyPath}.links`, "must be a non-empty list");
    section.links.forEach((link, linkIndex) => validateLink(link, keyPath, linkIndex));
  });

  if (!Array.isArray(config.socials)) fail("socials", "must be a list");
  config.socials.forEach((social, index) => {
    const keyPath = named(`socials[${index}]`, social, "label");
    if (!isMap(social)) fail(keyPath, "must be a map with icon, label and url");
    checkKeys(social, ["icon", "label", "url"], keyPath);
    requireKeys(social, ["icon", "label"], keyPath);
    requireUrl(social, keyPath);
  });

  return true;
}

// -- Building the lists -------------------------------------------------------

const DAY = new Intl.DateTimeFormat("en-US", { month: "long", day: "2-digit", year: "numeric", timeZone: "UTC" });
const DAY_NO_YEAR = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });

const startOfDay = (date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
const videoEnd = (airs) => new Date(startOfDay(airs) + 2 * DAY_MS);
const line = (...parts) => parts.filter(Boolean).join(" · ");

function handItem(item) {
  const window = { starts: parseTime(item.starts, "starts"), ends: parseEnd(item.ends, "ends") };
  if (item.type !== "youtube") {
    return { title: item.title, url: item.url, image: item.image, note: item.note, label: item.label, date: window.starts, source: "items", hand: true, ...window };
  }
  const id = youtubeId(item.video);
  const airs = parseTime(item.airs, "airs");
  return {
    title: item.title,
    url: `https://www.youtube.com/watch?v=${id}`,
    image: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    label: item.label,
    date: airs,
    timed: hasTime(item.airs),
    video: true,
    source: "items",
    hand: true,
    starts: window.starts,
    ends: window.ends ?? videoEnd(airs),
  };
}

// Every Latest item that hasn't ended, newest first. Undated items go last.
export function latestItems(latest, feeds, now) {
  const fromFeed = (name, label) =>
    (feeds[name] ?? []).map((item) => ({ ...item, label, source: name, cap: latest.feeds[name].limit }));
  return [...latest.items.map(handItem), ...fromFeed("newsletter", "Newsletter"), ...fromFeed("blog")]
    .filter((item) => !(item.ends && item.ends <= now))
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
}

const upForGood = (item, now) => (!item.starts || item.starts <= now) && !item.ends;

// The items that might ever show, each marked `sure` if it's up for good and
// nothing can take its link: it either shows or gives way to an earlier item
// from its own source. So no feed item after `limit` sure items can show, and
// nothing from a feed after `cap` of them. Hand-added items are always kept,
// because one that's up hides a feed item with its link wherever it sits.
function mightShow(items, limit, now) {
  const handItems = items.filter((item) => item.hand);
  const handForGood = new Set(handItems.filter((item) => upForGood(item, now)).map((item) => item.url));
  const handUrls = new Set(handItems.map((item) => item.url));
  const kept = [];
  const taken = new Set();
  const sureCounts = new Map();
  let sure = 0;
  for (const item of items) {
    const claim = `${Boolean(item.hand)} ${item.url}`;
    if (taken.has(claim)) continue;
    if (!item.hand && (sure >= limit || handForGood.has(item.url))) continue;
    if (item.cap && (sureCounts.get(item.source) ?? 0) >= item.cap) continue;
    const fixed = upForGood(item, now);
    const rival = item.hand
      ? kept.some((other) => other.hand && other.url === item.url)
      : handUrls.has(item.url) || kept.some((other) => other.url === item.url);
    const isSure = fixed && !rival;
    const ahead = kept.filter((other) => other.source === item.source).length;
    kept.push({ ...item, sure: isSure });
    if (fixed && (!item.cap || ahead < item.cap)) taken.add(claim);
    if (!isSure) continue;
    sure++;
    sureCounts.set(item.source, (sureCounts.get(item.source) ?? 0) + 1);
  }
  return kept;
}

// A `starts` that has passed can't change anything, and the page only checks
// the time if something is still to change.
const stillToCome = (starts, now) => (starts > now ? starts : null);

function videoNotes(item, now) {
  const upcoming = item.date > now;
  const after = line(item.label, DAY.format(item.date));
  if (!upcoming) return { note: after, noteAfter: null, airs: null };
  const before = line(item.label, `Starts ${DAY_NO_YEAR.format(item.date)}`, item.timed && `${TIME.format(item.date)} UTC`);
  return { note: before, noteAfter: after, airs: item.date };
}

// Only an item with nothing sure ahead of it can come first, so only those get
// a hero version. A video is always a large card.
function latestEntries(items, now) {
  return items.flatMap((item, index) => {
    const base = {
      key: String(index),
      url: item.url,
      source: item.source,
      hand: item.hand,
      cap: item.cap ?? null,
      starts: stillToCome(item.starts, now),
      ends: item.ends ?? null,
      title: item.title,
      image: item.image,
    };
    if (item.video) return [{ ...base, kind: "video", ...videoNotes(item, now) }];
    const note = item.note ?? line(item.label, item.date && DAY.format(item.date));
    const row = { ...base, kind: "row", note };
    const hero = { ...base, kind: "hero", note };
    if (items.slice(0, index).some((before) => before.sure)) return [row];
    return index === 0 ? [hero] : [{ ...hero, variant: "hero" }, { ...row, variant: "row" }];
  });
}

const settle = (list, now) => {
  const keys = select(list, now);
  const entries = list.entries.map((entry) => ({ ...entry, hidden: !isShowing(entry, keys) }));
  return { ...list, entries, hidden: keys.length === 0 };
};

// `feeds.blog` and `feeds.newsletter` are every item that feed has, as
// { title, url, image, date }, or with a `note` when there's no date.
export function buildBio(config, feeds, now) {
  const { latest } = config;
  const entries = latestEntries(mightShow(latestItems(latest, feeds, now), latest.limit, now), now);
  return {
    latest: settle({ limit: latest.limit, entries }, now),
    sections: config.sections.flatMap((section) => {
      const links = section.links.flatMap((link, index) => {
        const ends = parseEnd(link.ends, "ends");
        if (ends && ends <= now) return [];
        return [{ ...link, key: String(index), source: "links", starts: stillToCome(parseTime(link.starts, "starts"), now), ends }];
      });
      return links.length ? [settle({ title: section.title, entries: links }, now)] : [];
    }),
  };
}
