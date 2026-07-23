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
