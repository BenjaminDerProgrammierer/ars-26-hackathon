import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  authenticateApiKey,
  createApiKey,
  getActiveApiKey,
  hashApiKey,
} from "../src/api-keys.js";
import { createDatabase, type ProxyDatabase } from "../src/db.js";

let db: ProxyDatabase;

beforeEach(() => {
  db = createDatabase(":memory:");
});

afterEach(() => {
  db.close();
});

describe("API keys", () => {
  it("hashes deterministically and includes the server-side pepper", () => {
    expect(hashApiKey("secret", "pepper-a")).toBe(
      hashApiKey("secret", "pepper-a"),
    );
    expect(hashApiKey("secret", "pepper-a")).not.toBe(
      hashApiKey("secret", "pepper-b"),
    );
    expect(hashApiKey("secret", "pepper-a")).not.toContain("secret");
  });

  it("creates a key without storing its plaintext secret", () => {
    const key = createApiKey(db, "user-1", "test-pepper");
    const stored = db.prepare("SELECT * FROM proxy_api_key").get() as Record<
      string,
      unknown
    >;

    expect(key.secret).toMatch(/^ars_[A-Za-z0-9_-]{43}$/);
    expect(key.prefix).toBe(key.secret.slice(0, 12));
    expect(stored.key_prefix).toBe(key.prefix);
    expect(JSON.stringify(stored)).not.toContain(key.secret);
    expect(getActiveApiKey(db, "user-1")).toEqual({
      prefix: key.prefix,
      createdAt: key.createdAt,
      lastUsedAt: null,
    });
  });

  it("authenticates with the correct pepper and records last use", () => {
    const key = createApiKey(db, "user-1", "test-pepper");

    expect(authenticateApiKey(db, key.secret, "wrong-pepper")).toBeNull();
    expect(getActiveApiKey(db, "user-1")?.lastUsedAt).toBeNull();
    expect(authenticateApiKey(db, key.secret, "test-pepper")).toMatchObject({
      userId: "user-1",
      prefix: key.prefix,
    });
    expect(getActiveApiKey(db, "user-1")?.lastUsedAt).toEqual(
      expect.any(String),
    );
  });

  it("revokes a user's previous key when rotating it", () => {
    const first = createApiKey(db, "user-1", "test-pepper");
    const second = createApiKey(db, "user-1", "test-pepper");

    expect(authenticateApiKey(db, first.secret, "test-pepper")).toBeNull();
    expect(authenticateApiKey(db, second.secret, "test-pepper")?.userId).toBe(
      "user-1",
    );
    expect(
      db
        .prepare(
          "SELECT COUNT(*) AS count FROM proxy_api_key WHERE revoked_at IS NULL",
        )
        .get(),
    ).toEqual({ count: 1 });
  });
});
