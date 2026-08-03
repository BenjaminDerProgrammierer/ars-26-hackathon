import assert from "node:assert/strict";
import test from "node:test";
import { langFromPathname } from "./ui.ts";

test("detects the locale prefix from a requested pathname", () => {
  assert.equal(langFromPathname("/de/does-not-exist/"), "de");
  assert.equal(langFromPathname("/de"), "de");
  assert.equal(langFromPathname("/en/does-not-exist/"), "en");
});

test("uses the default locale for paths without a supported locale prefix", () => {
  assert.equal(langFromPathname("/does-not-exist/"), "en");
  assert.equal(langFromPathname("/deutsch/does-not-exist/"), "en");
  assert.equal(langFromPathname("/"), "en");
});
