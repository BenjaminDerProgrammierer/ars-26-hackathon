import { randomUUID } from "node:crypto";
import {
  type AdminOperationEntity,
  getAdminOperationStorage,
  type OperationLease,
} from "./admin-operation-storage.js";

export type BulkOperationKind = "create" | "update" | "enable" | "disable" | "delete";
export type BulkOperationStatus = "queued" | "running" | "completed" | "partial" | "failed";

type BulkOperationRecord = {
  id: string;
  kind: BulkOperationKind;
  label: string;
  status: BulkOperationStatus;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  result?: unknown;
};

export type BulkOperation = Omit<BulkOperationRecord, "result"> & {
  hasResult: boolean;
  result?: unknown;
};

type ProgressReporter = (succeeded: boolean) => void;

const PARTITION_KEY = "API_KEY";
const LEASE_NAME = "api-keys";
const retentionMs = 60 * 60 * 1000;
const maximumOperations = 100;
const operationResults = new Map<string, unknown>();
const operationResultTimers = new Map<string, NodeJS.Timeout>();

export class BulkOperationConflictError extends Error {
  readonly statusCode = 409;
}

function isTerminal(operation: BulkOperationRecord): boolean {
  return operation.status !== "queued" && operation.status !== "running";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function serialize(operation: BulkOperationRecord): AdminOperationEntity {
  return {
    partitionKey: PARTITION_KEY,
    rowKey: operation.id,
    kind: operation.kind,
    label: operation.label,
    status: operation.status,
    total: operation.total,
    processed: operation.processed,
    succeeded: operation.succeeded,
    failedCount: operation.failed,
    createdAt: operation.createdAt,
    startedAt: operation.startedAt ?? "",
    finishedAt: operation.finishedAt ?? "",
    error: operation.error ?? "",
    resultJson: "",
    failedJson: "",
    createdNamesJson: "",
    detail: "",
  };
}

function deserialize(entity: AdminOperationEntity): BulkOperationRecord {
  return {
    id: entity.rowKey,
    kind: entity.kind as BulkOperationKind,
    label: entity.label,
    status: entity.status as BulkOperationStatus,
    total: entity.total,
    processed: entity.processed,
    succeeded: entity.succeeded,
    failed: entity.failedCount,
    createdAt: entity.createdAt,
    startedAt: entity.startedAt || null,
    finishedAt: entity.finishedAt || null,
    error: entity.error || null,
  };
}

function withInMemoryResult(operation: BulkOperationRecord): BulkOperationRecord {
  const result = operationResults.get(operation.id);
  return result === undefined ? operation : { ...operation, result };
}

function discardOperationResult(id: string): void {
  operationResults.delete(id);
  const timer = operationResultTimers.get(id);
  if (timer) clearTimeout(timer);
  operationResultTimers.delete(id);
}

function retainOperationResult(id: string, result: unknown): void {
  discardOperationResult(id);
  operationResults.set(id, result);
  const timer = setTimeout(() => discardOperationResult(id), retentionMs);
  timer.unref();
  operationResultTimers.set(id, timer);
}

function snapshot(operation: BulkOperationRecord, includeResult = false): BulkOperation {
  const { result, ...details } = operation;
  return {
    ...details,
    hasResult: result !== undefined,
    ...(includeResult ? { result } : {}),
  };
}

async function pruneOperations(operations?: BulkOperationRecord[]): Promise<void> {
  const storage = getAdminOperationStorage();
  const records = operations ?? (await storage.list(PARTITION_KEY)).map(deserialize);
  const cutoff = Date.now() - retentionMs;
  const expired = records.filter(
    ({ finishedAt }) => finishedAt && new Date(finishedAt).valueOf() < cutoff,
  );
  const remaining = records.filter((record) => !expired.includes(record));
  const excess = remaining
    .filter(({ finishedAt }) => finishedAt)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(0, Math.max(0, remaining.length - maximumOperations));
  await Promise.all(
    [...expired, ...excess].map(async ({ id }) => {
      discardOperationResult(id);
      await storage.delete(PARTITION_KEY, id);
    }),
  );
}

async function reconcileAbandonedOperations(
  operations: BulkOperationRecord[],
): Promise<BulkOperationRecord[]> {
  const active = operations.filter((operation) => !isTerminal(operation));
  if (active.length === 0) return operations;
  const storage = getAdminOperationStorage();
  const lease = await storage.acquireLease(LEASE_NAME);
  if (!lease) return operations;
  try {
    const finishedAt = new Date().toISOString();
    const byId = new Map(operations.map((operation) => [operation.id, operation]));
    for (const staleOperation of active) {
      const currentEntity = await storage.get(PARTITION_KEY, staleOperation.id);
      if (!currentEntity) continue;
      const current = deserialize(currentEntity);
      if (isTerminal(current)) {
        byId.set(current.id, current);
        continue;
      }
      current.status = "failed";
      current.error = "The server stopped before the operation finished";
      current.finishedAt = finishedAt;
      await storage.replace(serialize(current));
      byId.set(current.id, current);
    }
    return [...byId.values()];
  } finally {
    await lease.release();
  }
}

export async function listBulkOperations(): Promise<BulkOperation[]> {
  const operations = await reconcileAbandonedOperations(
    (await getAdminOperationStorage().list(PARTITION_KEY)).map(deserialize),
  );
  await pruneOperations(operations);
  return operations
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((operation) => snapshot(withInMemoryResult(operation)));
}

export async function getBulkOperation(id: string): Promise<BulkOperation | undefined> {
  const entity = await getAdminOperationStorage().get(PARTITION_KEY, id);
  if (!entity) return undefined;
  const [operation] = await reconcileAbandonedOperations([deserialize(entity)]);
  return operation ? snapshot(withInMemoryResult(operation), true) : undefined;
}

export async function hasActiveBulkOperations(): Promise<boolean> {
  const operations = await reconcileAbandonedOperations(
    (await getAdminOperationStorage().list(PARTITION_KEY)).map(deserialize),
  );
  return operations.some((operation) => !isTerminal(operation));
}

export async function clearCompletedBulkOperations(): Promise<number> {
  const storage = getAdminOperationStorage();
  const operations = await reconcileAbandonedOperations(
    (await storage.list(PARTITION_KEY)).map(deserialize),
  );
  const completed = operations.filter(isTerminal);
  await Promise.all(
    completed.map(async ({ id }) => {
      discardOperationResult(id);
      await storage.delete(PARTITION_KEY, id);
    }),
  );
  return completed.length;
}

async function runOperation(
  operation: BulkOperationRecord,
  lease: OperationLease,
  run: (reportProgress: ProgressReporter) => Promise<unknown>,
): Promise<void> {
  const storage = getAdminOperationStorage();
  let writes = Promise.resolve();
  const persist = () => {
    const entity = serialize(operation);
    writes = writes.then(() => storage.replace(entity));
  };
  try {
    operation.status = "running";
    operation.startedAt = new Date().toISOString();
    persist();
    const reportProgress: ProgressReporter = (succeeded) => {
      lease.assertActive();
      operation.processed = Math.min(operation.total, operation.processed + 1);
      if (succeeded) operation.succeeded += 1;
      else operation.failed += 1;
      persist();
    };
    operation.result = await run(reportProgress);
    retainOperationResult(operation.id, operation.result);
    lease.assertActive();
    operation.status = operation.failed > 0 ? "partial" : "completed";
  } catch (error: unknown) {
    operation.status = "failed";
    operation.error = errorMessage(error);
    console.error(`Bulk operation "${operation.label}" (${operation.id}) failed:`, error);
  } finally {
    operation.finishedAt = new Date().toISOString();
    try {
      await writes;
      await storage.replace(serialize(operation));
    } finally {
      await lease.release();
    }
  }
}

export async function startBulkOperation(options: {
  kind: BulkOperationKind;
  label: string;
  total: number;
  run: (reportProgress: ProgressReporter) => Promise<unknown>;
}): Promise<BulkOperation> {
  const storage = getAdminOperationStorage();
  const lease = await storage.acquireLease(LEASE_NAME);
  if (!lease) {
    throw new BulkOperationConflictError("Editing is paused while a bulk activity is in progress");
  }
  const operation: BulkOperationRecord = {
    id: randomUUID(),
    kind: options.kind,
    label: options.label,
    status: "queued",
    total: options.total,
    processed: 0,
    succeeded: 0,
    failed: 0,
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
    error: null,
  };
  try {
    await pruneOperations();
    await storage.create(serialize(operation));
  } catch (error: unknown) {
    await lease.release();
    throw error;
  }
  queueMicrotask(() => {
    void runOperation(operation, lease, options.run).catch((error: unknown) => {
      console.error(
        `Failed to persist bulk operation "${operation.label}" (${operation.id}):`,
        error,
      );
    });
  });
  return snapshot(operation);
}
