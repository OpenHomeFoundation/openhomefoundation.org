// The link-in-bio page's data, shared by the page and the thumbnail endpoint
// (src/pages/bio/thumbs/[id].webp.ts). The rules are in bio-list.mjs and
// bio-schedule.mjs.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharpService from "astro/assets/services/sharp";
import bio from "../data/bio.yml";
import { buildBio, validate } from "./bio-list.mjs";
import { cardImage, getSortedPosts, postUrl } from "./blog";

// Thumbnails display at 104 × 58.5 CSS px, so this covers 3x screens.
const THUMB_WIDTH = 312;
const THUMB_HEIGHT = 176;

interface Thumb {
  path: string;
  data: Uint8Array;
}

validate(bio);
export { bio };

interface NewsletterFallback {
  title: string;
  note: string;
  url: string;
  image: string;
}

// Every edition in the newsletter's RSS feed. If the feed can't be reached,
// there's one undated item with the details written in bio.yml.
async function newsletterEditions({ title, note, url, image }: NewsletterFallback) {
  const fallback = { title, note, url, image, date: null };
  try {
    const response = await fetch("https://newsletter.openhomefoundation.org/rss/", {
      signal: AbortSignal.timeout(5000),
    });
    const editions = (await response.text())
      .split("<item>")
      .slice(1)
      .flatMap((item) => {
        const pick = (pattern: RegExp) => item.match(pattern)?.[1];
        const title = pick(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
        const url = pick(/<link>(.*?)<\/link>/);
        const date = new Date(pick(/<pubDate>(.*?)<\/pubDate>/) ?? "");
        // Ghost serves a resized WebP copy of any upload; the original is a large PNG.
        const edition = pick(/<media:content url="(.*?)"/)?.replace("/content/images/", "/content/images/size/w1200/format/webp/");
        if (!title || !url) return [];
        return [{ title, url, image: edition ?? image, date: Number.isNaN(date.getTime()) ? null : date }];
      });
    if (editions.length === 0) throw new Error("no edition in the feed");
    return editions;
  } catch (error) {
    console.warn(`bio: using the fallback newsletter link (${(error as Error).message})`);
    return [fallback];
  }
}

// A small 16:9 copy of the image, so the browser isn't scaling a 1200px
// image down to a thumbnail. Without one, the row uses the full image.
async function thumbnail(image: string): Promise<Thumb | undefined> {
  try {
    const source = image.startsWith("/")
      ? await readFile(join(process.cwd(), "public", image))
      : new Uint8Array(await (await fetch(image, { signal: AbortSignal.timeout(10000) })).arrayBuffer());
    const { data } = await sharpService.transform(
      source,
      { src: image, width: THUMB_WIDTH, height: THUMB_HEIGHT, fit: "cover", format: "webp", quality: 80 },
      { service: { entrypoint: "astro/assets/services/sharp", config: {} } } as Parameters<
        typeof sharpService.transform
      >[2],
    );
    const id = createHash("sha1").update(image).digest("hex").slice(0, 12);
    return { path: `/bio/thumbs/${id}.webp`, data: new Uint8Array(data) };
  } catch (error) {
    console.warn(`bio: no thumbnail for ${image} (${(error as Error).message})`);
  }
}

async function load() {
  const blog = (await getSortedPosts())
    .filter((post) => !post.data.external_url)
    .map((post) => ({ title: post.data.title, url: postUrl(post), image: cardImage(post), date: post.data.date }));
  const newsletter = await newsletterEditions(bio.latest.feeds.newsletter);
  const page = buildBio(bio, { blog, newsletter }, new Date());
  const entries = await Promise.all(
    page.latest.entries.map(async (entry: { kind: string; image: string }) =>
      entry.kind === "row" ? { ...entry, thumb: await thumbnail(entry.image) } : entry,
    ),
  );
  return { ...page, latest: { ...page.latest, entries } };
}

// Loaded once per build: the page and the thumbnail endpoint share it.
let page: ReturnType<typeof load> | undefined;
export function bioPage() {
  return (page ??= load());
}
