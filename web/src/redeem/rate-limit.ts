import { createHash } from "node:crypto";
import { isIP } from "node:net";
import {
  TableClient,
  type TableEntity,
  type TableEntityResult,
} from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import "dotenv/config";

type RateLimitProperties = {
  count: number;
  resetAt: Date | string;
};

export interface RateLimitStore {
  create(entity: TableEntity<RateLimitProperties>): Promise<void>;
  get(rowKey: string): Promise<TableEntityResult<RateLimitProperties> | null>;
  update(
    entity: TableEntity<RateLimitProperties>,
    etag: string,
  ): Promise<boolean>;
}

const partitionKey = "REDEEM";
const windowMs = 60_000;
const requestsPerWindow = 10;
const maxWriteAttempts = 5;
let tableClient: TableClient | undefined;

function storageStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return undefined;
  }
  return typeof error.statusCode === "number" ? error.statusCode : undefined;
}

function getTableClient(): TableClient {
  if (tableClient) return tableClient;

  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim();
  if (!accountName) {
    throw new Error("AZURE_STORAGE_ACCOUNT_NAME is not set");
  }
  const tableName =
    process.env.AZURE_STORAGE_RATE_LIMIT_TABLE_NAME?.trim() ||
    "RedeemRateLimits";
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

const azureStore: RateLimitStore = {
  async get(rowKey) {
    try {
      return await getTableClient().getEntity<RateLimitProperties>(
        partitionKey,
        rowKey,
        { abortSignal: AbortSignal.timeout(5_000) },
      );
    } catch (error: unknown) {
      if (storageStatus(error) === 404) return null;
      throw error;
    }
  },
  async create(entity) {
    await getTableClient().createEntity(entity, {
      abortSignal: AbortSignal.timeout(5_000),
    });
  },
  async update(entity, etag) {
    try {
      await getTableClient().updateEntity(entity, "Replace", {
        etag,
        abortSignal: AbortSignal.timeout(5_000),
      });
      return true;
    } catch (error: unknown) {
      if (storageStatus(error) === 412) return false;
      throw error;
    }
  },
};

/**
 * Use the address appended by Azure's nearest proxy, not Astro's first
 * X-Forwarded-For entry. Outside App Service, use the adapter socket address.
 */
export function redeemClientAddress(
  request: Request,
  adapterAddress: string,
): string {
  if (process.env.WEBSITE_INSTANCE_ID) {
    const forwardedAddress = request.headers
      .get("x-forwarded-for")
      ?.split(",")
      .at(-1)
      ?.trim();
    return forwardedAddress && isIP(forwardedAddress)
      ? forwardedAddress
      : "unknown-app-service-client";
  }

  const localAddress = adapterAddress.trim();
  if (!localAddress) {
    throw new Error("A client address is required for redeem rate limiting");
  }
  return localAddress;
}

function clientRowKey(clientAddress: string): string {
  return createHash("sha256").update(clientAddress).digest("hex");
}

/** Atomically consume one attempt from a shared fixed-window rate limit. */
export async function redeemRateLimit(
  clientAddress: string,
  store: RateLimitStore = azureStore,
  now = Date.now(),
): Promise<number | null> {
  const key = clientAddress.trim();
  if (!key) {
    throw new Error("A client address is required for redeem rate limiting");
  }
  const rowKey = clientRowKey(key);

  for (let attempt = 0; attempt < maxWriteAttempts; attempt += 1) {
    const current = await store.get(rowKey);
    if (!current) {
      try {
        await store.create({
          partitionKey,
          rowKey,
          count: 1,
          resetAt: new Date(now + windowMs),
        });
        return null;
      } catch (error: unknown) {
        if (storageStatus(error) === 409) continue;
        throw error;
      }
    }

    const resetAt = new Date(current.resetAt).valueOf();
    if (resetAt > now && current.count >= requestsPerWindow) {
      return Math.max(1, Math.ceil((resetAt - now) / 1_000));
    }

    const nextResetAt =
      resetAt > now ? new Date(resetAt) : new Date(now + windowMs);
    const updated = await store.update(
      {
        partitionKey,
        rowKey,
        count: resetAt > now ? current.count + 1 : 1,
        resetAt: nextResetAt,
      },
      current.etag,
    );
    if (updated) return null;
  }

  throw new Error("Rate-limit counter changed too frequently");
}
