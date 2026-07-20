import { type Request, Router } from "express";
import {
  type BulkOperationKind,
  clearCompletedBulkOperations,
  getBulkOperation,
  hasActiveBulkOperations,
  listBulkOperations,
  startBulkOperation,
} from "../lib/bulk-operations.js";
import {
  type CreateKeyInput,
  createApiKeys,
  deleteApiKey,
  getApiKey,
  getHackathonContext,
  listApiKeys,
  type UpdateKeyInput,
  updateApiKey,
} from "../lib/openrouter.js";

class HttpError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400,
  ) {
    super(message);
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError("Request body must be a JSON object");
  }
  return value as Record<string, unknown>;
}

function parseName(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError("Key name is required");
  }
  if (value.trim().length > 120) {
    throw new HttpError("Key name must be 120 characters or fewer");
  }
  return value.trim();
}

function parseNullableLimit(value: unknown): number | null {
  if (value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new HttpError("Spending limit must be a non-negative number or null");
  }
  return value;
}

function parseCreateOptions(body: Record<string, unknown>): Omit<CreateKeyInput, "name"> {
  const input: Omit<CreateKeyInput, "name"> = {};

  if (Object.hasOwn(body, "limit")) input.limit = parseNullableLimit(body.limit);
  if (Object.hasOwn(body, "expiresAt") && body.expiresAt !== null && body.expiresAt !== "") {
    if (typeof body.expiresAt !== "string") {
      throw new HttpError("Expiration must be an ISO 8601 timestamp");
    }
    const expiresAt = new Date(body.expiresAt);
    if (Number.isNaN(expiresAt.valueOf())) {
      throw new HttpError("Expiration must be a valid ISO 8601 timestamp");
    }
    if (expiresAt <= new Date()) throw new HttpError("Expiration must be in the future");
    input.expiresAt = expiresAt;
  }

  return input;
}

function parseUpdate(bodyValue: unknown): UpdateKeyInput {
  const body = asRecord(bodyValue);
  const changes: UpdateKeyInput = {};

  if (Object.hasOwn(body, "name")) changes.name = parseName(body.name);
  if (Object.hasOwn(body, "disabled")) {
    if (typeof body.disabled !== "boolean") throw new HttpError("disabled must be a boolean");
    changes.disabled = body.disabled;
  }
  if (Object.hasOwn(body, "limit")) changes.limit = parseNullableLimit(body.limit);
  if (Object.keys(changes).length === 0) {
    throw new HttpError("At least one key property must be provided");
  }
  return changes;
}

function parseHashes(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError("At least one key hash is required");
  }
  if (value.length > 100) throw new HttpError("Bulk operations are limited to 100 keys");

  const hashes = value.map((hash) => {
    if (typeof hash !== "string" || !/^[a-f0-9]{64}$/i.test(hash)) {
      throw new HttpError("Every key hash must be a 64-character hexadecimal string");
    }
    return hash;
  });
  return [...new Set(hashes)];
}

function getHash(request: Request): string {
  const hash = request.params.hash;
  if (typeof hash !== "string" || !/^[a-f0-9]{64}$/i.test(hash)) {
    throw new HttpError("Invalid API key hash");
  }
  return hash;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function assertEditingAvailable(): void {
  if (hasActiveBulkOperations()) {
    throw new HttpError("Editing is paused while a bulk activity is in progress", 409);
  }
}

async function bulkProcess<T>(
  hashes: string[],
  operation: (hash: string) => Promise<T>,
  reportProgress: (succeeded: boolean) => void,
) {
  const succeeded: T[] = [];
  const failed: Array<{ hash: string; error: string }> = [];

  for (const hash of hashes) {
    try {
      succeeded.push(await operation(hash));
      reportProgress(true);
    } catch (error: unknown) {
      failed.push({ hash, error: errorMessage(error) });
      reportProgress(false);
    }
  }
  return { succeeded, failed };
}

const router = Router();

router.use((_request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  next();
});

router.get("/status", async (_request, response) => {
  response.json(await getHackathonContext());
});

router.get("/keys", async (_request, response) => {
  response.json({ data: await listApiKeys() });
});

router.get("/operations", (_request, response) => {
  response.json({ data: listBulkOperations() });
});

router.get("/operations/:id", (request, response) => {
  const operation = getBulkOperation(request.params.id ?? "");
  if (!operation) {
    throw new HttpError("Bulk operation not found", 404);
  }
  response.json({ data: operation });
});

router.delete("/operations/completed", (_request, response) => {
  response.json({ cleared: clearCompletedBulkOperations() });
});

router.post("/keys/bulk", async (request, response) => {
  assertEditingAvailable();
  const body = asRecord(request.body);
  if (!Array.isArray(body.names) || body.names.length === 0) {
    throw new HttpError("At least one key name is required");
  }
  if (body.names.length > 100) throw new HttpError("Bulk creation is limited to 100 keys");

  const names = body.names.map(parseName);
  const duplicateName = names.find((name, index) => names.indexOf(name) !== index);
  if (duplicateName) throw new HttpError(`Duplicate key name: ${duplicateName}`);

  const keyOptions = parseCreateOptions(body);
  const operation = startBulkOperation({
    kind: "create",
    label: `Creating ${names.length} key${names.length === 1 ? "" : "s"}`,
    total: names.length,
    run: (reportProgress) =>
      createApiKeys(
        names.map((name) => ({ name, ...keyOptions })),
        () => reportProgress(true),
      ),
  });
  response.status(202).json({ operation });
});

router.patch("/keys/bulk", async (request, response) => {
  assertEditingAvailable();
  const body = asRecord(request.body);
  const hashes = parseHashes(body.hashes);
  const changes = parseUpdate(body.changes);
  let kind: BulkOperationKind = "update";
  let action = "Updating";
  if (Object.keys(changes).length === 1 && changes.disabled === true) {
    kind = "disable";
    action = "Disabling";
  } else if (Object.keys(changes).length === 1 && changes.disabled === false) {
    kind = "enable";
    action = "Enabling";
  }
  const operation = startBulkOperation({
    kind,
    label: `${action} ${hashes.length} key${hashes.length === 1 ? "" : "s"}`,
    total: hashes.length,
    run: (reportProgress) =>
      bulkProcess(hashes, (hash) => updateApiKey(hash, changes), reportProgress),
  });
  response.status(202).json({ operation });
});

router.delete("/keys/bulk", async (request, response) => {
  assertEditingAvailable();
  const body = asRecord(request.body);
  const hashes = parseHashes(body.hashes);
  const operation = startBulkOperation({
    kind: "delete",
    label: `Deleting ${hashes.length} key${hashes.length === 1 ? "" : "s"}`,
    total: hashes.length,
    run: (reportProgress) =>
      bulkProcess(
        hashes,
        async (hash) => {
          await deleteApiKey(hash);
          return hash;
        },
        reportProgress,
      ),
  });
  response.status(202).json({ operation });
});

router.post("/keys", async (request, response) => {
  assertEditingAvailable();
  const body = asRecord(request.body);
  const result = await createApiKeys([{ name: parseName(body.name), ...parseCreateOptions(body) }]);
  response.status(201).json({ data: result.created[0], assignedCount: result.assignedCount });
});

router.get("/keys/:hash", async (request, response) => {
  response.json({ data: await getApiKey(getHash(request)) });
});

router.patch("/keys/:hash", async (request, response) => {
  assertEditingAvailable();
  response.json({ data: await updateApiKey(getHash(request), parseUpdate(request.body)) });
});

router.delete("/keys/:hash", async (request, response) => {
  assertEditingAvailable();
  await deleteApiKey(getHash(request));
  response.status(204).end();
});

export default router;
