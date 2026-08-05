import assert from "node:assert/strict";
import test from "node:test";
import { buildVectorIndex } from "../src/build-index.js";
import { cosineSimilarity, searchIndex, validateIndex } from "../src/search.js";
import type { PreparedDataset, PreparedDocument, VectorIndex } from "../src/types.js";

function document(projectId: string, chunk: number): PreparedDocument {
  return {
    projectId,
    chunkId: `${projectId}:en:${chunk}`,
    language: "en",
    title: `Project ${projectId}`,
    category: null,
    location: null,
    text: `Text ${chunk}`,
    url: null,
    linkAllowed: false,
    publicForHackathon: true,
  };
}

const first = "a".repeat(32);
const second = "b".repeat(32);
const index: VectorIndex = {
  manifest: {
    datasetGeneratedAt: "now",
    datasetSchemaVersion: "2.1",
    embeddingModel: "test/embed",
    vectorDimensions: 2,
    documentBuilderVersion: 1,
    documentCount: 3,
  },
  entries: [
    { document: document(first, 0), embedding: [0.8, 0.2] },
    { document: document(first, 1), embedding: [1, 0] },
    { document: document(second, 0), embedding: [0, 1] },
  ],
};

test("cosine search ranks and deduplicates projects", () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  const results = searchIndex(index, [1, 0], { minimumScore: 0, limit: 5 });
  assert.equal(results.length, 2);
  assert.equal(results[0]?.document.chunkId, `${first}:en:1`);
  assert.equal(results[1]?.document.projectId, second);
});

test("rejects query dimension and model mismatches", () => {
  assert.throws(() => searchIndex(index, [1]), /index requires 2/);
  assert.throws(() => validateIndex(index, "other/embed"), /Rebuild the index/);
});

test("builds an index with the provider model and actual dimensions", async () => {
  const dataset: PreparedDataset = {
    datasetGeneratedAt: "now",
    datasetSchemaVersion: "2.1",
    documentBuilderVersion: 1,
    documents: [document(first, 0), document(second, 0)],
  };
  const built = await buildVectorIndex(dataset, {
    model: "fake/embed",
    embed: async () => [[1, 2, 3], [4, 5, 6]],
  });
  assert.equal(built.manifest.embeddingModel, "fake/embed");
  assert.equal(built.manifest.vectorDimensions, 3);
  assert.equal(built.manifest.documentCount, 2);
});
