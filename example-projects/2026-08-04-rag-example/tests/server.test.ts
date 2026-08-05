import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createRagServer } from "../src/server.js";

async function withServer(run: (baseUrl: string) => Promise<void>): Promise<void> {
  const server = createRagServer(async (question) => ({
    answer: `Answer for ${question} [1].`,
    sources: [{
      number: 1,
      title: "Public project",
      category: "Exhibition",
      location: "Linz",
      language: "en",
      score: 0.82,
      url: "https://example.test/project",
    }],
  }));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("serves the festival search interface", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(baseUrl);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/);
    assert.match(await response.text(), /Ask the festival/);
  });
});

test("answers API questions with public source metadata", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "What is public?" }),
    });
    assert.equal(response.status, 200);
    const body = await response.json() as { answer: string; sources: Array<{ title: string }> };
    assert.equal(body.answer, "Answer for What is public? [1].");
    assert.equal(body.sources[0]?.title, "Public project");
  });
});

test("rejects empty questions and unsupported API methods", async () => {
  await withServer(async (baseUrl) => {
    const empty = await fetch(`${baseUrl}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "  " }),
    });
    assert.equal(empty.status, 400);
    const get = await fetch(`${baseUrl}/api/ask`);
    assert.equal(get.status, 405);
  });
});
