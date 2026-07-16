import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  BudgetExceededError,
  ensureBudgetAccount,
  finalizeReservation,
  getBudget,
  listRecentUsage,
  reserveBudget,
  resetBudget,
} from "../src/budget.js";
import { createDatabase, type ProxyDatabase } from "../src/db.js";

let db: ProxyDatabase;

beforeEach(() => {
  db = createDatabase(":memory:");
});

afterEach(() => {
  db.close();
});

describe("budget ledger", () => {
  it("creates an account idempotently without replacing its limit", () => {
    ensureBudgetAccount(db, "user-1", 5_000);
    ensureBudgetAccount(db, "user-1", 9_000);

    expect(getBudget(db, "user-1", 9_000)).toEqual({
      limitNanoUsd: 5_000,
      spentNanoUsd: 0,
      reservedNanoUsd: 0,
      remainingNanoUsd: 5_000,
    });
  });

  it("reserves atomically, reconciles actual cost, and rejects an over-budget request", () => {
    const reservation = reserveBudget(db, {
      userId: "user-1",
      apiKeyId: "key-1",
      model: "test-model",
      amountNanoUsd: 4_000_000_000,
      defaultLimitNanoUsd: 5_000_000_000,
    });
    expect(getBudget(db, "user-1", 5_000_000_000).remainingNanoUsd).toBe(
      1_000_000_000,
    );
    let error: unknown;
    try {
      reserveBudget(db, {
        userId: "user-1",
        apiKeyId: "key-1",
        model: "test-model",
        amountNanoUsd: 1_000_000_001,
        defaultLimitNanoUsd: 5_000_000_000,
      });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(BudgetExceededError);
    expect(error).toMatchObject({
      remainingNanoUsd: 1_000_000_000,
      requestedNanoUsd: 1_000_000_001,
    });

    finalizeReservation(db, reservation, {
      actualNanoUsd: 250_000_000,
      status: "succeeded",
    });
    const budget = getBudget(db, "user-1", 5_000_000_000);
    expect(budget.reservedNanoUsd).toBe(0);
    expect(budget.spentNanoUsd).toBe(250_000_000);
  });

  it("charges the full reservation when actual usage is unavailable", () => {
    const reservation = reserveBudget(db, {
      userId: "user-1",
      apiKeyId: "key-1",
      model: "test-model",
      amountNanoUsd: 800,
      defaultLimitNanoUsd: 1_000,
    });

    finalizeReservation(db, reservation, {
      actualNanoUsd: null,
      status: "estimated",
      errorCode: "usage_missing",
    });

    expect(getBudget(db, "user-1", 1_000)).toMatchObject({
      spentNanoUsd: 800,
      reservedNanoUsd: 0,
      remainingNanoUsd: 200,
    });
    expect(listRecentUsage(db, "user-1")).toEqual([
      expect.objectContaining({
        requestId: reservation.requestId,
        status: "estimated",
        actualNanoUsd: 800,
      }),
    ]);
  });

  it("clamps a negative provider cost and finalizes a reservation only once", () => {
    const reservation = reserveBudget(db, {
      userId: "user-1",
      apiKeyId: "key-1",
      model: "test-model",
      amountNanoUsd: 800,
      defaultLimitNanoUsd: 1_000,
    });

    finalizeReservation(db, reservation, {
      actualNanoUsd: -10,
      status: "succeeded",
    });
    finalizeReservation(db, reservation, {
      actualNanoUsd: 500,
      status: "succeeded",
    });

    expect(getBudget(db, "user-1", 1_000)).toMatchObject({
      spentNanoUsd: 0,
      reservedNanoUsd: 0,
      remainingNanoUsd: 1_000,
    });
  });

  it("resets spent usage while preserving an in-flight reservation", () => {
    const reservation = reserveBudget(db, {
      userId: "user-1",
      apiKeyId: "key-1",
      model: "test-model",
      amountNanoUsd: 400,
      defaultLimitNanoUsd: 1_000,
    });
    finalizeReservation(db, reservation, {
      actualNanoUsd: 300,
      status: "succeeded",
    });
    reserveBudget(db, {
      userId: "user-1",
      apiKeyId: "key-1",
      model: "test-model",
      amountNanoUsd: 200,
      defaultLimitNanoUsd: 1_000,
    });

    expect(resetBudget(db, "missing-user")).toBe(false);
    expect(resetBudget(db, "user-1")).toBe(true);
    expect(getBudget(db, "user-1", 1_000)).toMatchObject({
      spentNanoUsd: 0,
      reservedNanoUsd: 200,
      remainingNanoUsd: 800,
    });
  });
});
