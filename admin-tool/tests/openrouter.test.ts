import assert from "node:assert/strict";
import test from "node:test";
import { generateRandomApiKeyNames } from "../src/lib/openrouter.js";

test("generates unique short API key names", () => {
  const names = generateRandomApiKeyNames(100);
  assert.equal(names.length, 100);
  assert.equal(new Set(names).size, 100);
  assert.ok(names.every((name) => /^[A-Z2-9]{8}$/.test(name)));
});

test("validates generated API key counts", () => {
  assert.throws(() => generateRandomApiKeyNames(0), /between 1 and 100/);
  assert.throws(() => generateRandomApiKeyNames(101), /between 1 and 100/);
});
