import { afterEach, describe, expect, it } from "vitest";
import { createApiKey, authenticateApiKey } from "../src/api-keys.js";
import {
  BudgetExceededError,
  finalizeReservation,
  getBudget,
  reserveBudget,
} from "../src/budget.js";
import { createDatabase, type ProxyDatabase } from "../src/db.js";

let db: ProxyDatabase;
afterEach(() => db?.close());

describe("API keys and budget ledger", () => {
  it("stores only a hash and revokes the previous key on rotation", () => {
    db = createDatabase(":memory:");
    const first = createApiKey(db, "user-1", "test-pepper");
    expect(authenticateApiKey(db, first.secret, "test-pepper")?.userId).toBe("user-1");
    expect(JSON.stringify(db.prepare("SELECT * FROM proxy_api_key").all())).not.toContain(first.secret);

    const second = createApiKey(db, "user-1", "test-pepper");
    expect(authenticateApiKey(db, first.secret, "test-pepper")).toBeNull();
    expect(authenticateApiKey(db, second.secret, "test-pepper")?.userId).toBe("user-1");
  });

  it("reserves atomically, reconciles actual cost, and rejects an over-budget request", () => {
    db = createDatabase(":memory:");
    const reservation = reserveBudget(db, {
      userId: "user-1",
      apiKeyId: "key-1",
      model: "test-model",
      amountNanoUsd: 4_000_000_000,
      defaultLimitNanoUsd: 5_000_000_000,
    });
    expect(getBudget(db, "user-1", 5_000_000_000).remainingNanoUsd).toBe(1_000_000_000);
    expect(() =>
      reserveBudget(db, {
        userId: "user-1",
        apiKeyId: "key-1",
        model: "test-model",
        amountNanoUsd: 1_000_000_001,
        defaultLimitNanoUsd: 5_000_000_000,
      }),
    ).toThrow(BudgetExceededError);

    finalizeReservation(db, reservation, { actualNanoUsd: 250_000_000, status: "succeeded" });
    const budget = getBudget(db, "user-1", 5_000_000_000);
    expect(budget.reservedNanoUsd).toBe(0);
    expect(budget.spentNanoUsd).toBe(250_000_000);
  });
});
