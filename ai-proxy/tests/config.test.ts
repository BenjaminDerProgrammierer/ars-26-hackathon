import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("configuration", () => {
  it("normalizes URLs and admin emails and converts prices to nano-dollars", async () => {
    vi.stubEnv("APP_BASE_URL", "https://proxy.example.test/");
    vi.stubEnv("ADMIN_EMAILS", " Admin@Example.test, user@example.test ,");
    vi.stubEnv("CONTESTANT_BUDGET_USD", "12.34");
    vi.stubEnv("MODEL_INPUT_USD_PER_MILLION", "1.25");
    vi.stubEnv("MODEL_OUTPUT_USD_PER_MILLION", "7.75");
    vi.stubEnv("OPENROUTER_TIMEOUT_MS", "45000");

    const { config } = await import("../src/config.js");

    expect(config.baseUrl).toBe("https://proxy.example.test");
    expect(config.adminEmails).toEqual(
      new Set(["admin@example.test", "user@example.test"]),
    );
    expect(config.contestantBudgetNanoUsd).toBe(12_340_000_000);
    expect(config.inputNanoUsdPerToken).toBe(1_250);
    expect(config.outputNanoUsdPerToken).toBe(7_750);
    expect(config.openRouterTimeoutMs).toBe(45_000);
  });

  it("rejects unsafe production defaults", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPENROUTER_API_KEY", "");

    const { assertProductionConfig } = await import("../src/config.js");

    expect(() => assertProductionConfig()).toThrow(
      "OPENROUTER_API_KEY is required",
    );
  });

  it("accepts a complete production configuration", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPENROUTER_API_KEY", "provider-key");
    vi.stubEnv(
      "BETTER_AUTH_SECRET",
      "a-secure-production-secret-with-32-chars",
    );
    vi.stubEnv("API_KEY_PEPPER", "a-secure-production-pepper");

    const { assertProductionConfig } = await import("../src/config.js");

    expect(() => assertProductionConfig()).not.toThrow();
  });
});
