import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRedeemCode } from "./data.ts";

test("normalizes ASCII redeem-code formatting", () => {
  assert.equal(normalizeRedeemCode("abcd-efgh-2345"), "ABCDEFGH2345");
  assert.equal(normalizeRedeemCode("ABCD EFGH 2345"), "ABCDEFGH2345");
});

test("rejects ambiguous, punctuated, short, and non-ASCII codes", () => {
  for (const code of ["SHORT", "ABCD-EFGH-1010", "ABCD/EFGH/2345", "ßßßßß"]) {
    assert.equal(normalizeRedeemCode(code), null);
  }
});
