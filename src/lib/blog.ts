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

export function blogPageHref(page: number, base = "/blog/"): string {
  return page === 1 ? base : `${base}posts/${page}/`;
}

export type FacetKind = "all" | "category" | "author" | "year";

export interface Facet {
  kind: FacetKind;
  slug: string;
  label: string;
  count: number;
  href: string;
  avatar?: string;
}

export interface BlogFacets {
  all: Facet;
  categories: Facet[];
  authors: Facet[];
  years: Facet[];
}

export interface BlogListing {
  facet: Facet;
  posts: Post[];
  page: number;
  totalPages: number;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function authorAvatar(slug: string): string | undefined {
  const author = AUTHORS[slug];
  if (author?.github) return `https://github.com/${author.github}.png?size=64`;
  return author?.avatar;
}

function postCategory(post: Post) {
  const label = post.data.category;
  return label ? [{ slug: slugify(label), label }] : [];
}

function postAuthors(post: Post) {
  return (post.data.author ?? []).map((slug) => ({ slug, label: AUTHORS[slug]?.name ?? slug }));
}

function postYear(post: Post) {
  const year = String(post.data.date.getUTCFullYear());
  return [{ slug: year, label: year }];
}

const FACET_VALUES = {
  category: postCategory,
  author: postAuthors,
  year: postYear,
} satisfies Record<Exclude<FacetKind, "all">, (post: Post) => { slug: string; label: string }[]>;

function buildFacets(posts: Post[], kind: Exclude<FacetKind, "all">): Facet[] {
  const counts = new Map<string, Facet>();
  for (const post of posts) {
    for (const { slug, label } of FACET_VALUES[kind](post)) {
      const facet = counts.get(slug) ?? {
        kind,
        slug,
        label,
        count: 0,
        href: `/blog/${kind}/${slug}/`,
        avatar: kind === "author" ? authorAvatar(slug) : undefined,
      };
      facet.count++;
      counts.set(slug, facet);
    }
  }
  return [...counts.values()];
}

export function getFacets(posts: Post[]): BlogFacets {
  const byCountThenLabel = (a: Facet, b: Facet) => b.count - a.count || a.label.localeCompare(b.label);
  return {
    all: { kind: "all", slug: "", label: "All posts", count: posts.length, href: "/blog/" },
    categories: buildFacets(posts, "category").sort(byCountThenLabel),
    authors: buildFacets(posts, "author").sort(byCountThenLabel),
    years: buildFacets(posts, "year").sort((a, b) => Number(b.slug) - Number(a.slug)),
  };
}

function matchesFacet(post: Post, facet: Facet): boolean {
  if (facet.kind === "all") return true;
  return FACET_VALUES[facet.kind](post).some((value) => value.slug === facet.slug);
}

function paginate(facet: Facet, posts: Post[]): BlogListing[] {
  const matching = posts.filter((post) => matchesFacet(post, facet));
  const totalPages = Math.max(1, Math.ceil(matching.length / POSTS_PER_PAGE));
  return Array.from({ length: totalPages }, (_, i) => ({
    facet,
    posts: matching.slice(i * POSTS_PER_PAGE, (i + 1) * POSTS_PER_PAGE),
    page: i + 1,
    totalPages,
  }));
}

/** Every blog listing page: the full archive plus each category, author and year, all paginated. */
export async function getBlogListings() {
  const posts = await getSortedPosts();
  const facets = getFacets(posts);
  const listings = [facets.all, ...facets.categories, ...facets.authors, ...facets.years].flatMap((facet) =>
    paginate(facet, posts),
  );
  return listings.map((listing) => {
    const path = blogPageHref(listing.page, listing.facet.href).replace(/^\/blog\/|\/$/g, "");
    return { params: { listing: path || undefined }, props: { listing, facets } };
  });
}

export type PaginationNavItem =
  | { ellipsis: true }
  | { ellipsis?: false; number: number; href: string; current: boolean };

/**
 * Builds a windowed page list for the pagination nav: first two pages,
 * last two pages, and the pages immediately around the current one,
 * with ellipsis markers standing in for the "..." gaps between them.
 */
export function buildPaginationNav(currentPage: number, totalPages: number, base = "/blog/"): PaginationNavItem[] {
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
      href: blogPageHref(page, base),
      current: page === currentPage,
    });
    previousPage = page;
  }
  return nav;
}
