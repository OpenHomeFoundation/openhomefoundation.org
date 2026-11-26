import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import { AUTHORS, postUrl } from "./blog";

export type Project = CollectionEntry<"researchProjects">;
export type Output = CollectionEntry<"researchOutputs">;
export type Finding = CollectionEntry<"researchFindings">;
export type ByOthersEntry = CollectionEntry<"researchByOthers">;
export type OutputType = Output["data"]["type"];
export type Field = ByOthersEntry["data"]["fields"][number];
export type OhfProject = ByOthersEntry["data"]["uses"][number];
type Relation = Project["data"]["related"][number]["relation"];
export type Link = { label: string; url: string; broken?: boolean };

export const FIELD_LABELS: Record<Field, string> = {
  energy: "Energy",
  hci: "Human–computer interaction",
  "security-monitoring": "Security and monitoring",
  "voice-language": "Voice and language",
  "health-care": "Health and care",
  accessibility: "Accessibility",
  "systems-software": "Systems and software",
};

export const PROJECT_LABELS: Record<OhfProject, string> = {
  "home-assistant": "Home Assistant",
  esphome: "ESPHome",
  piper: "Piper",
  other: "Other",
};

export const STATUS_LABELS: Record<Project["data"]["status"], string> = {
  "in-progress": "In progress",
  completed: "Completed",
  published: "Published",
  collaboration: "Collaboration",
};

export const RELATION_LABELS: Record<Relation, [stored: string, reverse: string]> = {
  "builds-on": ["Builds on", "Built on by"],
  "informed-by": ["Informed by", "Helped inform"],
  related: ["Related", "Related"],
};

export const TYPE_LABELS: Record<OutputType, [singular: string, plural: string]> = {
  paper: ["scientific paper", "scientific papers"],
  report: ["report", "reports"],
  dataset: ["dataset", "datasets"],
  "blog-post": ["blog post", "blog posts"],
  talk: ["talk", "talks"],
  poster: ["poster", "posters"],
  thesis: ["thesis", "theses"],
  questions: ["Survey questions", "Survey questions"],
  scripts: ["Analysis scripts", "Analysis scripts"],
  protocol: ["Protocol", "Protocols"],
  statistics: ["Descriptive statistics", "Descriptive statistics"],
  template: ["Template", "Templates"],
  wiki: ["Research wiki", "Research wikis"],
  readme: ["README", "READMEs"],
  discussion: ["Design discussion", "Design discussions"],
};

export const PUBLICATION_TYPES: OutputType[] = ["paper", "report", "thesis", "dataset", "blog-post", "talk", "poster"];

export const PUBLICATION_FILTERS = [
  { key: "papers", label: "Scientific papers", types: ["paper", "thesis", "poster"] },
  { key: "datasets", label: "Datasets", types: ["dataset"] },
  { key: "blog-posts", label: "Blog posts and reports", types: ["blog-post", "report"] },
  { key: "talks", label: "Talks", types: ["talk"] },
] as const satisfies { key: string; label: string; types: OutputType[] }[];

/** Listed first within each year of the publications index. */
export const SCIENTIFIC_TYPES: OutputType[] = ["paper", "thesis", "poster"];

const byDateDesc = (a: { date: Date }, b: { date: Date }) => b.date.getTime() - a.date.getTime();

export function projectUrl(slug: string): string {
  return `/research/projects/${slug}/`;
}

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  year: "numeric",
});

/** e.g. "Aug 2026" */
export function formatMonthYear(date: Date): string {
  return MONTH_YEAR.format(date);
}

export function isExternal(url: string): boolean {
  return url.includes("://");
}

/** The links a row offers: its own links, or "Read" for a post on this site. */
export function outputActions(output: { links: Link[]; url?: string; blog?: string }): Link[] {
  if (output.blog && output.url) return [{ label: "Read", url: output.url }];
  return output.links;
}

export function authorName(author: string): string {
  return AUTHORS[author]?.name ?? author;
}

// Astro only logs broken references, so fail the build here.

let referencesChecked: Promise<void> | undefined;

function checkReferences(): Promise<void> {
  referencesChecked ??= (async () => {
    const ids = async (name: "researchProjects" | "researchOutputs" | "blog") =>
      new Set((await getCollection(name)).map((e) => e.id));
    const [projectIds, outputIds, postIds] = await Promise.all([
      ids("researchProjects"),
      ids("researchOutputs"),
      ids("blog"),
    ]);
    const errors: string[] = [];
    const check = (known: Set<string>, ref: { id: string } | undefined, where: string) => {
      if (ref && !known.has(ref.id)) errors.push(`${where} → "${ref.id}" does not exist`);
    };

    for (const p of await getCollection("researchProjects")) {
      check(outputIds, p.data.primaryDataset, `Project "${p.id}" primaryDataset`);
      for (const r of p.data.related) check(projectIds, r.project, `Project "${p.id}" related`);
    }
    for (const o of await getCollection("researchOutputs")) {
      check(projectIds, o.data.project, `Output "${o.id}" project`);
      check(postIds, o.data.blog, `Output "${o.id}" blog`);
    }
    for (const f of await getCollection("researchFindings")) {
      check(projectIds, f.data.project, `Finding "${f.id}" project`);
    }
    if (errors.length) throw new Error(`Broken research references:\n${errors.join("\n")}`);
  })();
  return referencesChecked;
}

export async function getProjects(): Promise<Project[]> {
  await checkReferences();
  const projects = await getCollection("researchProjects");
  return projects.sort((a, b) => byDateDesc(a.data, b.data));
}

export async function getLatestProject(): Promise<Project | undefined> {
  return (await getProjects())[0];
}

export async function getOtherProjects(): Promise<Project[]> {
  return (await getProjects()).slice(1);
}

async function projectIds(): Promise<Set<string>> {
  return new Set((await getProjects()).map((p) => p.id));
}

export interface ResolvedOutput {
  id: string;
  project: string;
  kind: Output["data"]["kind"];
  type: OutputType;
  title: string;
  date: Date;
  authors: string[];
  venue?: string;
  description?: string;
  host?: string;
  doi?: string;
  url?: string;
  links: Link[];
  blog?: string;
}

async function resolveOutput(output: Output): Promise<ResolvedOutput> {
  const { data } = output;
  const post = data.blog ? await getEntry(data.blog) : undefined;

  const links = data.links;
  const doiUrl = data.doi ? `https://doi.org/${data.doi}` : undefined;

  return {
    id: output.id,
    project: data.project.id,
    kind: data.kind,
    type: data.type,
    title: data.title ?? post!.data.title,
    date: data.date ?? post!.data.date,
    authors: (data.authors.length ? data.authors : (post?.data.author ?? [])).map(authorName),
    venue: data.venue,
    description: data.description,
    host: data.host,
    doi: data.doi,
    url: post ? postUrl(post) : (doiUrl ?? links[0]?.url),
    links,
    blog: post?.id,
  };
}

async function getVisibleOutputs(): Promise<ResolvedOutput[]> {
  const ids = await projectIds();
  const outputs = await getCollection("researchOutputs", (o) => ids.has(o.data.project.id));
  return (await Promise.all(outputs.map(resolveOutput))).sort(byDateDesc);
}

export async function getProjectOutputs(slug: string): Promise<ResolvedOutput[]> {
  return (await getVisibleOutputs()).filter((o) => o.project === slug && o.kind === "output");
}

/** The primary dataset is pulled out so the page can highlight it. */
export async function getProjectMaterials(
  project: Project,
): Promise<{ primary?: ResolvedOutput; others: ResolvedOutput[] }> {
  const materials = (await getVisibleOutputs()).filter((o) => o.project === project.id && o.kind === "material");
  const primaryId = project.data.primaryDataset?.id;
  return {
    primary: materials.find((m) => m.id === primaryId),
    others: materials.filter((m) => m.id !== primaryId),
  };
}

export interface PublicationRow {
  id: string;
  type: OutputType;
  title: string;
  date: Date;
  authors: string[];
  venue?: string;
  url?: string;
  links: Link[];
  project?: { slug: string; title: string };
}

export interface PublicationYear {
  year: number;
  scientific: PublicationRow[];
  other: PublicationRow[];
}

export async function getPublicationsIndex(): Promise<PublicationYear[]> {
  const projects = new Map((await getProjects()).map((p) => [p.id, p]));
  const outputs = await getVisibleOutputs();
  const referencedPosts = new Set(outputs.map((o) => o.blog).filter(Boolean));

  const rows: PublicationRow[] = outputs
    .filter((o) => PUBLICATION_TYPES.includes(o.type) && projects.has(o.project))
    .map((o) => {
      const project = projects.get(o.project)!;
      return {
        id: o.id,
        type: o.type,
        title: o.title,
        date: o.date,
        authors: o.authors,
        venue: o.venue,
        url: o.url,
        links: outputActions(o),
        project: { slug: project.id, title: project.data.title },
      };
    });

  const posts = await getCollection("blog", (p) => p.data.category === "Research" && !referencedPosts.has(p.id));
  for (const post of posts) {
    rows.push({
      id: `blog-${post.id}`,
      type: "blog-post",
      title: post.data.title,
      date: post.data.date,
      authors: (post.data.author ?? []).map(authorName),
      url: postUrl(post),
      links: [{ label: "Read", url: postUrl(post) }],
    });
  }

  const years = new Map<number, PublicationRow[]>();
  for (const row of rows.sort(byDateDesc)) {
    const year = row.date.getUTCFullYear();
    years.set(year, [...(years.get(year) ?? []), row]);
  }
  return [...years].map(([year, items]) => ({
    year,
    scientific: items.filter((i) => SCIENTIFIC_TYPES.includes(i.type)),
    other: items.filter((i) => !SCIENTIFIC_TYPES.includes(i.type)),
  }));
}

export function publicationFilter(type: OutputType): string | undefined {
  return PUBLICATION_FILTERS.find((f) => (f.types as readonly OutputType[]).includes(type))?.key;
}

export async function getProjectFindings(slug: string): Promise<Finding[]> {
  await checkReferences();
  const findings = await getCollection("researchFindings", (f) => f.data.project.id === slug);
  return findings.sort((a, b) => a.data.order - b.data.order);
}

export async function getGlanceStats(slug: string): Promise<{ id: string; value: string; label: string }[]> {
  return (await getProjectFindings(slug))
    .filter((f) => f.data.glance)
    .slice(0, 4)
    .map((f) => ({ id: f.id, ...f.data.glance! }));
}

/** Drops links to project pages that don't exist. */
export async function findingLink(finding: Finding): Promise<Link | undefined> {
  const link = finding.data.link;
  const match = link?.url.match(/^\/research\/projects\/([^/]+)\/?$/);
  if (!link || !match) return link;
  return (await getProjects()).some((p) => p.id === match[1]) ? link : undefined;
}

export interface RelatedProject {
  project: Project;
  label: string;
}

export async function getRelated(slug: string): Promise<RelatedProject[]> {
  const projects = await getProjects();
  const byId = new Map(projects.map((p) => [p.id, p]));
  const related = new Map<string, RelatedProject>();

  for (const { project, relation } of byId.get(slug)?.data.related ?? []) {
    const target = byId.get(project.id);
    if (target)
      related.set(target.id, {
        project: target,
        label: RELATION_LABELS[relation][0],
      });
  }
  for (const source of projects) {
    if (source.id === slug || related.has(source.id)) continue;
    const link = source.data.related.find((r) => r.project.id === slug);
    if (link)
      related.set(source.id, {
        project: source,
        label: RELATION_LABELS[link.relation][1],
      });
  }
  return [...related.values()];
}

export type ByOthersSort = "newest" | "oldest" | "title";

export async function getByOthers(sort: ByOthersSort = "newest"): Promise<ByOthersEntry[]> {
  const entries = await getCollection("researchByOthers");
  const title = (a: ByOthersEntry, b: ByOthersEntry) => a.data.title.localeCompare(b.data.title);
  const year = (e: ByOthersEntry) => e.data.year ?? 0;
  return entries.sort((a, b) => {
    if (sort === "title") return title(a, b);
    const diff = sort === "oldest" ? year(a) - year(b) : year(b) - year(a);
    return diff || title(a, b);
  });
}

export async function getFeaturedByOthers(): Promise<ByOthersEntry[]> {
  return (await getByOthers())
    .filter((e) => e.data.featured)
    .sort((a, b) => a.data.featured! - b.data.featured!);
}

export function paginate<T>(entries: T[], pageSize: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < entries.length; i += pageSize) pages.push(entries.slice(i, i + pageSize));
  return pages;
}

/** Only the filter values that at least one entry actually has. */
export function getFilterFacets(entries: ByOthersEntry[]) {
  const present = <K extends string>(order: K[], values: K[]) => order.filter((v) => values.includes(v));
  return {
    fields: present(
      Object.keys(FIELD_LABELS) as Field[],
      entries.flatMap((e) => e.data.fields),
    ),
    uses: present(
      Object.keys(PROJECT_LABELS) as OhfProject[],
      entries.flatMap((e) => e.data.uses),
    ),
    types: present(
      ["paper", "dataset", "thesis"] as ByOthersEntry["data"]["type"][],
      entries.map((e) => e.data.type),
    ),
  };
}
