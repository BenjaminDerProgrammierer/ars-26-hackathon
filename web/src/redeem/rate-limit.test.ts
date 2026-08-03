import assert from "node:assert/strict";
import test from "node:test";
import { redeemRateLimit } from "./rate-limit.ts";

test("limits repeated redeem attempts from one client address", () => {
  const address = "192.0.2.10";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    assert.equal(redeemRateLimit(address), null);
  }

  assert.ok((redeemRateLimit(address) ?? 0) > 0);
});

test("keeps different client addresses in separate rate-limit buckets", () => {
  const firstAddress = "192.0.2.20";
  const secondAddress = "192.0.2.21";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    assert.equal(redeemRateLimit(firstAddress), null);
  }

  assert.equal(redeemRateLimit(secondAddress), null);
});

test("rejects a missing client address instead of sharing a fallback bucket", () => {
  assert.throws(
    () => redeemRateLimit("  "),
    /client address is required for redeem rate limiting/,
  );
});
