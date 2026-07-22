import assert from "node:assert/strict";
import test from "node:test";
import { DefaultAzureCredential } from "@azure/identity";
import {
  generateRedeemCode,
  getRedeemAccessContext,
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

test("uses configured metadata when Resource Manager discovery fails", async (context) => {
  const names = [
    "AZURE_STORAGE_ACCOUNT_NAME",
    "AZURE_STORAGE_TABLE_NAME",
    "AZURE_SUBSCRIPTION_ID",
    "AZURE_SUBSCRIPTION_NAME",
    "AZURE_TENANT_ID",
    "AZURE_RESOURCE_GROUP",
  ] as const;
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  context.after(() => {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  process.env.AZURE_STORAGE_ACCOUNT_NAME = "testaccount";
  process.env.AZURE_STORAGE_TABLE_NAME = "TestCodes";
  process.env.AZURE_SUBSCRIPTION_ID = "";
  process.env.AZURE_SUBSCRIPTION_NAME = "";
  process.env.AZURE_TENANT_ID = "";
  process.env.AZURE_RESOURCE_GROUP = "TestGroup";
  context.mock.method(DefaultAzureCredential.prototype, "getToken", async () => {
    throw new Error("ARM access denied");
  });

  assert.deepEqual(await getRedeemAccessContext(), {
    accountName: "testaccount",
    tableName: "TestCodes",
    subscriptionName: null,
    resourceGroup: "TestGroup",
  });
});
