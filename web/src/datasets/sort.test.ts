import assert from "node:assert/strict";
import test from "node:test";
import { compareDatasets, type DatasetStatus } from "./sort.ts";

function dataset(title: string, status: DatasetStatus, priority = 0) {
  return { data: { title, status, priority } };
}

test("sorts datasets by status, descending priority, then title", () => {
  const datasets = [
    dataset("Zebra", "recommended", 10),
    dataset("Apfel", "essential"),
    dataset("Birne", "recommended"),
    dataset("Ähre", "recommended"),
    dataset("Alpha", "optional", 100),
    dataset("Zitrone", "optional"),
  ];

  assert.deepEqual(datasets.sort(compareDatasets), [
    dataset("Apfel", "essential"),
    dataset("Zebra", "recommended", 10),
    dataset("Ähre", "recommended"),
    dataset("Birne", "recommended"),
    dataset("Alpha", "optional", 100),
    dataset("Zitrone", "optional"),
  ]);
});
