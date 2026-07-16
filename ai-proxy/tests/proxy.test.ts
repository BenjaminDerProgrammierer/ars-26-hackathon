import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiKey } from "../src/api-keys.js";
import { createApp } from "../src/app.js";
import { getBudget } from "../src/budget.js";
import { config } from "../src/config.js";
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
      expect(init?.headers).toMatchObject({
        "http-referer": "https://proxy.example.test",
        "x-openrouter-title": config.openRouterAppName,
      });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Response(
        JSON.stringify({
          id: "gen_test",
          object: "chat.completion",
          choices: [
            {
              message: { role: "assistant", content: "Hello" },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: 8,
            completion_tokens: 2,
            total_tokens: 10,
            cost: 0.000027,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const appConfig = {
      ...config,
      openRouterApiKey: "provider-test-key",
      openRouterSiteUrl: "https://proxy.example.test",
      apiKeyPepper: "test-pepper",
      databasePath: ":memory:",
    };
    const app = createApp({
      database: db,
      appConfig,
      fetchImpl: fetchImpl as typeof fetch,
    });

    const response = await request(app)
      .post("/v1/chat/completions")
      .set("authorization", `Bearer ${contestantKey.secret}`)
      .send({
        model: "hackathon-model",
        messages: [{ role: "user", content: "Hi" }],
      });

    expect(response.status).toBe(200);
    expect(response.body.choices[0].message.content).toBe("Hello");
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(
      getBudget(db, "user-1", config.contestantBudgetNanoUsd).spentNanoUsd,
    ).toBe(27_000);
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
    const fetchImpl = vi.fn(
      async () =>
        new Response(streamBody, {
          status: 200,
          headers: { "content-type": "text/event-stream" },
        }),
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
      .send({
        messages: [{ role: "user", content: "Hi" }],
        stream: true,
        max_tokens: 8,
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain("data: [DONE]");
    expect(
      getBudget(db, "user-stream", config.contestantBudgetNanoUsd).spentNanoUsd,
    ).toBe(15_000);
  });

  it("fails closed when provider usage exceeds the reservation", async () => {
    db = createDatabase(":memory:");
    const contestantKey = createApiKey(db, "user-overrun", "test-pepper");
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: { invalid: true },
            choices: [],
            usage: {
              prompt_tokens: { invalid: true },
              completion_tokens: -1,
              cost: 99,
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
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
      .send({ messages: [{ role: "user", content: "Hi" }], max_tokens: 8 });

    expect(response.status).toBe(200);
    const usage = db
      .prepare(
        `SELECT status, reserved_nano_usd AS reservedNanoUsd,
                actual_nano_usd AS actualNanoUsd,
                prompt_tokens AS promptTokens,
                completion_tokens AS completionTokens,
                provider_generation_id AS providerGenerationId,
                error_code AS errorCode
         FROM usage_event WHERE user_id = ?`,
      )
      .get("user-overrun");
    expect(usage).toEqual({
      status: "estimated",
      reservedNanoUsd: expect.any(Number),
      actualNanoUsd: expect.any(Number),
      promptTokens: null,
      completionTokens: null,
      providerGenerationId: null,
      errorCode: "provider_cost_exceeds_reservation",
    });
    expect((usage as { actualNanoUsd: number }).actualNanoUsd).toBe(
      (usage as { reservedNanoUsd: number }).reservedNanoUsd,
    );
    const budget = getBudget(
      db,
      "user-overrun",
      config.contestantBudgetNanoUsd,
    );
    expect(budget.reservedNanoUsd).toBe(0);
    expect(budget.spentNanoUsd).toBeLessThanOrEqual(
      config.contestantBudgetNanoUsd,
    );
  });

  it("passes through provider errors and retry guidance without charging", async () => {
    db = createDatabase(":memory:");
    const contestantKey = createApiKey(db, "user-throttled", "test-pepper");
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ error: { code: 429, message: "Slow down" } }),
          {
            status: 429,
            headers: {
              "content-type": "application/json",
              "retry-after": "7",
            },
          },
        ),
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
      .send({ messages: [{ role: "user", content: "Hi" }], max_tokens: 8 });

    expect(response.status).toBe(429);
    expect(response.headers["retry-after"]).toBe("7");
    expect(
      getBudget(db, "user-throttled", config.contestantBudgetNanoUsd),
    ).toMatchObject({ spentNanoUsd: 0, reservedNanoUsd: 0 });
  });

  it("times out while waiting for upstream response headers and releases the reservation", async () => {
    db = createDatabase(":memory:");
    const contestantKey = createApiKey(db, "user-headers", "test-pepper");
    let upstreamSignal: AbortSignal | null = null;
    const fetchImpl = vi.fn(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          upstreamSignal = init?.signal ?? null;
          upstreamSignal?.addEventListener(
            "abort",
            () => reject(upstreamSignal?.reason),
            { once: true },
          );
        }),
    );
    const app = createApp({
      database: db,
      appConfig: {
        ...config,
        openRouterApiKey: "provider-test-key",
        apiKeyPepper: "test-pepper",
        databasePath: ":memory:",
        openRouterTimeoutMs: 20,
      },
      fetchImpl: fetchImpl as typeof fetch,
    });

    const response = await request(app)
      .post("/v1/chat/completions")
      .set("authorization", `Bearer ${contestantKey.secret}`)
      .send({ messages: [{ role: "user", content: "Hi" }], max_tokens: 8 });

    expect(response.status).toBe(504);
    expect(response.body.error.code).toBe("upstream_timeout");
    expect((upstreamSignal as AbortSignal | null)?.aborted).toBe(true);
    const budget = getBudget(
      db,
      "user-headers",
      config.contestantBudgetNanoUsd,
    );
    expect(budget.reservedNanoUsd).toBe(0);
    expect(budget.spentNanoUsd).toBeGreaterThan(0);
  });

  it("times out while consuming a non-streaming body", async () => {
    db = createDatabase(":memory:");
    const contestantKey = createApiKey(db, "user-json", "test-pepper");
    const fetchImpl = vi.fn(async (_url, init) => {
      const signal = init?.signal;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          signal?.addEventListener(
            "abort",
            () => controller.error(signal.reason),
            { once: true },
          );
        },
      });
      return new Response(body, {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    const app = createApp({
      database: db,
      appConfig: {
        ...config,
        openRouterApiKey: "provider-test-key",
        apiKeyPepper: "test-pepper",
        databasePath: ":memory:",
        openRouterTimeoutMs: 20,
      },
      fetchImpl: fetchImpl as typeof fetch,
    });

    const response = await request(app)
      .post("/v1/chat/completions")
      .set("authorization", `Bearer ${contestantKey.secret}`)
      .send({ messages: [{ role: "user", content: "Hi" }], max_tokens: 8 });

    expect(response.status).toBe(504);
    expect(response.body.error.code).toBe("upstream_timeout");
    const budget = getBudget(db, "user-json", config.contestantBudgetNanoUsd);
    expect(budget.reservedNanoUsd).toBe(0);
    expect(budget.spentNanoUsd).toBeGreaterThan(0);
  });

  it("times out a stalled SSE body and marks the released reservation estimated", async () => {
    db = createDatabase(":memory:");
    const contestantKey = createApiKey(db, "user-sse-timeout", "test-pepper");
    const fetchImpl = vi.fn(async (_url, init) => {
      const signal = init?.signal;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          signal?.addEventListener(
            "abort",
            () => controller.error(signal.reason),
            { once: true },
          );
        },
      });
      return new Response(body, {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      });
    });
    const app = createApp({
      database: db,
      appConfig: {
        ...config,
        openRouterApiKey: "provider-test-key",
        apiKeyPepper: "test-pepper",
        databasePath: ":memory:",
        openRouterTimeoutMs: 20,
      },
      fetchImpl: fetchImpl as typeof fetch,
    });

    const response = await request(app)
      .post("/v1/chat/completions")
      .set("authorization", `Bearer ${contestantKey.secret}`)
      .send({
        messages: [{ role: "user", content: "Hi" }],
        stream: true,
        max_tokens: 8,
      });

    expect(response.status).toBe(200);
    const budget = getBudget(
      db,
      "user-sse-timeout",
      config.contestantBudgetNanoUsd,
    );
    expect(budget.reservedNanoUsd).toBe(0);
    expect(budget.spentNanoUsd).toBeGreaterThan(0);
    expect(
      db
        .prepare(
          "SELECT status, error_code AS errorCode FROM usage_event WHERE user_id = ?",
        )
        .get("user-sse-timeout"),
    ).toEqual({ status: "estimated", errorCode: "upstream_timeout" });
  });
});
