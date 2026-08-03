import assert from "node:assert/strict";
import test from "node:test";
import { rewriteDatasetLinks } from "./dataset-links.mjs";

const datasetBase = "/en/datasets/";
const datasetSlugs = new Set(["efa-fahrplanauskunft", "linz-ag-linien-2025"]);

test("rewrites dataset links as localized routes", () => {
  assert.equal(
    rewriteDatasetLinks(
      '<a href="linz-ag-linien-2025">Lines</a>',
      datasetBase,
      datasetSlugs,
    ),
    '<a href="/en/datasets/linz-ag-linien-2025/">Lines</a>',
  );
});

test("rewrites links to documentation beneath the current dataset", () => {
  assert.equal(
    rewriteDatasetLinks(
      '<a href="efa-fahrplanauskunft/api">API</a>',
      datasetBase,
      datasetSlugs,
    ),
    '<a href="/en/datasets/efa-fahrplanauskunft/api/">API</a>',
  );
});

test("leaves external and fragment links unchanged", () => {
  for (const html of [
    '<a href="https://example.com/docs">Docs</a>',
    '<a href="#parameters">Parameters</a>',
  ]) {
    assert.equal(rewriteDatasetLinks(html, datasetBase, datasetSlugs), html);
  }
});

test("preserves queries and fragments while normalizing slug case", () => {
  assert.equal(
    rewriteDatasetLinks(
      '<a href="LINZ-AG-LINIEN-2025?format=csv#fields">Lines</a>',
      datasetBase,
      datasetSlugs,
    ),
    '<a href="/en/datasets/linz-ag-linien-2025/?format=csv#fields">Lines</a>',
  );
});

test("rejects dot-segment and backslash escapes", () => {
  for (const link of [
    "efa-fahrplanauskunft/../private",
    "efa-fahrplanauskunft/%2e%2e/private",
    "efa-fahrplanauskunft\\private",
  ]) {
    const html = `<a href="${link}">Private</a>`;
    assert.equal(rewriteDatasetLinks(html, datasetBase, datasetSlugs), html);
  }
});
