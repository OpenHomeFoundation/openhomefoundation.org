import { getCollection, type CollectionEntry } from "astro:content";
import authors from "../data/authors.yml";
import { SITE_URL } from "./site";

export type Post = CollectionEntry<"blog">;

export const POSTS_PER_PAGE = 12;

export interface Author {
  name: string;
  github?: string;
  avatar?: string;
}

export const AUTHORS: Record<string, Author> = authors;

/** All blog posts, newest first. */
export async function getSortedPosts(): Promise<Post[]> {
  const posts = await getCollection("blog");
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function postUrl(post: Post): string {
  return `/blog/${post.id}/`;
}

/** Comma-separated author names for meta tags and the Atom feed. */
export function authorDisplay(post: Post): string | null {
  if (!post.data.author) return null;
  return post.data.author.map((slug) => AUTHORS[slug]?.name ?? slug).join(", ");
}

/** Estimated reading time in minutes, based on the raw markdown body. */
export function readingTime(post: Post): number {
  const text = (post.body ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const words = text.split(" ").filter((w) => w).length;
  return Math.max(1, Math.floor(words / 250) + 1);
}

/**
 * The OpenGraph image for a post. Posts without an explicit og_image fall
 * back to the dynamic OG image service, pointed at the crosspost source for
 * external posts and at the post's own URL otherwise.
 */
export function ogImage(post: Post): string {
  if (post.data.og_image) return post.data.og_image;
  const target = post.data.external_url ?? `${SITE_URL}${postUrl(post)}`;
  return `https://assets.openhomefoundation.org/opengraph?url=${target}`;
}

/** The image shown on blog listing cards. */
export function cardImage(post: Post): string {
  return post.data.card_image ?? ogImage(post);
}

/** Frontmatter dates are UTC midnight, so always format in UTC. */
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "2-digit",
});

const DATE_FORMAT_WITH_WEEKDAY = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "2-digit",
});

/** e.g. "August 13, 2026" */
export function formatDate(date: Date): string {
  return DATE_FORMAT.format(date);
}

/** e.g. "Thursday, August 13, 2026" */
export function formatDateWithWeekday(date: Date): string {
  return DATE_FORMAT_WITH_WEEKDAY.format(date);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length - 3)}...`;
}

export function blogPageHref(page: number): string {
  return page === 1 ? "/blog/" : `/blog/posts/${page}/`;
}

export type PaginationNavItem =
  | { ellipsis: true }
  | { ellipsis?: false; number: number; href: string; current: boolean };

/**
 * Builds a windowed page list for the pagination nav: first two pages,
 * last two pages, and the pages immediately around the current one,
 * with ellipsis markers standing in for the "..." gaps between them.
 */
export function buildPaginationNav(currentPage: number, totalPages: number): PaginationNavItem[] {
  const pageNumbers = new Set(
    [1, 2, currentPage - 1, currentPage, currentPage + 1, totalPages - 1, totalPages].filter(
      (page) => page >= 1 && page <= totalPages,
    ),
  );
  const sortedPages = [...pageNumbers].sort((a, b) => a - b);

  const nav: PaginationNavItem[] = [];
  let previousPage: number | null = null;
  for (const page of sortedPages) {
    if (previousPage !== null && page - previousPage > 1) {
      nav.push({ ellipsis: true });
    }
    nav.push({
      number: page,
      href: blogPageHref(page),
      current: page === currentPage,
    });
    previousPage = page;
  }
  return nav;
}
