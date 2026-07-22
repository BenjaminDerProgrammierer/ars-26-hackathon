import assert from "node:assert/strict";
import test from "node:test";
import {
  type AdminOperationEntity,
  type AdminOperationStorage,
  type OperationLease,
  setAdminOperationStorageForTests,
} from "../src/lib/admin-operation-storage.js";
import {
  type BulkOperation,
  BulkOperationConflictError,
  getBulkOperation,
  hasActiveBulkOperations,
  listBulkOperations,
  startBulkOperation,
} from "../src/lib/bulk-operations.js";

class MemoryOperationStorage implements AdminOperationStorage {
  readonly entities = new Map<string, AdminOperationEntity>();
  private readonly leases = new Set<string>();

  async create(entity: AdminOperationEntity): Promise<void> {
    const key = `${entity.partitionKey}/${entity.rowKey}`;
    if (this.entities.has(key)) throw new Error("entity already exists");
    this.entities.set(key, structuredClone(entity));
  }

  async replace(entity: AdminOperationEntity): Promise<void> {
    this.entities.set(`${entity.partitionKey}/${entity.rowKey}`, structuredClone(entity));
  }

  async get(partitionKey: string, rowKey: string): Promise<AdminOperationEntity | undefined> {
    const entity = this.entities.get(`${partitionKey}/${rowKey}`);
    return entity ? structuredClone(entity) : undefined;
  }

  async list(partitionKey: string): Promise<AdminOperationEntity[]> {
    return [...this.entities.values()]
      .filter((entity) => entity.partitionKey === partitionKey)
      .map((entity) => structuredClone(entity));
  }

  async delete(partitionKey: string, rowKey: string): Promise<void> {
    this.entities.delete(`${partitionKey}/${rowKey}`);
  }

  async acquireLease(name: string): Promise<OperationLease | null> {
    if (this.leases.has(name)) return null;
    this.leases.add(name);
    let active = true;
    return {
      assertActive() {
        if (!active) throw new Error("lease lost");
      },
      release: async () => {
        active = false;
        this.leases.delete(name);
      },
    };
  }
}

let storage: MemoryOperationStorage;

async function waitForTerminal(id: string): Promise<BulkOperation> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const operation = await getBulkOperation(id);
    assert.ok(operation, "operation should still be retained");
    if (operation.status !== "queued" && operation.status !== "running") {
      return operation;
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
  }

  throw new Error("operation did not finish");
}

test.beforeEach(async () => {
  storage = new MemoryOperationStorage();
  setAdminOperationStorageForTests(storage);
  assert.equal(await hasActiveBulkOperations(), false);
});

test.after(() => setAdminOperationStorageForTests());

test("tracks a completed operation and only reveals its result by id", async () => {
  const operation = await startBulkOperation({
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
  assert.equal(await hasActiveBulkOperations(), true);

  const completed = await waitForTerminal(operation.id);
  assert.equal(completed.status, "completed");
  assert.equal(completed.processed, 2);
  assert.equal(completed.succeeded, 2);
  assert.deepEqual(completed.result, { updated: 2 });

  const listed = (await listBulkOperations()).find(({ id }) => id === operation.id);
  assert.ok(listed);
  assert.equal(listed.hasResult, true);
  assert.equal(listed.result, undefined);
  assert.equal(await hasActiveBulkOperations(), false);
});

test("marks mixed item outcomes as partial", async () => {
  const operation = await startBulkOperation({
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
  const originalConsoleError = console.error;
  const logged: unknown[][] = [];
  console.error = (...values: unknown[]) => logged.push(values);

  try {
    const operation = await startBulkOperation({
      kind: "create",
      label: "Creating a key",
      total: 1,
      run: async () => {
        throw new Error("key creation failed");
      },
    });

    const completed = await waitForTerminal(operation.id);
    assert.equal(completed.status, "failed");
    assert.equal(completed.error, "key creation failed");
    assert.equal(completed.hasResult, false);
    assert.equal(logged.length, 1);
    assert.equal(logged[0]?.[0], `Bulk operation "Creating a key" (${operation.id}) failed:`);
    assert.match(String(logged[0]?.[1]), /key creation failed/);
  } finally {
    console.error = originalConsoleError;
  }
});

test("uses a distributed lease to reject concurrent key operations", async () => {
  let finish: (() => void) | undefined;
  const running = await startBulkOperation({
    kind: "update",
    label: "Holding the lease",
    total: 1,
    run: () => new Promise<void>((resolve) => (finish = resolve)),
  });

  await assert.rejects(
    startBulkOperation({
      kind: "delete",
      label: "Conflicting operation",
      total: 1,
      run: async () => undefined,
    }),
    BulkOperationConflictError,
  );

  finish?.();
  await waitForTerminal(running.id);
});

test("marks a persisted running operation as failed after its lease expires", async () => {
  const operationId = "00000000-0000-4000-8000-000000000001";
  await storage.create({
    partitionKey: "API_KEY",
    rowKey: operationId,
    kind: "update",
    label: "Interrupted operation",
    status: "running",
    total: 2,
    processed: 1,
    succeeded: 1,
    failedCount: 0,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    finishedAt: "",
    error: "",
    resultJson: "",
    failedJson: "",
    createdNamesJson: "",
    detail: "",
  });

  const operation = await getBulkOperation(operationId);
  assert.equal(operation?.status, "failed");
  assert.match(operation?.error ?? "", /server stopped/);
});
