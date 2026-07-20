import { randomUUID } from "node:crypto";

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

const operations = new Map<string, BulkOperationRecord>();
const retentionMs = 60 * 60 * 1000;
const maximumOperations = 100;

function isTerminal(operation: BulkOperationRecord): boolean {
  return operation.status !== "queued" && operation.status !== "running";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function pruneOperations(): void {
  const cutoff = Date.now() - retentionMs;

  for (const [id, operation] of operations) {
    if (operation.finishedAt && new Date(operation.finishedAt).valueOf() < cutoff) {
      operations.delete(id);
    }
  }

  if (operations.size <= maximumOperations) {
    return;
  }

  const removable = [...operations.values()]
    .filter((operation) => operation.finishedAt)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  for (const operation of removable) {
    if (operations.size <= maximumOperations) {
      break;
    }
    operations.delete(operation.id);
  }
}

function snapshot(operation: BulkOperationRecord, includeResult = false): BulkOperation {
  const { result, ...details } = operation;

  return {
    ...details,
    hasResult: result !== undefined,
    ...(includeResult ? { result } : {}),
  };
}

export function listBulkOperations(): BulkOperation[] {
  pruneOperations();

  return [...operations.values()]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((operation) => snapshot(operation));
}

export function getBulkOperation(id: string): BulkOperation | undefined {
  pruneOperations();
  const operation = operations.get(id);
  return operation ? snapshot(operation, true) : undefined;
}

export function hasActiveBulkOperations(): boolean {
  pruneOperations();
  return [...operations.values()].some((operation) => !isTerminal(operation));
}

export function clearCompletedBulkOperations(): number {
  pruneOperations();
  let cleared = 0;

  for (const [id, operation] of operations) {
    if (isTerminal(operation)) {
      operations.delete(id);
      cleared += 1;
    }
  }

  return cleared;
}

export function startBulkOperation(options: {
  kind: BulkOperationKind;
  label: string;
  total: number;
  run: (reportProgress: ProgressReporter) => Promise<unknown>;
}): BulkOperation {
  pruneOperations();

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
  operations.set(operation.id, operation);

  queueMicrotask(() => {
    void (async () => {
      operation.status = "running";
      operation.startedAt = new Date().toISOString();

      const reportProgress: ProgressReporter = (succeeded) => {
        operation.processed = Math.min(operation.total, operation.processed + 1);
        if (succeeded) {
          operation.succeeded += 1;
        } else {
          operation.failed += 1;
        }
      };

      try {
        operation.result = await options.run(reportProgress);
        operation.status = operation.failed > 0 ? "partial" : "completed";
      } catch (error: unknown) {
        operation.status = "failed";
        operation.error = errorMessage(error);
      } finally {
        operation.finishedAt = new Date().toISOString();
      }
    })();
  });

  return snapshot(operation);
}
