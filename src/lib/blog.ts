import { getCollection, type CollectionEntry } from "astro:content";
import authors from "../data/authors.yml";
import blogCategories from "../data/blog-categories.yml";
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
  return `${text.slice(0, length - 1).trimEnd()}…`;
}

export function blogPageHref(page: number, base = "/blog/"): string {
  return page === 1 ? base : `${base}posts/${page}/`;
}

export type FilterKind = "category" | "year" | "author";

export interface Facet {
  kind: FilterKind;
  slug: string;
  label: string;
  count: number;
  href: string;
  avatar?: string;
}

export type Filters = Partial<Record<FilterKind, Facet>>;

export interface DrawerItem {
  label: string;
  count?: number;
  href: string;
  current: boolean;
  avatar?: string;
}

export interface BlogDrawer {
  allCategories: DrawerItem;
  topCategories: DrawerItem[];
  moreCategories: DrawerItem[];
  moreOpen: boolean;
  allYears: DrawerItem;
  years: DrawerItem[];
  authors: DrawerItem[];
}

export interface ActiveFilter {
  kind: FilterKind;
  prefix: string;
  label: string;
  removeHref: string;
}

export interface Breadcrumb {
  name: string;
  href: string;
}

export interface BlogListing {
  base: string;
  heading: string;
  title: string;
  description: string;
  intro?: string;
  count: number;
  breadcrumbs: Breadcrumb[];
  active: ActiveFilter[];
  drawer: BlogDrawer;
  noindex: boolean;
  posts: Post[];
  featured?: Post;
  page: number;
  totalPages: number;
}

const TOP_CATEGORIES = 7;
const BLOG_DESCRIPTION = "News and updates from the Open Home Foundation";
const CATEGORY_INTROS: Record<string, { intro?: string }> = blogCategories ?? {};
const FILTER_PREFIX: Record<FilterKind, string> = { category: "Category", year: "Year", author: "Author" };

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function authorAvatar(slug: string): string | undefined {
  const author = AUTHORS[slug];
  if (author?.github) return `https://github.com/${author.github}.png?size=64`;
  return author?.avatar;
}

export interface PostAuthor {
  slug: string;
  name: string;
  avatar?: string;
}

export function postAuthors(post: Post): PostAuthor[] {
  return (post.data.author ?? []).map((slug) => ({ slug, name: AUTHORS[slug]?.name ?? slug, avatar: authorAvatar(slug) }));
}

const FILTER_VALUES: Record<FilterKind, (post: Post) => { slug: string; label: string }[]> = {
  category: (post) => (post.data.category ? [{ slug: slugify(post.data.category), label: post.data.category }] : []),
  year: (post) => {
    const year = String(post.data.date.getUTCFullYear());
    return [{ slug: year, label: year }];
  },
  author: (post) => postAuthors(post).map(({ slug, name }) => ({ slug, label: name })),
};

const FILTER_PATH: Record<FilterKind, string> = { category: "category", year: "year", author: "author" };

function buildFacets(posts: Post[], kind: FilterKind): Facet[] {
  const facets = new Map<string, Facet>();
  for (const post of posts) {
    for (const { slug, label } of FILTER_VALUES[kind](post)) {
      const facet = facets.get(slug) ?? {
        kind,
        slug,
        label,
        count: 0,
        href: `/blog/${FILTER_PATH[kind]}/${slug}/`,
        avatar: kind === "author" ? authorAvatar(slug) : undefined,
      };
      facet.count++;
      facets.set(slug, facet);
    }
  }
  const facetList = [...facets.values()];
  return kind === "year"
    ? facetList.sort((a, b) => Number(b.slug) - Number(a.slug))
    : facetList.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function matches(post: Post, filters: Filters): boolean {
  return (Object.entries(filters) as [FilterKind, Facet | undefined][]).every(
    ([kind, facet]) => !facet || FILTER_VALUES[kind](post).some((value) => value.slug === facet.slug),
  );
}

/** The listing page for a set of filters. Authors never combine; category and year do. */
export function filtersHref({ category, year, author }: Filters): string {
  if (author) return author.href;
  if (category && year) return `${category.href}${year.slug}/`;
  return category?.href ?? year?.href ?? "/blog/";
}

function withoutFilter(filters: Filters, kind: FilterKind): Filters {
  const { [kind]: _removed, ...rest } = filters;
  return rest;
}

function heading({ category, year, author }: Filters): string {
  if (category && year) return `${category.label} from ${year.label}`;
  if (category) return category.label;
  if (author) return `Posts by ${author.label}`;
  if (year) return `Posts from ${year.label}`;
  return "Blog";
}

function description({ category, year, author }: Filters): string {
  const parts = [
    category && `in ${category.label}`,
    author && `by ${author.label}`,
    year && `from ${year.label}`,
  ].filter(Boolean);
  return parts.length ? `Open Home Foundation blog posts ${parts.join(" ")}` : BLOG_DESCRIPTION;
}

function intro(filters: Filters): string | undefined {
  const kinds = Object.keys(filters);
  if (kinds.length === 0) return BLOG_DESCRIPTION;
  if (kinds.length === 1 && filters.category) return CATEGORY_INTROS[filters.category.slug]?.intro;
  return undefined;
}

function breadcrumbs({ category, year }: Filters): Breadcrumb[] {
  const crumbs = [{ name: "Blog", href: "/blog/" }];
  if (category && year) crumbs.push({ name: category.label, href: category.href });
  return crumbs;
}

function activeFilters(filters: Filters): ActiveFilter[] {
  return (["category", "year", "author"] as const).flatMap((kind) => {
    const facet = filters[kind];
    return facet
      ? [{ kind, prefix: FILTER_PREFIX[kind], label: facet.label, removeHref: filtersHref(withoutFilter(filters, kind)) }]
      : [];
  });
}

function drawer(posts: Post[], authors: Facet[], filters: Filters): BlogDrawer {
  const { category, year, author } = filters;
  const inYear = year ? posts.filter((post) => matches(post, { year })) : posts;
  const inCategory = category ? posts.filter((post) => matches(post, { category })) : posts;

  const categories = buildFacets(inYear, "category").map((c) => ({
    label: c.label,
    count: c.count,
    href: filtersHref({ category: c, year }),
    current: category?.slug === c.slug,
  }));
  const more = categories.slice(TOP_CATEGORIES).sort((a, b) => a.label.localeCompare(b.label));

  return {
    allCategories: { label: "All posts", count: inYear.length, href: filtersHref({ year }), current: !category && !author },
    topCategories: categories.slice(0, TOP_CATEGORIES),
    moreCategories: more,
    moreOpen: more.some((item) => item.current),
    allYears: { label: "All", href: filtersHref({ category }), current: !year && !author },
    years: buildFacets(inCategory, "year").map((y) => ({
      label: y.label,
      href: filtersHref({ category, year: y }),
      current: year?.slug === y.slug,
    })),
    authors: authors.map((a) => ({
      label: a.label,
      count: a.count,
      href: a.href,
      current: author?.slug === a.slug,
      avatar: a.avatar,
    })),
  };
}

/** The unfiltered archive features its newest post on page 1, ahead of a full page of cards. */
function paginate(posts: Post[], authors: Facet[], filters: Filters): BlogListing[] {
  const matching = posts.filter((post) => matches(post, filters));
  const unfiltered = Object.keys(filters).length === 0;
  const featured = unfiltered ? matching[0] : undefined;
  const rest = featured ? matching.slice(1) : matching;
  const totalPages = Math.max(1, Math.ceil(rest.length / POSTS_PER_PAGE));
  const shared = {
    base: filtersHref(filters),
    heading: heading(filters),
    intro: intro(filters),
    count: matching.length,
    breadcrumbs: breadcrumbs(filters),
    active: activeFilters(filters),
    drawer: drawer(posts, authors, filters),
    noindex: Boolean(filters.category && filters.year),
  };
  const meta = description(filters);

  return Array.from({ length: totalPages }, (_, i) => {
    const page = i + 1;
    return {
      ...shared,
      title: page > 1 ? `${shared.heading}, page ${page} of ${totalPages}` : shared.heading,
      description: page > 1 ? `${meta}, page ${page} of ${totalPages}.` : `${meta}.`,
      posts: rest.slice(i * POSTS_PER_PAGE, page * POSTS_PER_PAGE),
      featured: page === 1 ? featured : undefined,
      page,
      totalPages,
    };
  });
}

/**
 * Every blog listing page: the full archive, each category, author and year,
 * and each category in every year it has posts, all paginated.
 */
export async function getBlogListings() {
  const posts = await getSortedPosts();
  const categories = buildFacets(posts, "category");
  const authors = buildFacets(posts, "author");
  const years = buildFacets(posts, "year");
  const yearsBySlug = new Map(years.map((year) => [year.slug, year]));

  const combinations: Filters[] = [
    {},
    ...categories.map((category) => ({ category })),
    ...authors.map((author) => ({ author })),
    ...years.map((year) => ({ year })),
    ...categories.flatMap((category) =>
      buildFacets(
        posts.filter((post) => matches(post, { category })),
        "year",
      ).map((year) => ({ category, year: yearsBySlug.get(year.slug) })),
    ),
  ];

  return combinations
    .flatMap((filters) => paginate(posts, authors, filters))
    .map((listing) => {
      const path = blogPageHref(listing.page, listing.base).replace(/^\/blog\/|\/$/g, "");
      return { params: { listing: path || undefined }, props: { listing } };
    });
}

export type PaginationNavItem =
  | { ellipsis: true }
  | { ellipsis?: false; number: number; href: string; current: boolean };

/**
 * The page numbers to link, with ellipsis markers for the gaps: the first
 * and last two pages and those next to the current one, or, `compact` for
 * phones, only the first, current and last pages.
 */
export function buildPaginationNav(
  currentPage: number,
  totalPages: number,
  base = "/blog/",
  compact = false,
): PaginationNavItem[] {
  const candidates = compact
    ? [1, currentPage, totalPages]
    : [1, 2, currentPage - 1, currentPage, currentPage + 1, totalPages - 1, totalPages];
  const sortedPages = [...new Set(candidates.filter((page) => page >= 1 && page <= totalPages))].sort((a, b) => a - b);

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
