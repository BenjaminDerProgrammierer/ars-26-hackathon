import assert from "node:assert/strict";
import test from "node:test";
import type { TableEntity, TableEntityResult } from "@azure/data-tables";
import {
  type RateLimitStore,
  redeemClientAddress,
  redeemRateLimit,
} from "./rate-limit.ts";

type Entry = {
  count: number;
  resetAt: Date | string;
};

function memoryStore(): RateLimitStore {
  const entries = new Map<string, TableEntityResult<Entry>>();
  let version = 0;
  return {
    async get(rowKey) {
      return entries.get(rowKey) ?? null;
    },
    async create(entity) {
      if (entries.has(entity.rowKey)) {
        throw Object.assign(new Error("Conflict"), { statusCode: 409 });
      }
      version += 1;
      entries.set(entity.rowKey, { ...entity, etag: String(version) });
    },
    async update(entity: TableEntity<Entry>, etag) {
      if (entries.get(entity.rowKey)?.etag !== etag) return false;
      version += 1;
      entries.set(entity.rowKey, { ...entity, etag: String(version) });
      return true;
    },
  };
}

test("limits repeated redeem attempts from one client address", async () => {
  const store = memoryStore();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    assert.equal(await redeemRateLimit("192.0.2.10", store, 1_000), null);
  }
  assert.equal(await redeemRateLimit("192.0.2.10", store, 1_000), 60);
});

test("keeps different client addresses in separate buckets", async () => {
  const store = memoryStore();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await redeemRateLimit("192.0.2.20", store, 1_000);
  }
  assert.equal(await redeemRateLimit("192.0.2.21", store, 1_000), null);
});

test("starts a new window after the previous window expires", async () => {
  const store = memoryStore();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await redeemRateLimit("192.0.2.30", store, 1_000);
  }
  assert.equal(await redeemRateLimit("192.0.2.30", store, 61_001), null);
});

test("uses the App Service-appended forwarding entry in production", () => {
  const previous = process.env.WEBSITE_INSTANCE_ID;
  process.env.WEBSITE_INSTANCE_ID = "instance";
  try {
    const request = new Request("https://example.test", {
      headers: { "x-forwarded-for": "198.51.100.1, 192.0.2.44" },
    });
    assert.equal(redeemClientAddress(request, "127.0.0.1"), "192.0.2.44");
  } finally {
    if (previous === undefined) delete process.env.WEBSITE_INSTANCE_ID;
    else process.env.WEBSITE_INSTANCE_ID = previous;
  }
});

test("rejects a missing local client address", () => {
  assert.throws(
    () => redeemClientAddress(new Request("https://example.test"), "  "),
    /client address is required for redeem rate limiting/,
  );
});
