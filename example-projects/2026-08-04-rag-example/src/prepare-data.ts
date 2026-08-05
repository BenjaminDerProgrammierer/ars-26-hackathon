import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readJson, writeJson } from "./io.js";
import type { Language, PreparedDataset, PreparedDocument } from "./types.js";

const DOCUMENT_BUILDER_VERSION = 1;
const CANONICAL_ID = /^[a-f0-9]{32}$/;
type JsonRecord = Record<string, unknown>;

function record(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as JsonRecord;
}

function records(value: unknown, label: string): JsonRecord[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value.map((item, index) => record(item, `${label}[${index}]`));
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function ids(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function splitContent(value: string, maximumLength: number): string[] {
  if (value.length <= maximumLength) return [value];
  const paragraphs = value.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs.length ? paragraphs : [value]) {
    if (paragraph.length > maximumLength) {
      if (current) chunks.push(current);
      current = "";
      for (let start = 0; start < paragraph.length; start += maximumLength) {
        chunks.push(paragraph.slice(start, start + maximumLength));
      }
    } else if (!current) {
      current = paragraph;
    } else if (current.length + 2 + paragraph.length <= maximumLength) {
      current += `\n\n${paragraph}`;
    } else {
      chunks.push(current);
      current = paragraph;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function locationLabel(location: JsonRecord, language: Language): string | null {
  return (
    text(location[`Breadcrumb ${language.toUpperCase()}`]) ??
    text(location[`Name ${language.toUpperCase()}`]) ??
    text(location[language === "en" ? "Name DE" : "Name EN"])
  );
}

function projectDocuments(
  project: JsonRecord,
  locations: Map<string, JsonRecord>,
  maximumChunkLength: number,
): PreparedDocument[] {
  if (project.public_for_hackathon !== true) return [];
  const projectId = text(project.canonical_id);
  if (!projectId || !CANONICAL_ID.test(projectId)) {
    throw new Error("Every public project must have a valid canonical_id");
  }

  return (["en", "de"] as const).flatMap((language) => {
    const suffix = language.toUpperCase();
    const title = text(project[`Name ${suffix}`]) ?? text(project[language === "en" ? "Name DE" : "Name EN"]);
    const preview = text(project[`Web Preview Text ${suffix}`]);
    const description = text(project[`Description ${suffix}`]);
    if (!title || (!preview && !description)) return [];

    const location = ids(project["Linked Location"])
      .map((id) => locations.get(id))
      .filter((item): item is JsonRecord => Boolean(item))
      .map((item) => locationLabel(item, language))
      .filter((item): item is string => Boolean(item))
      .join("; ") || null;
    const category = text(project.Category);
    const artists = text(project.Artists);
    const subtitle = text(project[`Subtitle ${suffix}`]);
    const metadata = [
      `Title: ${title}`,
      category && `Category: ${category}`,
      subtitle && `Subtitle: ${subtitle}`,
      artists && `Artists: ${artists}`,
      location && `Location: ${location}`,
    ].filter((item): item is string => Boolean(item)).join("\n");
    const body = [preview, description].filter((item): item is string => Boolean(item)).join("\n\n");
    const chunks = splitContent(body, Math.max(200, maximumChunkLength - metadata.length - 2));
    const linkAllowed = project.link_allowed === true;
    const url = linkAllowed ? text(project["Web Link"]) : null;

    return chunks.map((chunk, index) => ({
      projectId,
      chunkId: `${projectId}:${language}:${index}`,
      language,
      title,
      category,
      location,
      text: `${metadata}\n\n${chunk}`,
      url,
      linkAllowed,
      publicForHackathon: true as const,
    }));
  });
}

export function prepareDataset(raw: unknown, maximumChunkLength = 3_000): PreparedDataset {
  const root = record(raw, "Festival export");
  const meta = record(root._meta, "_meta");
  const locations = new Map(
    records(root.locations, "locations").flatMap((location) => {
      const id = text(location.canonical_id);
      return id ? [[id, location] as const] : [];
    }),
  );
  const documents = records(root.projects, "projects").flatMap((project) =>
    projectDocuments(project, locations, maximumChunkLength),
  );

  return {
    datasetGeneratedAt: text(meta.generated_at) ?? "unknown",
    datasetSchemaVersion: text(meta.schema_version) ?? "unknown",
    documentBuilderVersion: DOCUMENT_BUILDER_VERSION,
    documents,
  };
}

async function main(): Promise<void> {
  const directory = dirname(fileURLToPath(import.meta.url));
  const defaultInput = resolve(directory, "../../../ars-dataset/notion_export.json");
  const defaultOutput = resolve(directory, "../data/documents.json");
  const input = resolve(process.argv[2] ?? defaultInput);
  const output = resolve(process.argv[3] ?? defaultOutput);
  const prepared = prepareDataset(await readJson<unknown>(input));
  await mkdir(dirname(output), { recursive: true });
  await writeJson(output, prepared);
  console.log(`Prepared ${prepared.documents.length} public document chunks in ${output}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
