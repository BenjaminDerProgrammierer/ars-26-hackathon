import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiKey } from "../src/api-keys.js";
import { createApp } from "../src/app.js";
import { config } from "../src/config.js";
import { getBudget } from "../src/budget.js";
import { createDatabase, type ProxyDatabase } from "../src/db.js";

let db: ProxyDatabase;
afterEach(() => db?.close());

describe("OpenAI-compatible proxy", () => {
  it("authenticates a contestant key, forwards the fixed model, and records provider cost", async () => {
    db = createDatabase(":memory:");
    const contestantKey = createApiKey(db, "user-1", "test-pepper");
    const fetchImpl = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe("mistralai/mistral-medium-3-5");
      return new Response(
        JSON.stringify({
          id: "gen_test",
          object: "chat.completion",
          choices: [{ message: { role: "assistant", content: "Hello" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 8, completion_tokens: 2, total_tokens: 10, cost: 0.000027 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const appConfig = {
      ...config,
      openRouterApiKey: "provider-test-key",
      apiKeyPepper: "test-pepper",
      databasePath: ":memory:",
    };
    const app = createApp({ database: db, appConfig, fetchImpl: fetchImpl as typeof fetch });

    const response = await request(app)
      .post("/v1/chat/completions")
      .set("authorization", `Bearer ${contestantKey.secret}`)
      .send({ model: "hackathon-model", messages: [{ role: "user", content: "Hi" }] });

    expect(response.status).toBe(200);
    expect(response.body.choices[0].message.content).toBe("Hello");
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(getBudget(db, "user-1", config.contestantBudgetNanoUsd).spentNanoUsd).toBe(27_000);
  });

  it("returns an OpenAI-style authentication error", async () => {
    db = createDatabase(":memory:");
    const app = createApp({ database: db });
    const response = await request(app)
      .post("/v1/chat/completions")
      .set("authorization", "Bearer wrong")
      .send({ messages: [{ role: "user", content: "Hi" }] });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("invalid_api_key");
  });

  it("passes through SSE and reconciles usage from the final streaming chunk", async () => {
    db = createDatabase(":memory:");
    const contestantKey = createApiKey(db, "user-stream", "test-pepper");
    const streamBody = [
      'data: {"id":"gen_stream","choices":[{"delta":{"content":"Hi"}}]}\n\n',
      'data: {"id":"gen_stream","choices":[],"usage":{"prompt_tokens":5,"completion_tokens":1,"cost":0.000015}}\n\n',
      "data: [DONE]\n\n",
    ].join("");
    const fetchImpl = vi.fn(async () =>
      new Response(streamBody, { status: 200, headers: { "content-type": "text/event-stream" } }),
    );
    const app = createApp({
      database: db,
      appConfig: {
        ...config,
        openRouterApiKey: "provider-test-key",
        apiKeyPepper: "test-pepper",
        databasePath: ":memory:",
      },
      fetchImpl: fetchImpl as typeof fetch,
    });

    const response = await request(app)
      .post("/v1/chat/completions")
      .set("authorization", `Bearer ${contestantKey.secret}`)
      .send({ messages: [{ role: "user", content: "Hi" }], stream: true, max_tokens: 8 });

    expect(response.status).toBe(200);
    expect(response.text).toContain("data: [DONE]");
    expect(getBudget(db, "user-stream", config.contestantBudgetNanoUsd).spentNanoUsd).toBe(15_000);
  });
});
