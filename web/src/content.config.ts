import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const tutorials = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/tutorials" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
  }),
});

const datasets = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/datasets" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    provider: z.string(),
    url: z.url(),
    group: z.enum(["festival", "linz"]),
    status: z.enum(["recommended", "preparation", "optional"]).optional(),
    order: z.number(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    intro: z.string().optional(),
  }),
});

export const collections = { tutorials, datasets, pages };
