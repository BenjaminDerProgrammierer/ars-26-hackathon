import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { OpenRouterEmbeddingProvider } from "./embeddings.js";
import { numberEnvironment, positiveIntegerEnvironment, readJson, requiredEnvironment } from "./io.js";
import type { SearchResult, VectorIndex } from "./types.js";

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) throw new Error("Vectors must have equal, non-zero dimensions");
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    dot += a * b;
    leftMagnitude += a * a;
    rightMagnitude += b * b;
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

export function searchIndex(
  index: VectorIndex,
  queryEmbedding: number[],
  options: { limit?: number; minimumScore?: number; language?: "en" | "de" } = {},
): SearchResult[] {
  if (queryEmbedding.length !== index.manifest.vectorDimensions) {
    throw new Error(`Query has ${queryEmbedding.length} dimensions; index requires ${index.manifest.vectorDimensions}`);
  }
  const limit = options.limit ?? 5;
  const minimumScore = options.minimumScore ?? 0.25;
  const bestByProject = new Map<string, SearchResult>();
  for (const entry of index.entries) {
    if (entry.document.publicForHackathon !== true) continue;
    if (options.language && entry.document.language !== options.language) continue;
    const result = { document: entry.document, score: cosineSimilarity(queryEmbedding, entry.embedding) };
    const current = bestByProject.get(entry.document.projectId);
    if (result.score >= minimumScore && (!current || result.score > current.score)) {
      bestByProject.set(entry.document.projectId, result);
    }
  }
  return [...bestByProject.values()].sort((left, right) => right.score - left.score).slice(0, limit);
}

export function validateIndex(index: VectorIndex, expectedModel: string): void {
  if (index.manifest.embeddingModel !== expectedModel) {
    throw new Error(`Index uses ${index.manifest.embeddingModel}, but OPENROUTER_EMBEDDING_MODEL is ${expectedModel}. Rebuild the index.`);
  }
  if (index.entries.length !== index.manifest.documentCount) throw new Error("Index manifest document count is stale");
  if (index.entries.some((entry) => entry.embedding.length !== index.manifest.vectorDimensions)) {
    throw new Error("Index contains vectors with inconsistent dimensions");
  }
}

export async function retrieve(question: string, indexPath = "data/vector-index.json"): Promise<SearchResult[]> {
  if (!question.trim()) throw new Error("Pass a non-empty search question");
  const model = process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || "mistralai/mistral-embed-2312";
  const index = await readJson<VectorIndex>(resolve(indexPath));
  validateIndex(index, model);
  const provider = new OpenRouterEmbeddingProvider({ apiKey: requiredEnvironment("OPENROUTER_API_KEY"), model });
  const [queryEmbedding] = await provider.embed([question], "search_query");
  if (!queryEmbedding) throw new Error("OpenRouter did not return a query embedding");
  return searchIndex(index, queryEmbedding, {
    limit: positiveIntegerEnvironment("RAG_RESULT_LIMIT", 5),
    minimumScore: numberEnvironment("RAG_MIN_SIMILARITY", 0.25),
  });
}

export function printResults(results: SearchResult[]): void {
  if (results.length === 0) {
    console.log("No sufficiently similar public festival projects were found.");
    return;
  }
  for (const [index, result] of results.entries()) {
    const details = [result.document.category, result.document.location].filter(Boolean).join(" · ");
    console.log(`${index + 1}. ${result.document.title} — similarity ${result.score.toFixed(3)}${details ? ` — ${details}` : ""}`);
    if (result.document.linkAllowed && result.document.url) console.log(`   ${result.document.url}`);
  }
}

async function main(): Promise<void> {
  const question = process.argv.slice(2).join(" ").trim();
  printResults(await retrieve(question));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
