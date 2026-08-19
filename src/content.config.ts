import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

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

export const collections = { blog };
