import { TableClient, type TableEntityResult } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import "dotenv/config";

type AccessCodeProperties = {
  accessText?: string;
  enabled?: boolean;
  expiresAt?: Date | string;
};

let tableClient: TableClient | undefined;
let activeLookups = 0;
let healthProbePromise: Promise<void> | undefined;
let healthProbeExpiresAt = 0;

const maxConcurrentLookups = 16;
const lookupTimeoutMs = 5_000;
const healthProbeCacheMs = 30_000;

export class RedeemServiceBusyError extends Error {}

function getTableClient(): TableClient {
  if (tableClient) return tableClient;

  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim();
  if (!accountName) {
    throw new Error("AZURE_STORAGE_ACCOUNT_NAME is not set");
  }

  const tableName =
    process.env.AZURE_STORAGE_TABLE_NAME?.trim() || "AccessCodes";
  const endpoint =
    process.env.AZURE_STORAGE_TABLE_ENDPOINT?.trim() ||
    `https://${accountName}.table.core.windows.net`;

  tableClient = new TableClient(
    endpoint,
    tableName,
    new DefaultAzureCredential(),
  );
  return tableClient;
}

export function normalizeRedeemCode(value: string): string | null {
  if (!/^[A-Za-z2-9\s-]+$/.test(value)) return null;
  const normalized = value.replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z2-9]{10,64}$/.test(normalized) ? normalized : null;
}

function storageStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return undefined;
  }
  return typeof error.statusCode === "number" ? error.statusCode : undefined;
}

function storageCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  return typeof error.code === "string" ? error.code : undefined;
}

function isMissingEntity(error: unknown): boolean {
  return (
    storageStatus(error) === 404 && storageCode(error) === "EntityNotFound"
  );
}

async function withLookupSlot<T>(operation: () => Promise<T>): Promise<T> {
  if (activeLookups >= maxConcurrentLookups) {
    throw new RedeemServiceBusyError("Redeem lookup capacity is exhausted");
  }
  activeLookups += 1;
  try {
    return await operation();
  } finally {
    activeLookups -= 1;
  }
}

function isAvailable(
  entity: TableEntityResult<AccessCodeProperties>,
): entity is TableEntityResult<AccessCodeProperties> & { accessText: string } {
  if (entity.enabled !== true || typeof entity.accessText !== "string") {
    return false;
  }
  if (!entity.expiresAt) return true;

  const expiry =
    entity.expiresAt instanceof Date
      ? entity.expiresAt
      : new Date(entity.expiresAt);
  return !Number.isNaN(expiry.valueOf()) && expiry > new Date();
}

/** Resolve an enabled, unexpired redeem code using a private Azure Table point read. */
export async function lookupRedeemCode(
  codeValue: string,
): Promise<string | null> {
  const code = normalizeRedeemCode(codeValue);
  if (!code) return null;

  try {
    const entity = await withLookupSlot(() =>
      getTableClient().getEntity<AccessCodeProperties>(code.slice(0, 2), code, {
        abortSignal: AbortSignal.timeout(lookupTimeoutMs),
      }),
    );
    return isAvailable(entity) ? entity.accessText : null;
  } catch (error: unknown) {
    if (isMissingEntity(error)) return null;
    throw error;
  }
}

/** Verify that credentials, networking, and the configured table are usable. */
export async function probeRedeemService(): Promise<void> {
  const now = Date.now();
  if (!healthProbePromise || healthProbeExpiresAt <= now) {
    healthProbeExpiresAt = now + healthProbeCacheMs;
    healthProbePromise = withLookupSlot(async () => {
      try {
        await getTableClient().getEntity("__HEALTH__", "__HEALTH__", {
          abortSignal: AbortSignal.timeout(lookupTimeoutMs),
        });
      } catch (error: unknown) {
        if (!isMissingEntity(error)) throw error;
      }
    });
  }
  await healthProbePromise;
}
