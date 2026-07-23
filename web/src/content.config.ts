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
  loader: glob({
    pattern: ["*/README.md", "!archive/README.md"],
    base: "../opendata-linz",
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    provider: z.string(),
    status: z.enum(["essential", "recommended", "optional", "in-progress"]),
    format: z.string(),
    license: z.string(),
    data_vintage: z.string(),
  }),
});

const datasetDocs = defineCollection({
  loader: glob({
    pattern: "*/API.md",
    base: "../opendata-linz",
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    intro: z.string().optional(),
  }),
});

export const collections = { tutorials, datasets, datasetDocs, pages };
