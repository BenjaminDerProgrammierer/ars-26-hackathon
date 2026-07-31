import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseHashes } from "../src/routes/api.js";

const adminRoot = new URL("../", import.meta.url);

test("canonicalizes hashes before deduplicating bulk requests", () => {
  const upper = `${"ABCDEF".repeat(10)}ABCD`;
  assert.equal(upper.length, 64);
  assert.deepEqual(parseHashes([upper, upper.toLowerCase()]), [upper.toLowerCase()]);
});

test("production start runs compiled JavaScript without development-only tsx", async () => {
  const packageJson = JSON.parse(await readFile(new URL("package.json", adminRoot), "utf8"));
  assert.equal(packageJson.scripts.start, "node dist/index.js");
});

test("required student setup commands fail the bootstrap", async () => {
  const bootstrap = await readFile(new URL("cloud-init/bootstrap.sh", adminRoot), "utf8");
  const studentSections = [...bootstrap.matchAll(/sudo -u .*?<<'USEREOF'\n([\s\S]*?)\nUSEREOF/g)];
  assert.equal(studentSections.length, 2);
  for (const section of studentSections) assert.match(section[1] ?? "", /^set -euo pipefail/m);
});

test("the admin UI retries polling and reports clipboard failures", async () => {
  const script = await readFile(new URL("public/app.js", adminRoot), "utf8");
  assert.match(script, /Temporary Azure status error; retrying/);
  assert.match(script, /catch \{\n\s+showToast\("Could not copy to the clipboard/);
  assert.equal((script.match(/navigator\.clipboard\.writeText/g) ?? []).length, 1);
});

test("selection changes update rows without replacing the key table", async () => {
  const script = await readFile(new URL("public/app.js", adminRoot), "utf8");
  const handler = script.match(
    /\$\("#keys-body"\)\.addEventListener\("change",[\s\S]*?\n\}\);/,
  )?.[0];
  assert.ok(handler);
  assert.doesNotMatch(handler, /renderKeys\(/);
  assert.match(handler, /renderSelection\(/);
});

test("the bulk apply checkboxes have accessible names", async () => {
  const markup = await readFile(new URL("public/index.html", adminRoot), "utf8");
  assert.match(markup, /id="change-limit"[^>]*aria-label="Apply spending limit change"/);
  assert.match(markup, /id="redeem-change-expires"[^>]*aria-label="Apply expiration change"/);
});

test("unversioned assets revalidate and server errors retain the Error object", async () => {
  const source = await readFile(new URL("src/index.ts", adminRoot), "utf8");
  assert.doesNotMatch(source, /immutable/);
  assert.match(source, /must-revalidate/);
  assert.match(source, /console\.error\(`\[\$\{statusCode\}\] Request failed`, error\)/);
});
