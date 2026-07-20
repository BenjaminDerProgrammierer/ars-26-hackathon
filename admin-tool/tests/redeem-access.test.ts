import assert from "node:assert/strict";
import test from "node:test";
import {
  generateRedeemCode,
  normalizeRedeemCode,
  RedeemAccessError,
} from "../src/lib/redeem-access.js";

test("normalizes formatted redeem codes", () => {
  assert.equal(normalizeRedeemCode("abcd-efgh-2345"), "ABCDEFGH2345");
  assert.equal(normalizeRedeemCode("ABCD EFGH 2345"), "ABCDEFGH2345");
});

test("rejects short, ambiguous, and punctuated redeem codes", () => {
  for (const code of ["SHORT", "ABCD-EFGH-1010", "ABCD/EFGH/2345"]) {
    assert.throws(() => normalizeRedeemCode(code), RedeemAccessError);
  }
});

test("generates readable 12-character codes in three groups", () => {
  for (let index = 0; index < 20; index += 1) {
    const code = generateRedeemCode();
    assert.match(code, /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    assert.equal(normalizeRedeemCode(code).length, 12);
  }
});
