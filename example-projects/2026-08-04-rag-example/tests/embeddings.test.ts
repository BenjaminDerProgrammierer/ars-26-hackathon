import assert from "node:assert/strict";
import test from "node:test";
import { OpenRouterEmbeddingProvider, validateEmbeddingResponse } from "../src/embeddings.js";

test("sorts indexed embedding responses and validates dimensions", () => {
  assert.deepEqual(
    validateEmbeddingResponse(
      { data: [{ index: 1, embedding: [0, 1] }, { index: 0, embedding: [1, 0] }] },
      2,
    ),
    [[1, 0], [0, 1]],
  );
  assert.throws(
    () => validateEmbeddingResponse({ data: [{ embedding: [1] }, { embedding: [1, 2] }] }, 2),
    /inconsistent dimensions/,
  );
});

test("batches requests and retries transient OpenRouter errors", async () => {
  let calls = 0;
  const waits: number[] = [];
  const provider = new OpenRouterEmbeddingProvider({
    model: "test/embed",
    batchSize: 2,
    retries: 1,
    request: async (texts) => {
      calls += 1;
      if (calls === 1) throw Object.assign(new Error("rate limited"), { statusCode: 429 });
      return { data: texts.map((_, index) => ({ embedding: [index + 1, 0] })) };
    },
    wait: async (milliseconds) => { waits.push(milliseconds); },
  });
  const vectors = await provider.embed(["one", "two", "three"]);
  assert.equal(calls, 3);
  assert.deepEqual(waits, [250]);
  assert.deepEqual(vectors, [[1, 0], [2, 0], [1, 0]]);
});
