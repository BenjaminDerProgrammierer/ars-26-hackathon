import path from "node:path";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import {
  authenticateApiKey,
  createApiKey,
  getActiveApiKey,
} from "./api-keys.js";
import { auth } from "./auth.js";
import {
  BudgetExceededError,
  ensureBudgetAccount,
  getBudget,
  listRecentUsage,
  reserveBudget,
  resetBudget,
} from "./budget.js";
import { type AppConfig, config } from "./config.js";
import type { ProxyDatabase } from "./db.js";
import { forwardOpenRouterRequest } from "./openrouter.js";
import {
  applyRequestPolicy,
  InvalidProxyRequestError,
} from "./request-policy.js";
import { db as defaultDb } from "./runtime.js";

const publicDirectory = path.resolve(process.cwd(), "public");

const usd = (nanoUsd: number) => nanoUsd / 1_000_000_000;

function openAiError(
  response: Response,
  status: number,
  message: string,
  code: string,
) {
  return response.status(status).json({
    error: { message, type: "invalid_request_error", param: null, code },
  });
}

function bearerToken(request: Request): string | null {
  const value = request.header("authorization");
  if (!value?.startsWith("Bearer ")) return null;
  return value.slice(7).trim() || null;
}

async function sessionFor(request: Request) {
  return auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
}

export function createApp(dependencies?: {
  database?: ProxyDatabase;
  appConfig?: AppConfig;
  fetchImpl?: typeof fetch;
}) {
  const database = dependencies?.database ?? defaultDb;
  const appConfig = dependencies?.appConfig ?? config;
  const app = express();

  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'"],
          "style-src": ["'self'"],
        },
      },
    }),
  );

  // Better Auth must receive the untouched request body.
  app.all("/api/auth/*splat", toNodeHandler(auth));
  app.use(express.json({ limit: "2mb" }));

  app.get("/healthz", (_request, response) => {
    response.json({ status: "ok", model: appConfig.openRouterModel });
  });

  app.get("/api/account", async (request, response, next) => {
    try {
      const session = await sessionFor(request);
      if (!session)
        return response.status(401).json({ error: "Not signed in" });
      ensureBudgetAccount(
        database,
        session.user.id,
        appConfig.contestantBudgetNanoUsd,
      );
      const budget = getBudget(
        database,
        session.user.id,
        appConfig.contestantBudgetNanoUsd,
      );
      return response.json({
        user: { name: session.user.name, email: session.user.email },
        isAdmin: appConfig.adminEmails.has(session.user.email.toLowerCase()),
        endpoint: `${appConfig.baseUrl}/v1`,
        model: appConfig.openRouterModel,
        apiKey: getActiveApiKey(database, session.user.id) ?? null,
        budget: {
          limitUsd: usd(budget.limitNanoUsd),
          spentUsd: usd(budget.spentNanoUsd),
          reservedUsd: usd(budget.reservedNanoUsd),
          remainingUsd: usd(budget.remainingNanoUsd),
        },
        recentUsage: listRecentUsage(database, session.user.id),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/account/api-key",
    rateLimit({
      windowMs: 60_000,
      limit: 5,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
    async (request, response, next) => {
      try {
        const session = await sessionFor(request);
        if (!session)
          return response.status(401).json({ error: "Not signed in" });
        ensureBudgetAccount(
          database,
          session.user.id,
          appConfig.contestantBudgetNanoUsd,
        );
        const key = createApiKey(
          database,
          session.user.id,
          appConfig.apiKeyPepper,
        );
        return response.status(201).json({
          apiKey: key.secret,
          prefix: key.prefix,
          createdAt: key.createdAt,
          warning: "Copy this key now. It cannot be shown again.",
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get("/api/admin/accounts", async (request, response, next) => {
    try {
      const session = await sessionFor(request);
      if (!session)
        return response.status(401).json({ error: "Not signed in" });
      if (!appConfig.adminEmails.has(session.user.email.toLowerCase())) {
        return response.status(403).json({ error: "Admin access required" });
      }
      const rows = database
        .prepare(
          `SELECT u.id, u.name, u.email,
                  COALESCE(b.limit_nano_usd, ?) AS limitNanoUsd,
                  COALESCE(b.spent_nano_usd, 0) AS spentNanoUsd,
                  COALESCE(b.reserved_nano_usd, 0) AS reservedNanoUsd,
                  b.last_reset_at AS lastResetAt
           FROM "user" u LEFT JOIN budget_account b ON b.user_id = u.id
           ORDER BY u.createdAt DESC`,
        )
        .all(appConfig.contestantBudgetNanoUsd) as Array<
        Record<string, unknown>
      >;
      return response.json(
        rows.map((row) => ({
          ...row,
          limitUsd: usd(row.limitNanoUsd as number),
          spentUsd: usd(row.spentNanoUsd as number),
          reservedUsd: usd(row.reservedNanoUsd as number),
          limitNanoUsd: undefined,
          spentNanoUsd: undefined,
          reservedNanoUsd: undefined,
        })),
      );
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/admin/accounts/:userId/reset",
    async (request, response, next) => {
      try {
        const session = await sessionFor(request);
        if (!session)
          return response.status(401).json({ error: "Not signed in" });
        if (!appConfig.adminEmails.has(session.user.email.toLowerCase())) {
          return response.status(403).json({ error: "Admin access required" });
        }
        ensureBudgetAccount(
          database,
          request.params.userId,
          appConfig.contestantBudgetNanoUsd,
        );
        resetBudget(database, request.params.userId);
        return response.json({ ok: true });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get("/v1/models", (request, response) => {
    const token = bearerToken(request);
    if (
      !token ||
      !authenticateApiKey(database, token, appConfig.apiKeyPepper)
    ) {
      return openAiError(response, 401, "Invalid API key", "invalid_api_key");
    }
    return response.json({
      object: "list",
      data: [
        {
          id: appConfig.openRouterModel,
          object: "model",
          created: 1_777_507_200,
          owned_by: "mistralai",
        },
      ],
    });
  });

  app.post("/v1/chat/completions", async (request, response, next) => {
    const token = bearerToken(request);
    const apiKey = token
      ? authenticateApiKey(database, token, appConfig.apiKeyPepper)
      : null;
    if (!apiKey)
      return openAiError(response, 401, "Invalid API key", "invalid_api_key");
    if (!appConfig.openRouterApiKey) {
      return openAiError(
        response,
        503,
        "The provider key has not been configured",
        "proxy_not_configured",
      );
    }

    try {
      const policy = applyRequestPolicy(request.body, {
        model: appConfig.openRouterModel,
        maxOutputTokens: appConfig.maxOutputTokens,
        inputNanoUsdPerToken: appConfig.inputNanoUsdPerToken,
        outputNanoUsdPerToken: appConfig.outputNanoUsdPerToken,
      });
      const reservation = reserveBudget(database, {
        userId: apiKey.userId,
        apiKeyId: apiKey.id,
        model: appConfig.openRouterModel,
        amountNanoUsd: policy.reservationNanoUsd,
        defaultLimitNanoUsd: appConfig.contestantBudgetNanoUsd,
      });
      response.setHeader("x-request-id", reservation.requestId);
      response.setHeader(
        "x-ratelimit-limit-usd",
        usd(appConfig.contestantBudgetNanoUsd).toFixed(2),
      );
      await forwardOpenRouterRequest({
        db: database,
        reservation,
        response,
        upstreamBody: policy.upstreamBody,
        apiKey: appConfig.openRouterApiKey,
        siteUrl: appConfig.openRouterSiteUrl,
        appName: appConfig.openRouterAppName,
        timeoutMs: appConfig.openRouterTimeoutMs,
        fetchImpl: dependencies?.fetchImpl,
      });
    } catch (error) {
      if (error instanceof BudgetExceededError) {
        response.setHeader(
          "x-ratelimit-remaining-usd",
          usd(error.remainingNanoUsd).toFixed(9),
        );
        return openAiError(
          response,
          402,
          "This request could exceed your remaining $20 hackathon budget. Reduce max_tokens or use a shorter prompt.",
          "insufficient_quota",
        );
      }
      if (error instanceof InvalidProxyRequestError) {
        return openAiError(response, 400, error.message, "invalid_request");
      }
      next(error);
    }
  });

  app.use(express.static(publicDirectory));

  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      _next: NextFunction,
    ) => {
      console.error(error);
      if (response.headersSent) return;
      response.status(500).json({ error: "Internal server error" });
    },
  );

  return app;
}
