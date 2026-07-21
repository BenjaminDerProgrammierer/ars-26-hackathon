import { TableClient, type TableEntityResult } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import "dotenv/config";

type AccessCodeProperties = {
  accessText?: string;
  enabled?: boolean;
  expiresAt?: Date | string;
};

let tableClient: TableClient | undefined;

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

function normalizeRedeemCode(value: string): string | null {
  const normalized = value.toUpperCase().replace(/[\s-]/g, "");
  return /^[A-Z2-9]{10,64}$/.test(normalized) ? normalized : null;
}

function storageStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return undefined;
  }
  return typeof error.statusCode === "number" ? error.statusCode : undefined;
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
    const entity = await getTableClient().getEntity<AccessCodeProperties>(
      code.slice(0, 2),
      code,
    );
    return isAvailable(entity) ? entity.accessText : null;
  } catch (error: unknown) {
    if (storageStatus(error) === 404) return null;
    throw error;
  }
}
