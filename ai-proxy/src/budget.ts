import { randomUUID } from "node:crypto";
import type { ProxyDatabase } from "./db.js";

interface BudgetRow {
  limit_nano_usd: number;
  spent_nano_usd: number;
  reserved_nano_usd: number;
}

interface EventRow {
  reserved_nano_usd: number;
  status: string;
}

export class BudgetExceededError extends Error {
  constructor(
    public readonly remainingNanoUsd: number,
    public readonly requestedNanoUsd: number,
  ) {
    super("The request could exceed the remaining contestant budget");
    this.name = "BudgetExceededError";
  }
}

export interface Reservation {
  eventId: string;
  requestId: string;
  reservedNanoUsd: number;
}

export interface UsageResult {
  actualNanoUsd: number | null;
  promptTokens?: number;
  completionTokens?: number;
  providerGenerationId?: string;
  errorCode?: string;
  status: "succeeded" | "failed" | "estimated";
}

export function ensureBudgetAccount(
  db: ProxyDatabase,
  userId: string,
  defaultLimitNanoUsd: number,
): void {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR IGNORE INTO budget_account
      (user_id, limit_nano_usd, spent_nano_usd, reserved_nano_usd, created_at, updated_at)
     VALUES (?, ?, 0, 0, ?, ?)`,
  ).run(userId, defaultLimitNanoUsd, now, now);
}

export function getBudget(
  db: ProxyDatabase,
  userId: string,
  defaultLimitNanoUsd: number,
) {
  ensureBudgetAccount(db, userId, defaultLimitNanoUsd);
  const row = db
    .prepare(
      `SELECT limit_nano_usd, spent_nano_usd, reserved_nano_usd
       FROM budget_account WHERE user_id = ?`,
    )
    .get(userId) as BudgetRow;
  return {
    limitNanoUsd: row.limit_nano_usd,
    spentNanoUsd: row.spent_nano_usd,
    reservedNanoUsd: row.reserved_nano_usd,
    remainingNanoUsd: Math.max(
      0,
      row.limit_nano_usd - row.spent_nano_usd - row.reserved_nano_usd,
    ),
  };
}

export function reserveBudget(
  db: ProxyDatabase,
  input: {
    userId: string;
    apiKeyId: string;
    model: string;
    amountNanoUsd: number;
    defaultLimitNanoUsd: number;
  },
): Reservation {
  return db
    .transaction(() => {
      ensureBudgetAccount(db, input.userId, input.defaultLimitNanoUsd);
      const budget = getBudget(db, input.userId, input.defaultLimitNanoUsd);
      if (input.amountNanoUsd > budget.remainingNanoUsd) {
        throw new BudgetExceededError(
          budget.remainingNanoUsd,
          input.amountNanoUsd,
        );
      }

      const now = new Date().toISOString();
      const eventId = randomUUID();
      const requestId = `req_${randomUUID().replaceAll("-", "")}`;
      db.prepare(
        `UPDATE budget_account
       SET reserved_nano_usd = reserved_nano_usd + ?, updated_at = ?
       WHERE user_id = ?`,
      ).run(input.amountNanoUsd, now, input.userId);
      db.prepare(
        `INSERT INTO usage_event
       (id, request_id, user_id, api_key_id, model, status, reserved_nano_usd, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
      ).run(
        eventId,
        requestId,
        input.userId,
        input.apiKeyId,
        input.model,
        input.amountNanoUsd,
        now,
      );

      return { eventId, requestId, reservedNanoUsd: input.amountNanoUsd };
    })
    .immediate();
}

export function finalizeReservation(
  db: ProxyDatabase,
  reservation: Reservation,
  result: UsageResult,
): void {
  db.transaction(() => {
    const event = db
      .prepare("SELECT reserved_nano_usd, status FROM usage_event WHERE id = ?")
      .get(reservation.eventId) as EventRow | undefined;
    if (event?.status !== "pending") return;

    const chargedNanoUsd =
      result.actualNanoUsd === null
        ? event.reserved_nano_usd
        : Math.max(0, result.actualNanoUsd);
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE budget_account
       SET reserved_nano_usd = MAX(0, reserved_nano_usd - ?),
           spent_nano_usd = spent_nano_usd + ?,
           updated_at = ?
       WHERE user_id = (SELECT user_id FROM usage_event WHERE id = ?)`,
    ).run(event.reserved_nano_usd, chargedNanoUsd, now, reservation.eventId);
    db.prepare(
      `UPDATE usage_event
       SET status = ?, actual_nano_usd = ?, prompt_tokens = ?, completion_tokens = ?,
           provider_generation_id = ?, error_code = ?, completed_at = ?
       WHERE id = ?`,
    ).run(
      result.status,
      chargedNanoUsd,
      result.promptTokens ?? null,
      result.completionTokens ?? null,
      result.providerGenerationId ?? null,
      result.errorCode ?? null,
      now,
      reservation.eventId,
    );
  }).immediate();
}

export function resetBudget(db: ProxyDatabase, userId: string): boolean {
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `UPDATE budget_account SET spent_nano_usd = 0, updated_at = ?, last_reset_at = ?
       WHERE user_id = ?`,
    )
    .run(now, now, userId);
  return result.changes > 0;
}

export function listRecentUsage(db: ProxyDatabase, userId: string, limit = 20) {
  return db
    .prepare(
      `SELECT request_id AS requestId, model, status,
              actual_nano_usd AS actualNanoUsd,
              prompt_tokens AS promptTokens, completion_tokens AS completionTokens,
              created_at AS createdAt
       FROM usage_event WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ?`,
    )
    .all(userId, limit);
}
