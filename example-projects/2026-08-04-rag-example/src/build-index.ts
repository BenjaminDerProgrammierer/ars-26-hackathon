import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { OpenRouterEmbeddingProvider } from "./embeddings.js";
import { readJson, requiredEnvironment, writeJson } from "./io.js";
import type { EmbeddingProvider, PreparedDataset, VectorIndex } from "./types.js";

export async function buildVectorIndex(
  dataset: PreparedDataset,
  provider: EmbeddingProvider,
): Promise<VectorIndex> {
  if (dataset.documents.length === 0) throw new Error("No public documents are available to index");
  if (dataset.documents.some((document) => document.publicForHackathon !== true)) {
    throw new Error("Refusing to index a non-public document");
  }
  const vectors = await provider.embed(dataset.documents.map((document) => document.text), "search_document");
  if (vectors.length !== dataset.documents.length) throw new Error("Embedding count does not match document count");
  const vectorDimensions = vectors[0]?.length;
  if (!vectorDimensions || vectors.some((vector) => vector.length !== vectorDimensions)) {
    throw new Error("All index vectors must have the same non-zero dimension");
  }

  return {
    manifest: {
      datasetGeneratedAt: dataset.datasetGeneratedAt,
      datasetSchemaVersion: dataset.datasetSchemaVersion,
      embeddingModel: provider.model,
      vectorDimensions,
      documentBuilderVersion: dataset.documentBuilderVersion,
      documentCount: dataset.documents.length,
    },
    entries: dataset.documents.map((document, index) => ({ document, embedding: vectors[index] ?? [] })),
  };
}

async function main(): Promise<void> {
  const input = resolve(process.argv[2] ?? "data/documents.json");
  const output = resolve(process.argv[3] ?? "data/vector-index.json");
  const model = process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || "mistralai/mistral-embed-2312";
  const provider = new OpenRouterEmbeddingProvider({ apiKey: requiredEnvironment("OPENROUTER_API_KEY"), model });
  const index = await buildVectorIndex(await readJson<PreparedDataset>(input), provider);
  await writeJson(output, index);
  console.log(`Indexed ${index.entries.length} chunks as ${index.manifest.vectorDimensions}-dimension vectors in ${output}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
