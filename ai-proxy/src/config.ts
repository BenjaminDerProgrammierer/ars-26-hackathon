import "dotenv/config";
import path from "node:path";
import { z } from "zod";

const blankAsUndefined = (value: unknown) => (value === "" ? undefined : value);

const schema = z.object({
  NODE_ENV: z.preprocess(
    blankAsUndefined,
    z.enum(["development", "test", "production"]).default("development"),
  ),
  PORT: z.preprocess(blankAsUndefined, z.coerce.number().int().min(1).max(65535).default(8787)),
  APP_BASE_URL: z.preprocess(blankAsUndefined, z.string().url().default("http://localhost:8787")),
  DATABASE_PATH: z.preprocess(blankAsUndefined, z.string().default("./data/proxy.sqlite")),
  OPENROUTER_API_KEY: z.string().default(""),
  OPENROUTER_MODEL: z.string().default("mistralai/mistral-medium-3-5"),
  BETTER_AUTH_SECRET: z.preprocess(
    blankAsUndefined,
    z.string().min(32).default("development-only-secret-change-me-123456789"),
  ),
  API_KEY_PEPPER: z.preprocess(
    blankAsUndefined,
    z.string().min(16).default("development-only-pepper-change-me"),
  ),
  ADMIN_EMAILS: z.string().default(""),
  CONTESTANT_BUDGET_USD: z.coerce.number().positive().default(20),
  MAX_OUTPUT_TOKENS: z.coerce.number().int().min(1).max(32768).default(4096),
  MODEL_INPUT_USD_PER_MILLION: z.coerce.number().nonnegative().default(1.5),
  MODEL_OUTPUT_USD_PER_MILLION: z.coerce.number().nonnegative().default(7.5),
  OPENROUTER_SITE_URL: z.string().default(""),
  OPENROUTER_APP_NAME: z.string().default("Ars Electronica Festival 2026 Hackathon"),
});

const parsed = schema.parse(process.env);

const toNanoUsd = (usd: number) => Math.round(usd * 1_000_000_000);

export const config = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  baseUrl: parsed.APP_BASE_URL.replace(/\/$/, ""),
  databasePath:
    parsed.DATABASE_PATH === ":memory:"
      ? parsed.DATABASE_PATH
      : path.resolve(process.cwd(), parsed.DATABASE_PATH),
  openRouterApiKey: parsed.OPENROUTER_API_KEY,
  openRouterModel: parsed.OPENROUTER_MODEL,
  authSecret: parsed.BETTER_AUTH_SECRET,
  apiKeyPepper: parsed.API_KEY_PEPPER,
  adminEmails: new Set(
    parsed.ADMIN_EMAILS.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  ),
  contestantBudgetNanoUsd: toNanoUsd(parsed.CONTESTANT_BUDGET_USD),
  maxOutputTokens: parsed.MAX_OUTPUT_TOKENS,
  inputNanoUsdPerToken: Math.ceil(parsed.MODEL_INPUT_USD_PER_MILLION * 1_000),
  outputNanoUsdPerToken: Math.ceil(parsed.MODEL_OUTPUT_USD_PER_MILLION * 1_000),
  openRouterSiteUrl: parsed.OPENROUTER_SITE_URL,
  openRouterAppName: parsed.OPENROUTER_APP_NAME,
};

export type AppConfig = typeof config;

export function assertProductionConfig(): void {
  if (config.nodeEnv !== "production") return;
  if (!config.openRouterApiKey) throw new Error("OPENROUTER_API_KEY is required in production");
  if (config.authSecret.startsWith("development-only")) {
    throw new Error("Set a secure BETTER_AUTH_SECRET in production");
  }
  if (config.apiKeyPepper.startsWith("development-only")) {
    throw new Error("Set a secure API_KEY_PEPPER in production");
  }
}
