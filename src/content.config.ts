import { defineCollection, reference, z } from "astro:content";
import { file, glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    date: z.coerce.date(),
    author: z.array(z.string()).optional(),
    author_role: z.string().optional(),
    category: z.string().optional(),
    // When og_image is omitted, the dynamic OG image service is used instead
    // (see ogImage() in src/lib/blog.ts).
    og_image: z.string().optional(),
    card_image: z.string().optional(),
    hide_header_image: z.boolean().default(false),
    comments: z.boolean().default(false),
    // Crossposts: a teaser hosted here that canonicalises and redirects to an
    // article on one of our other sites.
    external_url: z.string().optional(),
    external_source: z.string().optional(),
  }),
});

const link = z.object({
  label: z.string(),
  url: z.string().refine((url) => url.startsWith("/") || URL.canParse(url), "Use a full URL or a path starting with /"),
});
const fact = z.object({ label: z.string(), value: z.string() });

const PROJECT_STATUS = ["planned", "in-progress", "completed", "published", "collaboration"] as const;
const RELATIONS = ["builds-on", "informed-by", "related"] as const;
const OUTPUT_TYPES = [
  "paper",
  "report",
  "dataset",
  "blog-post",
  "talk",
  "poster",
  "thesis",
  "questions",
  "scripts",
  "protocol",
  "statistics",
  "template",
  "wiki",
  "readme",
] as const;
const FIELDS = [
  "energy",
  "hci",
  "security-monitoring",
  "voice-language",
  "health-care",
  "accessibility",
  "systems-software",
] as const;
const OHF_PROJECTS = ["home-assistant", "esphome", "piper", "other"] as const;

const researchProjects = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/research/projects" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    standfirst: z.string().optional(),
    status: z.enum(PROJECT_STATUS),
    period: z.string().optional(), // free text, never computed from dates
    date: z.coerce.date(),
    team: z.array(z.string()).default([]),
    image: z.string().optional(),
    facts: z.array(fact).max(3).default([]),
    primaryDataset: reference("researchOutputs").optional(),
    statsLink: link.optional(),
    // Not rendered in V1 ("What it changed" removed 9 Nov)
    impacts: z
      .array(
        z.object({
          badge: z.string(),
          title: z.string(),
          text: z.string(),
          link: link.optional(),
        }),
      )
      .default([]),
    method: z
      .object({
        facts: z.array(fact).max(4).default([]),
        limitations: z.string().optional(),
      })
      .optional(),
    citation: z.object({ apa: z.string(), bibtex: z.string() }).optional(),
    related: z
      .array(
        z.object({
          project: reference("researchProjects"),
          relation: z.enum(RELATIONS),
        }),
      )
      .default([]),
    draft: z.boolean().default(false),
    notes: z.string().optional(), // internal only, never rendered
  }),
});

const researchOutputs = defineCollection({
  loader: file("src/content/research/outputs.yml"),
  schema: z
    .object({
      project: reference("researchProjects"),
      kind: z.enum(["output", "material"]),
      type: z.enum(OUTPUT_TYPES),
      blog: reference("blog").optional(),
      title: z.string().optional(),
      date: z.coerce.date().optional(),
      authors: z.array(z.string()).default([]),
      venue: z.string().optional(),
      description: z.string().optional(),
      host: z.string().optional(),
      doi: z.string().optional(),
      links: z.array(link).default([]),
      draft: z.boolean().default(false),
      notes: z.string().optional(),
    })
    .refine((o) => o.blog || (o.title && o.date), {
      message: "Outputs need either `blog` or both `title` and `date`",
    }),
});

const chartBars = z.object({
  type: z.literal("bars"),
  title: z.string(),
  subtitle: z.string().optional(),
  items: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      display: z.string().optional(),
    }),
  ),
});
const chartSplit = z.object({
  type: z.literal("split"),
  title: z.string(),
  subtitle: z.string().optional(),
  approximate: z.boolean().default(false),
  parts: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      display: z.string().optional(),
    }),
  ),
});
const chartNumbers = z.object({
  type: z.literal("numbers"),
  items: z
    .array(z.object({ title: z.string(), value: z.string(), label: z.string() }))
    .min(1)
    .max(2),
});
const chartStats = z.object({
  type: z.literal("stats"),
  items: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .min(2)
    .max(4),
});

const researchFindings = defineCollection({
  loader: file("src/content/research/findings.yml"),
  schema: z.object({
    project: reference("researchProjects"),
    order: z.number(),
    headline: z.string(),
    heading: z.string().optional(),
    text: z.string().optional(),
    glance: z.object({ value: z.string(), label: z.string() }).optional(),
    chart: z.discriminatedUnion("type", [chartBars, chartSplit, chartNumbers, chartStats]),
    provenance: z
      .object({
        question: z.string().optional(),
        responseType: z.string().optional(),
      })
      .default({}),
    link: link.optional(),
    draft: z.boolean().default(false),
    notes: z.string().optional(),
  }),
});

const researchByOthers = defineCollection({
  loader: file("src/content/research/by-others.yml"),
  schema: z
    .object({
      title: z.string(),
      year: z.number().int().optional(),
      added: z.coerce.date(),
      peerReviewed: z.boolean().optional(),
      collectedFrom: z.enum(["curated", "submitted", "automated"]).default("curated"),
      citationCount: z.number().int().nonnegative().optional(),
      type: z.enum(["paper", "dataset", "thesis", "preprint"]),
      authors: z.string().optional(),
      venue: z.string().optional(),
      institution: z.string().optional(),
      fields: z.array(z.enum(FIELDS)).min(1),
      uses: z.array(z.enum(OHF_PROJECTS)).min(1),
      openAccess: z.boolean().optional(),
      summary: z.string().optional(),
      links: z.array(link).min(1),
      draft: z.boolean().default(false),
      notes: z.string().optional(),
    })
    .refine((e) => e.draft || (e.year && e.venue), {
      message: "Published entries need `year` and `venue`",
    }),
});

export const collections = {
  blog,
  researchProjects,
  researchOutputs,
  researchFindings,
  researchByOthers,
};
