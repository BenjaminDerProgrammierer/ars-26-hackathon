import assert from "node:assert/strict";
import test from "node:test";
import { answerQuestion, buildRagPrompt, INSUFFICIENT_INFORMATION } from "../src/answer.js";
import type { SearchResult } from "../src/types.js";

function result(): SearchResult {
  return {
    score: 0.8,
    document: {
      projectId: "a".repeat(32),
      chunkId: `${"a".repeat(32)}:en:0`,
      language: "en",
      title: "Public art",
      category: "Exhibition",
      location: "Linz",
      text: "Title: Public art\n\nA project about people and machines.",
      url: "https://example.test/art",
      linkAllowed: true,
      publicForHackathon: true,
    },
  };
}

test("builds a constrained, numbered prompt containing permitted public source text", () => {
  const prompt = buildRagPrompt("What is this about?", [result()]);
  assert.match(prompt, /Answer only from/);
  assert.match(prompt, /\[1\] Project ID:/);
  assert.match(prompt, /A project about people and machines/);
  assert.match(prompt, /Permitted URL: https:\/\/example\.test\/art/);
});

test("refuses non-public prompt sources", () => {
  const privateResult = structuredClone(result()) as unknown as {
    document: { publicForHackathon: boolean };
  };
  privateResult.document.publicForHackathon = false;
  assert.throws(() => buildRagPrompt("question", [privateResult as SearchResult]), /Only public/);
});

test("returns an explicit insufficient-information answer without calling generation", async () => {
  let called = false;
  const answer = await answerQuestion("Unknown?", [], {
    generate: async () => { called = true; return "fabricated"; },
  });
  assert.equal(answer, INSUFFICIENT_INFORMATION);
  assert.equal(called, false);
});

test("passes only the constructed retrieval prompt to generation", async () => {
  let received = "";
  const answer = await answerQuestion("What is this about?", [result()], {
    generate: async (prompt) => { received = prompt; return "It concerns people and machines [1]."; },
  });
  assert.equal(answer, "It concerns people and machines [1].");
  assert.match(received, /Sources:/);
});
