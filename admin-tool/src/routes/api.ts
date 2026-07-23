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
  clearCompletedDevEnvironmentOperations,
  EnvironmentOperationConflictError,
  getDevEnvironmentContext,
  getDevEnvironments,
  listDevEnvironments,
  setEnvironmentRedeemCode,
  startDevEnvironmentBulkAction,
  startDevEnvironmentCreation,
  validateBulkAction,
  validateEnvironmentNames,
  validateStartDeploymentInput,
} from "../lib/dev-environments.js";
import {
  type CreateKeyInput,
  createApiKeys,
  deleteApiKeyIfExists,
  generateRandomApiKeyNames,
  getApiKey,
  getCreditBalance,
  getHackathonContext,
  listApiKeys,
  type UpdateKeyInput,
  updateApiKey,
} from "../lib/openrouter.js";
import {
  createRedeemAccessKey,
  deleteRedeemAccessKey,
  getRedeemAccessContext,
  listRedeemAccessKeys,
  listRedeemAccessKeysForApiKeys,
  normalizeRedeemCode,
  type UpdateRedeemAccessKeyInput,
  updateRedeemAccessKey,
} from "../lib/redeem-access.js";

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

function parseRequiredText(value: unknown, label: string, maximumLength: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(`${label} is required`);
  }
  const text = value.trim();
  if (text.length > maximumLength) {
    throw new HttpError(`${label} must be ${maximumLength} characters or fewer`);
  }
  return text;
}

function parseExpiration(value: unknown, requiredFuture = true): Date | undefined {
  if (value === null || value === "" || value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new HttpError("Expiration must be an ISO 8601 timestamp");
  }
  const expiresAt = new Date(value);
  if (Number.isNaN(expiresAt.valueOf())) {
    throw new HttpError("Expiration must be a valid ISO 8601 timestamp");
  }
  if (requiredFuture && expiresAt <= new Date()) {
    throw new HttpError("Expiration must be in the future");
  }
  return expiresAt;
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

function parseRedeemCodes(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError("At least one access code is required");
  }
  if (value.length > 100) throw new HttpError("Bulk operations are limited to 100 keys");

  const codes = value.map((code) => {
    if (typeof code !== "string") throw new HttpError("Every access code must be a string");
    return normalizeRedeemCode(code);
  });
  return [...new Set(codes)];
}

function parseRedeemUpdate(
  bodyValue: unknown,
  options: { allowEtag?: boolean } = {},
): UpdateRedeemAccessKeyInput {
  const body = asRecord(bodyValue);
  const changes: UpdateRedeemAccessKeyInput = {};

  if (Object.hasOwn(body, "label")) {
    changes.label = parseRequiredText(body.label, "Label", 120);
  }
  if (Object.hasOwn(body, "accessText")) {
    changes.accessText = parseRequiredText(body.accessText, "Access information", 30_000);
  }
  if (Object.hasOwn(body, "enabled")) {
    if (typeof body.enabled !== "boolean") throw new HttpError("enabled must be a boolean");
    changes.enabled = body.enabled;
  }
  if (Object.hasOwn(body, "expiresAt")) {
    changes.expiresAt = parseExpiration(body.expiresAt, false) ?? null;
  }
  if (options.allowEtag && Object.hasOwn(body, "etag")) {
    if (typeof body.etag !== "string" || !body.etag) throw new HttpError("Invalid ETag");
    changes.etag = body.etag;
  }
  if (Object.keys(changes).every((key) => key === "etag")) {
    throw new HttpError("At least one access key property must be provided");
  }
  return changes;
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

async function assertEditingAvailable(): Promise<void> {
  if (await hasActiveBulkOperations()) {
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

async function startKeyCreationOperation(inputs: CreateKeyInput[]) {
  return startBulkOperation({
    kind: "create",
    label: `Creating ${inputs.length} key${inputs.length === 1 ? "" : "s"}`,
    total: inputs.length,
    run: (reportProgress) => createApiKeys(inputs, () => reportProgress(true)),
  });
}

async function startKeyUpdateOperation(hashes: string[], changes: UpdateKeyInput) {
  let kind: BulkOperationKind = "update";
  let action = "Updating";
  if (Object.keys(changes).length === 1 && changes.disabled === true) {
    kind = "disable";
    action = "Disabling";
  } else if (Object.keys(changes).length === 1 && changes.disabled === false) {
    kind = "enable";
    action = "Enabling";
  }
  return startBulkOperation({
    kind,
    label: `${action} ${hashes.length} key${hashes.length === 1 ? "" : "s"}`,
    total: hashes.length,
    run: async (reportProgress) => {
      const syncRedeemKeys = Object.hasOwn(changes, "name") || Object.hasOwn(changes, "disabled");
      const redeemKeys = syncRedeemKeys ? await listRedeemAccessKeysForApiKeys(hashes) : new Map();
      return bulkProcess(
        hashes,
        async (hash) => {
          const updated = await updateApiKey(hash, changes);
          for (const redeemKey of redeemKeys.get(hash.toLocaleLowerCase()) ?? []) {
            await updateRedeemAccessKey(redeemKey.code, {
              ...(Object.hasOwn(changes, "name") ? { label: `AI API key "${updated.name}"` } : {}),
              ...(Object.hasOwn(changes, "disabled") ? { enabled: !updated.disabled } : {}),
            });
          }
          return updated;
        },
        reportProgress,
      );
    },
  });
}

async function startKeyDeleteOperation(hashes: string[]) {
  return startBulkOperation({
    kind: "delete",
    label: `Deleting ${hashes.length} key${hashes.length === 1 ? "" : "s"}`,
    total: hashes.length,
    run: async (reportProgress) => {
      const redeemKeys = await listRedeemAccessKeysForApiKeys(hashes);
      return bulkProcess(
        hashes,
        async (hash) => {
          await deleteApiKeyIfExists(hash);
          for (const redeemKey of redeemKeys.get(hash.toLocaleLowerCase()) ?? []) {
            await deleteRedeemAccessKey(redeemKey.code);
          }
          return hash;
        },
        reportProgress,
      );
    },
  });
}

const router = Router();

router.use((_request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  next();
});

router.get("/status", async (_request, response) => {
  const [context, credits] = await Promise.all([getHackathonContext(), getCreditBalance()]);
  response.json({ ...context, credits });
});

router.get("/keys", async (_request, response) => {
  response.json({ data: await listApiKeys() });
});

router.get("/redeem-access/status", async (_request, response) => {
  response.json(await getRedeemAccessContext());
});

router.get("/redeem-access/keys", async (_request, response) => {
  response.json({ data: await listRedeemAccessKeys() });
});

router.get("/dev-environments/status", async (request, response) => {
  const context = await getDevEnvironmentContext();
  const openRouterContext = context.configured ? await getHackathonContext() : null;
  response.json({
    ...context,
    model:
      openRouterContext?.guardrail.availableModels.length === 1
        ? openRouterContext.guardrail.availableModels[0]
        : null,
    environments: context.configured
      ? await listDevEnvironments({ refresh: request.query.refresh === "true" })
      : [],
  });
});

router.get("/dev-environments", async (request, response) => {
  const context = await getDevEnvironmentContext();
  response.json({
    data: await listDevEnvironments({ refresh: request.query.refresh === "true" }),
    operation: context.operation,
  });
});

router.delete("/dev-environments/operations/completed", async (_request, response) => {
  response.json({ cleared: await clearCompletedDevEnvironmentOperations() });
});

router.post("/dev-environments", async (request, response) => {
  const input = (() => {
    try {
      return validateStartDeploymentInput(request.body);
    } catch (error: unknown) {
      throw new HttpError(errorMessage(error));
    }
  })();
  const { guardrail } = await getHackathonContext();
  const model = guardrail.availableModels[0];
  if (guardrail.availableModels.length !== 1 || !model) {
    throw new HttpError("Development environments require exactly one guardrail model", 503);
  }
  try {
    const operation = await startDevEnvironmentCreation({
      ...input,
      modelId: model.id,
    });
    response.status(202).json({ operation });
  } catch (error: unknown) {
    if (error instanceof EnvironmentOperationConflictError) {
      throw new HttpError(error.message, 409);
    }
    throw new HttpError(errorMessage(error), 503);
  }
});

router.post("/dev-environments/bulk", async (request, response) => {
  const body = asRecord(request.body);
  let names: string[];
  let action: ReturnType<typeof validateBulkAction>;
  try {
    names = validateEnvironmentNames(body.names);
    action = validateBulkAction(body.action);
  } catch (error: unknown) {
    throw new HttpError(errorMessage(error));
  }
  try {
    response.status(202).json({ operation: await startDevEnvironmentBulkAction(names, action) });
  } catch (error: unknown) {
    if (error instanceof EnvironmentOperationConflictError) {
      throw new HttpError(error.message, 409);
    }
    throw new HttpError(errorMessage(error), 503);
  }
});

router.post("/dev-environments/redeem", async (request, response) => {
  const body = asRecord(request.body);
  let names: string[];
  try {
    names = validateEnvironmentNames(body.names);
  } catch (error: unknown) {
    throw new HttpError(errorMessage(error));
  }
  const expiresAt = parseExpiration(body.expiresAt);
  const environments = await getDevEnvironments(names);
  const created = [];
  const failed: Array<{ name: string; error: string }> = [];
  for (const environment of environments) {
    if (environment.redeemCode) {
      failed.push({ name: environment.name, error: "A redeem key already exists" });
      continue;
    }
    if (environment.provisioningState !== "Succeeded") {
      failed.push({
        name: environment.name,
        error: "The environment must finish provisioning before a redeem key can be created",
      });
      continue;
    }
    try {
      const redeemKey = await createRedeemAccessKey({
        label: `Development environment ${environment.name}`,
        accessText: environment.loginText,
        ...(expiresAt ? { expiresAt } : {}),
      });
      try {
        await setEnvironmentRedeemCode(environment.name, redeemKey.code, environment.etag);
      } catch (error: unknown) {
        try {
          await deleteRedeemAccessKey(redeemKey.code, redeemKey.etag);
        } catch (cleanupError: unknown) {
          throw new Error(
            `${errorMessage(error)}. The unassociated redeem key ${redeemKey.code} could not be removed: ${errorMessage(cleanupError)}`,
            { cause: error },
          );
        }
        throw error;
      }
      created.push({ name: environment.name, redeemKey });
    } catch (error: unknown) {
      failed.push({ name: environment.name, error: errorMessage(error) });
    }
  }
  response.status(failed.length > 0 ? 207 : 201).json({ data: created, failed });
});

router.post("/redeem-access/keys/bulk", async (request, response) => {
  const body = asRecord(request.body);
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new HttpError("At least one redeem access key is required");
  }
  if (body.items.length > 100) {
    throw new HttpError("Bulk creation is limited to 100 redeem access keys");
  }

  const inputs = body.items.map((value) => {
    const item = asRecord(value);
    const expiresAt = parseExpiration(item.expiresAt);
    if (
      item.apiKeyHash !== undefined &&
      (typeof item.apiKeyHash !== "string" || !/^[a-f0-9]{64}$/i.test(item.apiKeyHash))
    ) {
      throw new HttpError("API key hash must be a 64-character hexadecimal string");
    }
    return {
      label: parseRequiredText(item.label, "Label", 120),
      accessText: parseRequiredText(item.accessText, "Access information", 30_000),
      ...(typeof item.apiKeyHash === "string" ? { apiKeyHash: item.apiKeyHash } : {}),
      ...(expiresAt ? { expiresAt } : {}),
    };
  });
  const created: Array<{
    index: number;
    data: Awaited<ReturnType<typeof createRedeemAccessKey>>;
  }> = [];
  const failed: Array<{ index: number; label: string; error: string }> = [];

  for (const [index, input] of inputs.entries()) {
    try {
      created.push({ index, data: await createRedeemAccessKey(input) });
    } catch (error: unknown) {
      failed.push({ index, label: input.label, error: errorMessage(error) });
    }
  }

  response.status(failed.length > 0 ? 207 : 201).json({ data: created, failed });
});

router.post("/redeem-access/keys", async (request, response) => {
  const body = asRecord(request.body);
  const expiresAt = parseExpiration(body.expiresAt);
  const code = body.code;
  if (code !== undefined && code !== "" && typeof code !== "string") {
    throw new HttpError("Access code must be a string");
  }
  const result = await createRedeemAccessKey({
    label: parseRequiredText(body.label, "Label", 120),
    accessText: parseRequiredText(body.accessText, "Access information", 30_000),
    ...(typeof code === "string" && code.trim() ? { code } : {}),
    ...(expiresAt ? { expiresAt } : {}),
  });
  response.status(201).json({ data: result });
});

router.patch("/redeem-access/keys/bulk", async (request, response) => {
  const body = asRecord(request.body);
  const codes = parseRedeemCodes(body.codes);
  const requestedChanges = asRecord(body.changes);
  if (Object.hasOwn(requestedChanges, "label") || Object.hasOwn(requestedChanges, "accessText")) {
    throw new HttpError("Bulk redeem-key edits support only expiration and enabled state");
  }
  const changes = parseRedeemUpdate(requestedChanges);
  const updated = [];
  const failed: Array<{ code: string; error: string }> = [];

  for (const code of codes) {
    try {
      updated.push(await updateRedeemAccessKey(code, changes));
    } catch (error: unknown) {
      failed.push({ code, error: errorMessage(error) });
    }
  }

  response.status(failed.length > 0 ? 207 : 200).json({ data: updated, failed });
});

router.delete("/redeem-access/keys/bulk", async (request, response) => {
  const body = asRecord(request.body);
  const codes = parseRedeemCodes(body.codes);
  const deleted: string[] = [];
  const failed: Array<{ code: string; error: string }> = [];

  for (const code of codes) {
    try {
      await deleteRedeemAccessKey(code);
      deleted.push(code);
    } catch (error: unknown) {
      failed.push({ code, error: errorMessage(error) });
    }
  }

  response.status(failed.length > 0 ? 207 : 200).json({ data: deleted, failed });
});

router.patch("/redeem-access/keys/:code", async (request, response) => {
  response.json({
    data: await updateRedeemAccessKey(
      request.params.code ?? "",
      parseRedeemUpdate(request.body, { allowEtag: true }),
    ),
  });
});

router.delete("/redeem-access/keys/:code", async (request, response) => {
  const etag = typeof request.query.etag === "string" ? request.query.etag : undefined;
  await deleteRedeemAccessKey(request.params.code ?? "", etag);
  response.status(204).end();
});

router.get("/operations", async (_request, response) => {
  response.json({ data: await listBulkOperations() });
});

router.get("/operations/:id", async (request, response) => {
  const operation = await getBulkOperation(request.params.id ?? "");
  if (!operation) {
    throw new HttpError("Bulk operation not found", 404);
  }
  response.json({ data: operation });
});

router.delete("/operations/completed", async (_request, response) => {
  response.json({ cleared: await clearCompletedBulkOperations() });
});

router.post("/keys/bulk", async (request, response) => {
  await assertEditingAvailable();
  const body = asRecord(request.body);
  if (!Number.isInteger(body.count) || (body.count as number) < 1 || (body.count as number) > 100) {
    throw new HttpError("Bulk creation count must be an integer between 1 and 100");
  }
  const names = generateRandomApiKeyNames(body.count as number);

  const keyOptions = parseCreateOptions(body);
  const operation = await startKeyCreationOperation(names.map((name) => ({ name, ...keyOptions })));
  response.status(202).json({ operation });
});

router.patch("/keys/bulk", async (request, response) => {
  await assertEditingAvailable();
  const body = asRecord(request.body);
  const hashes = parseHashes(body.hashes);
  const changes = parseUpdate(body.changes);
  const operation = await startKeyUpdateOperation(hashes, changes);
  response.status(202).json({ operation });
});

router.delete("/keys/bulk", async (request, response) => {
  await assertEditingAvailable();
  const body = asRecord(request.body);
  const hashes = parseHashes(body.hashes);
  const operation = await startKeyDeleteOperation(hashes);
  response.status(202).json({ operation });
});

router.post("/keys", async (request, response) => {
  await assertEditingAvailable();
  const body = asRecord(request.body);
  const operation = await startKeyCreationOperation([
    { name: generateRandomApiKeyNames(1)[0], ...parseCreateOptions(body) },
  ]);
  response.status(202).json({ operation });
});

router.get("/keys/:hash", async (request, response) => {
  response.json({ data: await getApiKey(getHash(request)) });
});

router.patch("/keys/:hash", async (request, response) => {
  await assertEditingAvailable();
  const operation = await startKeyUpdateOperation([getHash(request)], parseUpdate(request.body));
  response.status(202).json({ operation });
});

router.delete("/keys/:hash", async (request, response) => {
  await assertEditingAvailable();
  const operation = await startKeyDeleteOperation([getHash(request)]);
  response.status(202).json({ operation });
});

export default router;
