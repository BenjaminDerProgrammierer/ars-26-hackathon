import assert from "node:assert/strict";
import test from "node:test";
import {
  type BulkOperation,
  clearCompletedBulkOperations,
  getBulkOperation,
  hasActiveBulkOperations,
  listBulkOperations,
  startBulkOperation,
} from "../src/lib/bulk-operations.js";

async function waitForTerminal(id: string): Promise<BulkOperation> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const operation = getBulkOperation(id);
    assert.ok(operation, "operation should still be retained");
    if (operation.status !== "queued" && operation.status !== "running") {
      return operation;
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
  }

  throw new Error("operation did not finish");
}

test.beforeEach(() => {
  assert.equal(hasActiveBulkOperations(), false);
  clearCompletedBulkOperations();
});

test("tracks a completed operation and only reveals its result by id", async () => {
  const operation = startBulkOperation({
    kind: "update",
    label: "Updating 2 keys",
    total: 2,
    run: async (reportProgress) => {
      reportProgress(true);
      reportProgress(true);
      return { updated: 2 };
    },
  });

  assert.equal(operation.status, "queued");
  assert.equal(hasActiveBulkOperations(), true);

  const completed = await waitForTerminal(operation.id);
  assert.equal(completed.status, "completed");
  assert.equal(completed.processed, 2);
  assert.equal(completed.succeeded, 2);
  assert.deepEqual(completed.result, { updated: 2 });

  const listed = listBulkOperations().find(({ id }) => id === operation.id);
  assert.ok(listed);
  assert.equal(listed.hasResult, true);
  assert.equal(listed.result, undefined);
  assert.equal(hasActiveBulkOperations(), false);
});

test("marks mixed item outcomes as partial", async () => {
  const operation = startBulkOperation({
    kind: "delete",
    label: "Deleting 2 keys",
    total: 2,
    run: async (reportProgress) => {
      reportProgress(true);
      reportProgress(false);
    },
  });

  const completed = await waitForTerminal(operation.id);
  assert.equal(completed.status, "partial");
  assert.equal(completed.processed, 2);
  assert.equal(completed.succeeded, 1);
  assert.equal(completed.failed, 1);
});

test("records an operation-level failure", async () => {
  const operation = startBulkOperation({
    kind: "create",
    label: "Creating a key",
    total: 1,
    run: async () => {
      throw new Error("guardrail assignment failed");
    },
  });

  const completed = await waitForTerminal(operation.id);
  assert.equal(completed.status, "failed");
  assert.equal(completed.error, "guardrail assignment failed");
  assert.equal(completed.hasResult, false);
});
