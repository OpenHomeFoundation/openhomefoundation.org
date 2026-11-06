// Run with `npm test`.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BioConfigError, buildBio, latestItems, parseEnd, parseTime, validate, youtubeId } from "./bio-list.mjs";
import { dataAttributes, isOpen, isShowing, readEntry, readServerTime, select } from "./bio-schedule.mjs";

const NOW = new Date("2026-11-06T12:00:00Z");

const post = (day, title = `Post ${day}`) => ({ title, url: `/blog/${day}/`, image: `/${day}.webp`, date: new Date(`${day}T00:00:00Z`) });
const POSTS = [post("2026-10-06"), post("2026-09-15"), post("2026-09-10")];
const EDITIONS = [
  { title: "Edition 2", url: "https://news.test/2/", image: "/2.webp", date: new Date("2026-10-01T15:00:00Z") },
  { title: "Edition 1", url: "https://news.test/1/", image: "/1.webp", date: new Date("2026-09-01T15:00:00Z") },
];
const FEEDS = { blog: POSTS, newsletter: EDITIONS };

const item = (overrides = {}) => ({ title: "Item", url: "/item/", image: "/item.webp", starts: "2026-11-01", ...overrides });
const video = (overrides = {}) => ({ type: "youtube", video: "XyAL1to3Lm4", title: "Stream", airs: "2026-11-15T18:00:00Z", label: "Livestream", ...overrides });

const config = (items = [], latest = {}, sections = []) => ({
  tagline: "Tagline",
  latest: {
    limit: 4,
    feeds: { blog: { limit: 2 }, newsletter: { limit: 1, title: "News", note: "Our newsletter", url: "https://news.test/", image: "/news.webp" } },
    items,
    ...latest,
  },
  sections,
  socials: [],
});

const links = (...items) => [{ title: "Links", links: items.map((link) => ({ label: "Link", url: "/link/", ...link })) }];

const build = (cfg, now = NOW, feeds = FEEDS) => {
  validate(cfg);
  return buildBio(cfg, feeds, now);
};

const titles = (list) => list.entries.filter((entry) => !entry.hidden).map((entry) => entry.title);

// What the page shows at `at`, from the attributes the build rendered.
const pageShows = (list, at) => {
  const entries = list.entries.map((entry) => {
    const dataset = {};
    for (const [name, value] of Object.entries(dataAttributes(entry))) {
      if (value !== undefined) dataset[name.slice(5).replace(/-(\w)/g, (_, letter) => letter.toUpperCase())] = String(value);
    }
    return { entry, read: readEntry(dataset) };
  });
  const keys = select({ entries: entries.map(({ read }) => read), limit: list.limit }, new Date(at).getTime());
  return entries.filter(({ read }) => isShowing(read, keys)).map(({ entry }) => entry);
};

const shownTitles = (list, at) => pageShows(list, at).map((entry) => entry.title);

function assertInvalid(cfg, message) {
  assert.throws(
    () => validate(cfg),
    (error) => error instanceof BioConfigError && error.message.includes(message),
    message,
  );
}

describe("isOpen", () => {
  const window = { starts: "2026-11-01T00:00:00Z", ends: "2026-11-02T00:00:00Z" };

  it("includes starts and excludes ends", () => {
    assert.equal(isOpen(window, "2026-10-31T23:59:59Z"), false);
    assert.equal(isOpen(window, "2026-11-01T00:00:00Z"), true);
    assert.equal(isOpen(window, "2026-11-01T23:59:59Z"), true);
    assert.equal(isOpen(window, "2026-11-02T00:00:00Z"), false);
  });

  it("treats a missing starts or ends as open", () => {
    assert.equal(isOpen({ ends: window.ends }, "2020-01-01"), true);
    assert.equal(isOpen({ starts: window.starts }, "2099-01-01"), true);
    assert.equal(isOpen({ starts: null, ends: null }, NOW), true);
  });
});

describe("select", () => {
  const entry = (key, overrides = {}) => ({ key, url: `/${key}/`, source: "items", ...overrides });
  const at = "2026-11-06T00:00:00Z";

  it("stops at the limit", () => assert.deepEqual(select({ entries: [entry("a"), entry("b"), entry("c")], limit: 2 }, at), ["a", "b"]));

  it("has no limit by default", () => assert.deepEqual(select({ entries: [entry("a"), entry("b")] }, at), ["a", "b"]));

  it("gives a shared link to the earliest open entry", () => {
    const entries = [entry("a", { url: "/x/", starts: "2026-11-05", ends: "2026-11-07" }), entry("b", { url: "/x/" })];
    assert.deepEqual(select({ entries }, "2026-11-01"), ["b"]);
    assert.deepEqual(select({ entries }, at), ["a"]);
    assert.deepEqual(select({ entries }, "2026-11-08"), ["b"]);
  });

  it("counts a source's cap against the items showing", () => {
    const entries = [entry("a", { source: "blog", cap: 1, ends: "2026-11-07" }), entry("b", { source: "blog", cap: 1 })];
    assert.deepEqual(select({ entries }, at), ["a"]);
    assert.deepEqual(select({ entries }, "2026-11-08"), ["b"]);
  });

  it("gives a link to a later entry when the earlier one is over its cap", () => {
    const entries = [entry("a", { source: "blog", cap: 1 }), entry("b", { url: "/x/", source: "blog", cap: 1 }), entry("c", { url: "/x/" })];
    assert.deepEqual(select({ entries }, at), ["a", "c"]);
  });

  it("gives a shared link to an open hand-added entry, wherever it sits", () => {
    const entries = [entry("feed", { url: "/x/", source: "blog" }), entry("hand", { url: "/x/", hand: true, starts: "2026-11-05", ends: "2026-11-07" })];
    assert.deepEqual(select({ entries }, "2026-11-01"), ["feed"]);
    assert.deepEqual(select({ entries }, at), ["hand"]);
    assert.deepEqual(select({ entries }, "2026-11-08"), ["feed"]);
  });

  it("counts a hero and row version once", () => {
    const entries = [entry("a", { variant: "hero" }), entry("a", { variant: "row" }), entry("b")];
    assert.deepEqual(select({ entries, limit: 2 }, at), ["a", "b"]);
  });
});

describe("dates", () => {
  it("reads times as UTC unless they carry an offset", () => {
    assert.equal(parseTime("2026-11-15", "x").toISOString(), "2026-11-15T00:00:00.000Z");
    assert.equal(parseTime("2026-11-15T17:30:00Z", "x").toISOString(), "2026-11-15T17:30:00.000Z");
    assert.equal(parseTime("2026-11-15T17:30", "x").toISOString(), "2026-11-15T17:30:00.000Z");
    assert.equal(parseTime("2026-11-15 17:30:00", "x").toISOString(), "2026-11-15T17:30:00.000Z");
    assert.equal(parseTime("2026-11-15T18:30:00+01:00", "x").toISOString(), "2026-11-15T17:30:00.000Z");
    assert.equal(parseTime("2026-11-15 18:30 +0100", "x").toISOString(), "2026-11-15T17:30:00.000Z");
  });

  it("keeps a date-only ends up through that day", () => {
    assert.equal(parseEnd("2026-11-15", "x").toISOString(), "2026-11-16T00:00:00.000Z");
    assert.equal(parseEnd("2026-11-15T18:00:00Z", "x").toISOString(), "2026-11-15T18:00:00.000Z");
  });

  it("reads dates the YAML loader has already converted", () => {
    assert.equal(parseTime(new Date("2026-11-15T17:30:00Z"), "x").toISOString(), "2026-11-15T17:30:00.000Z");
    assert.equal(parseEnd(new Date("2026-11-15T18:00:00Z"), "x").toISOString(), "2026-11-15T18:00:00.000Z");
    assert.equal(parseEnd(new Date("2026-11-15T00:00:00Z"), "x").toISOString(), "2026-11-16T00:00:00.000Z");
  });

  it("rejects dates that don't exist or aren't ISO", () => {
    for (const value of ["31/11/2026", "2026-02-31", "November 15", "2026-11-15T25:00:00Z"]) {
      assert.throws(() => parseTime(value, "x"), BioConfigError, value);
    }
  });
});

describe("validation names the item at fault", () => {
  it("accepts a valid config", () => assert.equal(validate(config([item()])), true));

  it("requires starts in Latest", () =>
    assertInvalid(config([item({ title: "Launch", starts: undefined })]), 'latest.items[0] ("Launch").starts: is required'));

  it("requires a title, url and image", () => {
    assertInvalid(config([item({ title: undefined })]), "latest.items[0].title: is required");
    assertInvalid(config([item({ url: "docs" })]), "url: must be a site path");
    assertInvalid(config([item({ image: undefined })]), "image: is required");
  });

  it("rejects ends before starts", () => {
    assertInvalid(config([item({ starts: "2026-11-02", ends: "2026-11-01" })]), "ends: must be after starts");
    assertInvalid(config([], {}, links({ starts: "2026-11-02", ends: "2026-11-01" })), 'links[0] ("Link").ends: must be after starts');
  });

  it("allows ends on the same day as starts", () => assert.equal(validate(config([item({ starts: "2026-11-02", ends: "2026-11-02" })])), true));

  it("rejects a date it can't read", () => assertInvalid(config([item({ ends: "10/11/2026" })]), '"10/11/2026" is not a date'));

  it("names the key to use for other date keys", () => {
    for (const [key, use] of [
      ["date", "starts"],
      ["start", "starts"],
      ["from", "starts"],
      ["publish_date", "starts"],
      ["airs", "starts"],
      ["expires", "ends"],
      ["end", "ends"],
      ["until", "ends"],
      ["end_date", "ends"],
    ]) {
      assertInvalid(config([item({ [key]: "2026-11-01" })]), `.${key}: isn't a key we use. Use ${use} instead`);
      assertInvalid(config([], {}, links({ [key]: "2026-11-01" })), `.${key}: isn't a key we use. Use ${use} instead`);
    }
  });

  it("names airs for a video's date or start", () => {
    assertInvalid(config([video({ date: "2026-11-15" })]), ".date: isn't a key we use. Use airs instead");
    assertInvalid(config([video({ start: "2026-11-15" })]), ".start: isn't a key we use. Use airs instead");
    assertInvalid(config([video({ expires: "2026-11-15" })]), ".expires: isn't a key we use. Use ends instead");
  });

  it("rejects any other unknown key", () => assertInvalid(config([item({ feed: "newsletter" })]), ".feed: isn't a key we use. Use one of"));

  it("refuses dates on feeds", () => {
    const cfg = config();
    cfg.latest.feeds.blog.starts = "2026-11-01";
    assertInvalid(cfg, "latest.feeds.blog.starts: can't be set here");
  });

  it("checks videos", () => {
    assertInvalid(config([video({ video: "not a video" })]), "video: must be a YouTube video ID or link");
    assertInvalid(config([video({ airs: undefined })]), "airs: is required");
    assertInvalid(config([video({ type: "vimeo" })]), "type: must be youtube");
    assertInvalid(config([video({ ends: "2026-11-14" })]), "ends: must be after airs");
    assertInvalid(config([video({ starts: "2026-12-01" })]), "starts: must be before the video comes down");
  });

  it("checks limits", () => {
    assertInvalid(config([], { limit: 0 }), "latest.limit: must be a whole number");
    const cfg = config();
    cfg.latest.feeds.blog.limit = "two";
    assertInvalid(cfg, "latest.feeds.blog.limit: must be a whole number");
  });

  it("rejects the old list form of latest", () => assertInvalid({ latest: [] }, "latest: must be a map"));
});

describe("the Latest list", () => {
  it("merges everything newest first, within the limit and caps", () => {
    const { latest } = build(config([item({ title: "Hand", starts: "2026-09-20" })], { limit: 10 }));
    assert.deepEqual(titles(latest), ["Post 2026-10-06", "Edition 2", "Hand", "Post 2026-09-15"]);
  });

  it("stops at the limit", () => {
    const { latest } = build(config([], { limit: 2 }));
    assert.deepEqual(titles(latest), ["Post 2026-10-06", "Edition 2"]);
  });

  it("shows the date from starts, or a note instead", () => {
    const { latest } = build(config([item({ title: "Dated", label: "Event" }), item({ title: "Noted", url: "/n/", note: "Written note" })]));
    const note = (title) => latest.entries.find((entry) => entry.title === title).note;
    assert.equal(note("Dated"), "Event · November 01, 2026");
    assert.equal(note("Noted"), "Written note");
    assert.equal(note("Edition 2"), "Newsletter · October 01, 2026");
    assert.equal(note("Post 2026-10-06"), "October 06, 2026");
  });

  it("puts a newsletter fallback with no date last and keeps its note", () => {
    const fallback = { title: "News", note: "Our newsletter", url: "https://news.test/", image: "/news.webp", date: null };
    const { latest } = build(config(), NOW, { blog: POSTS, newsletter: [fallback] });
    assert.deepEqual(titles(latest), ["Post 2026-10-06", "Post 2026-09-15", "News"]);
    assert.equal(latest.entries.at(-1).note, "Our newsletter");
  });

  it("renders a future item hidden, with its times", () => {
    const { latest } = build(config([item({ title: "Soon", starts: "2026-11-10T09:00:00Z", ends: "2026-11-12" })]));
    const soon = latest.entries.find((entry) => entry.title === "Soon");
    assert.equal(soon.hidden, true);
    assert.equal(dataAttributes(soon)["data-starts"], "2026-11-10T09:00:00.000Z");
    assert.equal(dataAttributes(soon)["data-ends"], "2026-11-13T00:00:00.000Z");
    assert.equal(shownTitles(latest, "2026-11-11T00:00:00Z")[0], "Soon");
    assert.ok(!shownTitles(latest, "2026-11-13T00:00:00Z").includes("Soon"));
  });

  it("leaves out an item that has ended", () => {
    const { latest } = build(config([item({ title: "Over", starts: "2026-10-01", ends: "2026-10-02" })]));
    assert.ok(!latest.entries.some((entry) => entry.title === "Over"));
  });

  it("renders the item that moves up when a scheduled one ends", () => {
    const { latest } = build(config([item({ title: "Ending", ends: "2026-11-08" })], { limit: 3 }));
    assert.deepEqual(titles(latest), ["Ending", "Post 2026-10-06", "Edition 2"]);
    assert.deepEqual(shownTitles(latest, "2026-11-09T00:00:00Z"), ["Post 2026-10-06", "Edition 2", "Post 2026-09-15"]);
  });

  it("hands a shared link between a post and a hand item as they open and close", () => {
    const pinnedPost = item({ title: "Hand copy", url: POSTS[0].url, starts: "2026-11-10", ends: "2026-11-12" });
    const { latest } = build(config([pinnedPost], { limit: 4 }));
    assert.deepEqual(titles(latest), ["Post 2026-10-06", "Edition 2", "Post 2026-09-15"]);
    assert.deepEqual(shownTitles(latest, "2026-11-11T00:00:00Z"), ["Hand copy", "Edition 2", "Post 2026-09-15", "Post 2026-09-10"]);
    assert.deepEqual(shownTitles(latest, "2026-11-13T00:00:00Z"), titles(latest));
  });

  it("puts a new card at the top in place of an old post with the same link", () => {
    const card = item({ title: "New card", url: POSTS[0].url, starts: "2026-11-07" });
    const { latest } = build(config([card]));
    assert.equal(titles(latest)[0], "Post 2026-10-06");
    assert.deepEqual(shownTitles(latest, "2026-11-07T00:00:00Z"), ["New card", "Edition 2", "Post 2026-09-15", "Post 2026-09-10"]);
  });

  it("shows a card with a date-only starts in place of that day's newsletter", () => {
    const card = item({ title: "Newsletter card", url: EDITIONS[0].url, starts: "2026-10-01" });
    const { latest } = build(config([card]));
    const showing = titles(latest);
    assert.ok(showing.includes("Newsletter card"));
    assert.ok(!showing.includes("Edition 2"));
    assert.ok(showing.includes("Edition 1"));
  });

  it("keeps a card with an older starts in its own place, in place of a newer post", () => {
    const card = item({ title: "Older card", url: POSTS[0].url, starts: "2026-09-20" });
    const { latest } = build(config([card], { limit: 10 }));
    assert.deepEqual(titles(latest), ["Edition 2", "Older card", "Post 2026-09-15", "Post 2026-09-10"]);
  });

  it("brings the post back when a card with the same link ends", () => {
    const card = item({ title: "Short card", url: POSTS[0].url, starts: "2026-09-20", ends: "2026-11-10" });
    const { latest } = build(config([card], { limit: 10 }));
    assert.ok(titles(latest).includes("Short card"));
    assert.deepEqual(shownTitles(latest, "2026-11-11T00:00:00Z"), ["Post 2026-10-06", "Edition 2", "Post 2026-09-15"]);
  });

  it("stops rendering once enough items are certain to show", () => {
    const blog = Array.from({ length: 200 }, (_, index) => post(`2026-01-${String((index % 28) + 1).padStart(2, "0")}`, `P${index}`));
    const { latest } = build(config([], {}), NOW, { blog, newsletter: EDITIONS });
    assert.ok(latest.entries.length <= 5, `rendered ${latest.entries.length}`);
  });
});

describe("the large card", () => {
  it("is only rendered for items that might come first", () => {
    const { latest } = build(config([item({ title: "First", ends: "2026-11-08" })]));
    assert.deepEqual(
      latest.entries.slice(0, 4).map((entry) => [entry.title, entry.kind, entry.variant ?? null, entry.hidden]),
      [
        ["First", "hero", null, false],
        ["Post 2026-10-06", "hero", "hero", true],
        ["Post 2026-10-06", "row", "row", false],
        ["Edition 2", "row", null, false],
      ],
    );
  });

  it("moves to the next item when the first one ends", () => {
    const { latest } = build(config([item({ title: "First", ends: "2026-11-08" })]));
    const after = pageShows(latest, "2026-11-09T00:00:00Z");
    assert.equal(after[0].title, "Post 2026-10-06");
    assert.equal(after[0].kind, "hero");
    assert.ok(after.slice(1).every((entry) => entry.kind === "row"));
  });

  it("leaves a row for an item pushed down by a new one", () => {
    const { latest } = build(config([item({ title: "Soon", starts: "2026-11-10" })]));
    const after = pageShows(latest, "2026-11-11T00:00:00Z");
    assert.deepEqual(after.map((entry) => [entry.title, entry.kind]).slice(0, 2), [
      ["Soon", "hero"],
      ["Post 2026-10-06", "row"],
    ]);
  });
});

describe("YouTube items", () => {
  const entryOf = (overrides, now = NOW) => build(config([video(overrides)]), now).latest.entries.find((entry) => entry.title === "Stream");

  it("reads IDs from the usual links", () => {
    for (const value of [
      "XyAL1to3Lm4",
      "https://www.youtube.com/watch?v=XyAL1to3Lm4&t=10s",
      "https://youtu.be/XyAL1to3Lm4",
      "https://www.youtube.com/live/XyAL1to3Lm4",
      "https://m.youtube.com/shorts/XyAL1to3Lm4",
    ]) {
      assert.equal(youtubeId(value), "XyAL1to3Lm4", value);
    }
    assert.equal(youtubeId("https://example.com/watch?v=XyAL1to3Lm4"), null);
    assert.equal(youtubeId("https://www.youtube.com/@home_assistant"), null);
  });

  it("takes its place and date from airs", () => {
    const entry = entryOf();
    assert.equal(entry.kind, "video");
    assert.equal(entry.url, "https://www.youtube.com/watch?v=XyAL1to3Lm4");
    assert.equal(entry.image, "https://i.ytimg.com/vi/XyAL1to3Lm4/hqdefault.jpg");
    assert.equal(entry.note, "Livestream · Starts November 15 · 18:00 UTC");
    assert.equal(entry.noteAfter, "Livestream · November 15, 2026");
    assert.equal(entry.airs.toISOString(), "2026-11-15T18:00:00.000Z");
  });

  it("leaves the time out when only a day is given", () =>
    assert.equal(entryOf({ airs: "2026-11-15" }).note, "Livestream · Starts November 15"));

  it("comes down at the end of the day after it airs", () => {
    assert.equal(entryOf().ends.toISOString(), "2026-11-17T00:00:00.000Z");
    assert.equal(entryOf({ ends: "2026-11-22" }).ends.toISOString(), "2026-11-23T00:00:00.000Z");
  });

  it("can wait for its starts", () => {
    const { latest } = build(config([video({ starts: "2026-11-12" })]));
    assert.ok(!titles(latest).includes("Stream"));
    assert.equal(shownTitles(latest, "2026-11-13T00:00:00Z")[0], "Stream");
    assert.ok(!shownTitles(latest, "2026-11-17T00:00:00Z").includes("Stream"));
  });

  it("stays a large card in any position", () => {
    const { latest } = build(config([video({ airs: "2026-11-05T18:00:00Z" }), item({ title: "Newer", starts: "2026-11-06" })]));
    const stream = pageShows(latest, NOW)[1];
    assert.deepEqual([stream.title, stream.kind, stream.note], ["Stream", "video", "Livestream · November 05, 2026"]);
  });
});

describe("links", () => {
  it("follow starts and ends", () => {
    const { sections } = build(config([], {}, links({ label: "Now" }, { label: "Later", url: "/l/", starts: "2026-11-10" }, { label: "Going", url: "/g/", ends: "2026-11-08" })));
    const labels = (at) => pageShows(sections[0], at).map((link) => link.label);
    assert.deepEqual(labels(NOW), ["Now", "Going"]);
    assert.deepEqual(labels("2026-11-11T00:00:00Z"), ["Now", "Later"]);
  });

  it("leave out a section whose links have all ended", () => {
    const { sections } = build(config([], {}, links({ ends: "2026-01-01" })));
    assert.deepEqual(sections, []);
  });

  it("hide a section until its only link starts", () => {
    const { sections } = build(config([], {}, links({ starts: "2026-11-10" })));
    assert.equal(sections[0].hidden, true);
    assert.equal(sections[0].entries[0].hidden, true);
    assert.equal(pageShows(sections[0], "2026-11-11T00:00:00Z").length, 1);
  });
});

describe("what the page needs to check the time", () => {
  const scheduled = (cfg) => {
    const { latest, sections } = build(cfg);
    return [latest, ...sections].flatMap((list) => list.entries).filter((entry) => {
      const attributes = dataAttributes(entry);
      return attributes["data-starts"] || attributes["data-ends"];
    });
  };

  it("is nothing when nothing is still to change", () =>
    assert.deepEqual(scheduled(config([item()], {}, links({ starts: "2026-11-01" }))), []));

  it("is the times of anything still to start or end", () => {
    assert.equal(scheduled(config([item({ starts: "2026-11-10" })])).length, 1);
    assert.equal(scheduled(config([item({ ends: "2026-11-10" })])).length, 1);
    assert.equal(scheduled(config([], {}, links({ ends: "2026-11-10" }))).length, 1);
  });
});

describe("the page and the build agree", () => {
  const random = (seed) => () => (seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
  const day = (offset) => new Date(NOW.getTime() + offset * 86400000).toISOString().slice(0, 10);

  const scenario = (next) => {
    const pick = (min, max) => min + Math.floor(next() * (max - min + 1));
    const urls = ["/a/", "/b/", "/c/", "/blog/p0/", "/blog/p1/", "https://news.test/0/"];
    const items = Array.from({ length: pick(0, 5) }, (_, index) => {
      const starts = pick(-20, 10);
      const hand = { title: `Hand ${index}`, url: urls[pick(0, urls.length - 1)], image: "/i.webp", starts: day(starts) };
      if (next() < 0.5) hand.ends = day(starts + pick(0, 15));
      return hand;
    });
    if (next() < 0.3) items.push(video({ title: "Video", airs: day(pick(-1, 8)) }));
    const blog = Array.from({ length: pick(0, 5) }, (_, index) => ({ title: `P${index}`, url: `/blog/p${index}/`, image: "/p.webp", date: new Date(day(-index * 3 - 1)) }));
    const newsletter = Array.from({ length: pick(0, 3) }, (_, index) => ({ title: `N${index}`, url: `https://news.test/${index}/`, image: "/n.webp", date: new Date(day(-index * 4 - 2)) }));
    const cfg = config(items, { limit: pick(1, 6) });
    cfg.latest.feeds.blog.limit = pick(1, 3);
    cfg.latest.feeds.newsletter.limit = pick(1, 2);
    return { cfg, feeds: { blog, newsletter } };
  };

  const times = Array.from({ length: 30 }, (_, index) => new Date(NOW.getTime() + index * 86400000 + 3600000));

  it("show the same thing at build time", () => {
    const next = random(1);
    for (let run = 0; run < 300; run++) {
      const { cfg, feeds } = scenario(next);
      const { latest } = build(cfg, NOW, feeds);
      assert.deepEqual(shownTitles(latest, NOW), titles(latest), JSON.stringify(cfg.latest.items));
    }
  });

  it("the build never leaves out something that could show later", () => {
    const next = random(2);
    for (let run = 0; run < 300; run++) {
      const { cfg, feeds } = scenario(next);
      const { latest } = build(cfg, NOW, feeds);
      const everything = latestItems(cfg.latest, feeds, NOW).map((entry, index) => ({ ...entry, key: String(index) }));
      for (const at of times) {
        const keys = select({ entries: everything, limit: cfg.latest.limit }, at);
        const expected = keys.map((key) => everything[Number(key)].title);
        assert.deepEqual(shownTitles(latest, at), expected, `${at.toISOString()} ${JSON.stringify(cfg.latest)}`);
      }
    }
  });

  it("always shows a large card first and rows after", () => {
    const next = random(3);
    for (let run = 0; run < 300; run++) {
      const { cfg, feeds } = scenario(next);
      const { latest } = build(cfg, NOW, feeds);
      for (const at of times) {
        pageShows(latest, at).forEach((entry, position) => {
          if (entry.kind === "video") return;
          assert.equal(entry.kind, position === 0 ? "hero" : "row", `${entry.title} at ${position}, ${at.toISOString()}`);
        });
      }
    }
  });
});

describe("the website's time", () => {
  const ticks = () => {
    let now = 100;
    return () => (now += 100);
  };
  const respond = (headers, ok = true) => async () => ({ ok, headers: new Headers(headers) });

  it("sends a HEAD request that skips the browser's cache", async () => {
    let seen;
    const request = async (url, options) => {
      seen = { url, ...options };
      return { ok: true, headers: new Headers({ Date: "Fri, 06 Nov 2026 12:00:00 GMT" }) };
    };
    await readServerTime("/bio/", request, ticks());
    assert.deepEqual(seen, { url: "/bio/", method: "HEAD", cache: "no-store" });
  });

  it("uses Date, and ignores Age, which the CDN's fresh Date already covers", async () => {
    const server = await readServerTime("/bio/", respond({ Date: "Fri, 06 Nov 2026 12:00:00 GMT", Age: "8853" }), ticks());
    assert.deepEqual(server, { time: Date.parse("2026-11-06T12:00:00Z"), at: 250 });
  });

  it("gives up without a usable answer", async () => {
    assert.equal(await readServerTime("/bio/", respond({}), ticks()), null);
    assert.equal(await readServerTime("/bio/", respond({ Date: "soon" }), ticks()), null);
    assert.equal(await readServerTime("/bio/", respond({ Date: "Fri, 06 Nov 2026 12:00:00 GMT" }, false), ticks()), null);
    const offline = async () => {
      throw new Error("offline");
    };
    assert.equal(await readServerTime("/bio/", offline, ticks()), null);
  });
});
