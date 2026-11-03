// The "Latest" list on the link-in-bio page, shared by the page and the
// thumbnail endpoint (src/pages/bio/thumbs/[id].webp.ts).
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharpService from "astro/assets/services/sharp";
import bio from "../data/bio.yml";
import { cardImage, formatDate, getSortedPosts, postUrl } from "./blog";

// Thumbnails display at 104 × 58.5 CSS px, so this covers 3x screens.
const THUMB_WIDTH = 312;
const THUMB_HEIGHT = 176;

interface Item {
  title: string;
  note: string;
  url: string;
  image: string;
  thumb?: { path: string; data: Uint8Array };
}

// The newest edition from the newsletter's RSS feed. If the feed can't be
// reached, the item keeps the details written in bio.yml.
async function latestNewsletter(fallback: Item): Promise<Item> {
  try {
    const response = await fetch("https://newsletter.openhomefoundation.org/rss/", {
      signal: AbortSignal.timeout(5000),
    });
    const item = (await response.text()).split("<item>")[1] ?? "";
    const pick = (pattern: RegExp) => item.match(pattern)?.[1];
    const title = pick(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    const url = pick(/<link>(.*?)<\/link>/);
    const date = pick(/<pubDate>(.*?)<\/pubDate>/);
    // Ghost serves a resized WebP copy of any upload; the original is a large PNG.
    const image = pick(/<media:content url="(.*?)"/)?.replace("/content/images/", "/content/images/size/w1200/format/webp/");
    if (!title || !url) throw new Error("no edition in the feed");
    return {
      title,
      url,
      note: date ? `Newsletter · ${formatDate(new Date(date))}` : fallback.note,
      image: image ?? fallback.image,
    };
  } catch (error) {
    console.warn(`bio: using the fallback newsletter link (${(error as Error).message})`);
    return fallback;
  }
}

// A small 16:9 copy of the image, so the browser isn't scaling a 1200px
// image down to a thumbnail. Without one, the row uses the full image.
async function thumbnail(image: string): Promise<Item["thumb"]> {
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

async function load(): Promise<Item[]> {
  const curated: Item[] = await Promise.all(
    bio.latest.map((item: Item & { feed?: string }) => (item.feed === "newsletter" ? latestNewsletter(item) : item)),
  );
  const curatedUrls = new Set(curated.map((item) => item.url));
  const posts = (await getSortedPosts())
    .filter((post) => !post.data.external_url && !curatedUrls.has(postUrl(post)))
    .slice(0, 2)
    .map((post) => ({
      title: post.data.title,
      note: formatDate(post.data.date),
      url: postUrl(post),
      image: cardImage(post),
    }));
  // The first item is shown as a large card with the full image.
  const [first, ...rest] = [...curated, ...posts];
  return [first, ...(await Promise.all(rest.map(async (item) => ({ ...item, thumb: await thumbnail(item.image) }))))];
}

// Loaded once per build: the page and the thumbnail endpoint share it.
let latest: Promise<Item[]> | undefined;
export function bioLatest() {
  return (latest ??= load());
}
