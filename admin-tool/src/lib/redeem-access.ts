import { createHash, randomInt } from "node:crypto";
import { TableClient, type TableEntityResult } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";

const GENERATED_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GENERATED_CODE_LENGTH = 12;

type AccessKeyProperties = {
  label: string;
  accessText: string;
  apiKeyHash?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
};

export type RedeemAccessKey = {
  code: string;
  label: string;
  accessText: string;
  apiKeyHash: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  etag: string;
};

export type CreateRedeemAccessKeyInput = {
  label: string;
  accessText: string;
  apiKeyHash?: string;
  code?: string;
  expiresAt?: Date;
};

export type UpdateRedeemAccessKeyInput = Partial<
  Pick<CreateRedeemAccessKeyInput, "label" | "accessText"> & {
    expiresAt: Date | null;
    enabled: boolean;
    etag: string;
  }
>;

export class RedeemAccessError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

let tableClient: TableClient | undefined;
let contextPromise: Promise<RedeemAccessContext> | undefined;
let azureCredential: DefaultAzureCredential | undefined;

function getAzureCredential(): DefaultAzureCredential {
  if (!azureCredential) azureCredential = new DefaultAzureCredential();
  return azureCredential;
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new RedeemAccessError(`${name} is not set`, 503);
  return value;
}

function getTableClient(): TableClient {
  if (tableClient) return tableClient;

  const accountName = requiredEnvironment("AZURE_STORAGE_ACCOUNT_NAME");
  const tableName = process.env.AZURE_STORAGE_TABLE_NAME?.trim() || "AccessCodes";
  const endpoint =
    process.env.AZURE_STORAGE_TABLE_ENDPOINT?.trim() ||
    `https://${accountName}.table.core.windows.net`;

  tableClient = new TableClient(endpoint, tableName, getAzureCredential());
  return tableClient;
}

export function normalizeRedeemCode(value: string): string {
  const normalized = value.toUpperCase().replace(/[\s-]/g, "");
  if (!/^[A-Z2-9]{10,64}$/.test(normalized)) {
    throw new RedeemAccessError(
      "Access code must contain 10 to 64 letters or digits (excluding 0 and 1)",
      400,
    );
  }
  return normalized;
}

export function generateRedeemCode(): string {
  const characters = Array.from(
    { length: GENERATED_CODE_LENGTH },
    () => GENERATED_CODE_ALPHABET[randomInt(GENERATED_CODE_ALPHABET.length)],
  );
  return [characters.slice(0, 4), characters.slice(4, 8), characters.slice(8)]
    .map((group) => group.join(""))
    .join("-");
}

function formatRedeemCode(code: string): string {
  return normalizeRedeemCode(code).replace(/(.{4})(?=.)/g, "$1-");
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function toRedeemAccessKey(entity: TableEntityResult<AccessKeyProperties>): RedeemAccessKey {
  if (!entity.rowKey) {
    throw new Error("Azure Table entity is missing its row key");
  }

  return {
    code: formatRedeemCode(entity.rowKey),
    label: entity.label,
    accessText: entity.accessText,
    apiKeyHash: entity.apiKeyHash ?? null,
    enabled: entity.enabled,
    createdAt: asDate(entity.createdAt).toISOString(),
    updatedAt: asDate(entity.updatedAt).toISOString(),
    expiresAt: entity.expiresAt ? asDate(entity.expiresAt).toISOString() : null,
    etag: entity.etag,
  };
}

function storageStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) return undefined;
  return typeof error.statusCode === "number" ? error.statusCode : undefined;
}

async function getEntity(codeValue: string): Promise<TableEntityResult<AccessKeyProperties>> {
  const code = normalizeRedeemCode(codeValue);
  try {
    return await getTableClient().getEntity<AccessKeyProperties>(code.slice(0, 2), code);
  } catch (error: unknown) {
    if (storageStatus(error) === 404) {
      throw new RedeemAccessError("Redeem access key not found", 404);
    }
    throw error;
  }
}

export type RedeemAccessContext = {
  accountName: string;
  tableName: string;
  subscriptionName: string | null;
  resourceGroup: string | null;
};

function optionalEnvironment(name: string): string | null {
  return process.env[name]?.trim() || null;
}

type ArmSubscription = {
  subscriptionId: string;
  displayName: string;
  state: string;
};

type ArmStorageAccount = {
  id: string;
  name: string;
};

type ArmListResponse<T> = {
  value: T[];
  nextLink?: string;
};

async function armRequest<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Azure Resource Manager request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

async function armList<T>(url: string, accessToken: string): Promise<T[]> {
  const values: T[] = [];
  let nextUrl: string | undefined = url;
  while (nextUrl) {
    const page: ArmListResponse<T> = await armRequest(nextUrl, accessToken);
    values.push(...page.value);
    nextUrl = page.nextLink;
  }
  return values;
}

function resourceGroupFromId(resourceId: string): string | null {
  return resourceId.match(/\/resourceGroups\/([^/]+)\//i)?.[1] ?? null;
}

async function discoverRedeemAccessContext(): Promise<RedeemAccessContext> {
  const accountName = requiredEnvironment("AZURE_STORAGE_ACCOUNT_NAME");
  const tableName = process.env.AZURE_STORAGE_TABLE_NAME?.trim() || "AccessCodes";
  const configuredSubscriptionId = optionalEnvironment("AZURE_SUBSCRIPTION_ID");
  const configuredContext: RedeemAccessContext = {
    accountName,
    tableName,
    subscriptionName: optionalEnvironment("AZURE_SUBSCRIPTION_NAME"),
    resourceGroup: optionalEnvironment("AZURE_RESOURCE_GROUP"),
  };

  try {
    const token = await getAzureCredential().getToken("https://management.azure.com/.default");
    if (!token) return configuredContext;

    const subscriptions = await armList<ArmSubscription>(
      "https://management.azure.com/subscriptions?api-version=2022-12-01",
      token.token,
    );
    subscriptions.sort((left, right) => {
      if (left.subscriptionId === configuredSubscriptionId) return -1;
      if (right.subscriptionId === configuredSubscriptionId) return 1;
      return left.displayName.localeCompare(right.displayName);
    });

    for (const subscription of subscriptions.filter(({ state }) => state === "Enabled")) {
      try {
        const storageAccounts = await armList<ArmStorageAccount>(
          `https://management.azure.com/subscriptions/${encodeURIComponent(subscription.subscriptionId)}/providers/Microsoft.Storage/storageAccounts?api-version=2025-01-01`,
          token.token,
        );
        const storageAccount = storageAccounts.find(
          ({ name }) => name.toLocaleLowerCase() === accountName.toLocaleLowerCase(),
        );
        if (!storageAccount) continue;

        return {
          accountName,
          tableName,
          subscriptionName: subscription.displayName,
          resourceGroup: resourceGroupFromId(storageAccount.id),
        };
      } catch {
        // The identity might not have access to every visible subscription.
      }
    }
  } catch {
    // Resource Manager metadata is optional; table data access may still work.
  }

  return configuredContext;
}

export async function getRedeemAccessContext(): Promise<RedeemAccessContext> {
  if (!contextPromise) {
    contextPromise = discoverRedeemAccessContext().catch((error: unknown) => {
      contextPromise = undefined;
      throw error;
    });
  }
  return contextPromise;
}

export async function listRedeemAccessKeys(): Promise<RedeemAccessKey[]> {
  const records: RedeemAccessKey[] = [];
  for await (const entity of getTableClient().listEntities<AccessKeyProperties>()) {
    records.push(toRedeemAccessKey(entity));
  }
  return records.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function listRedeemAccessKeysForApiKeys(
  hashes: string[],
): Promise<Map<string, RedeemAccessKey[]>> {
  const normalizedHashes = new Set(hashes.map((hash) => hash.toLocaleLowerCase()));
  const records = new Map<string, RedeemAccessKey[]>();

  for await (const entity of getTableClient().listEntities<AccessKeyProperties>()) {
    const hash =
      entity.apiKeyHash?.toLocaleLowerCase() ||
      createHash("sha256").update(entity.accessText).digest("hex");
    if (!normalizedHashes.has(hash)) continue;
    const matches = records.get(hash) ?? [];
    matches.push(toRedeemAccessKey(entity));
    records.set(hash, matches);
  }

  return records;
}

export async function createRedeemAccessKey(
  input: CreateRedeemAccessKeyInput,
): Promise<RedeemAccessKey> {
  const code = normalizeRedeemCode(input.code?.trim() || generateRedeemCode());
  const now = new Date();
  const entity = {
    partitionKey: code.slice(0, 2),
    rowKey: code,
    label: input.label,
    accessText: input.accessText,
    ...(input.apiKeyHash ? { apiKeyHash: input.apiKeyHash.toLocaleLowerCase() } : {}),
    enabled: true,
    createdAt: now,
    updatedAt: now,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
  };

  try {
    await getTableClient().createEntity(entity);
  } catch (error: unknown) {
    if (storageStatus(error) === 409) {
      throw new RedeemAccessError("That redeem access code already exists", 409);
    }
    throw error;
  }

  return toRedeemAccessKey(await getEntity(code));
}

export async function updateRedeemAccessKey(
  codeValue: string,
  changes: UpdateRedeemAccessKeyInput,
): Promise<RedeemAccessKey> {
  const current = await getEntity(codeValue);
  const code = normalizeRedeemCode(codeValue);
  const etag = changes.etag || current.etag;
  const expiresAt = Object.hasOwn(changes, "expiresAt") ? changes.expiresAt : current.expiresAt;
  const entity = {
    partitionKey: code.slice(0, 2),
    rowKey: code,
    label: changes.label ?? current.label,
    accessText: changes.accessText ?? current.accessText,
    ...(current.apiKeyHash ? { apiKeyHash: current.apiKeyHash } : {}),
    enabled: changes.enabled ?? current.enabled,
    createdAt: current.createdAt,
    updatedAt: new Date(),
    ...(expiresAt ? { expiresAt } : {}),
  };

  try {
    await getTableClient().updateEntity(entity, "Replace", { etag });
  } catch (error: unknown) {
    if (storageStatus(error) === 412) {
      throw new RedeemAccessError(
        "This access key changed since it was opened. Refresh and try again.",
        409,
      );
    }
    throw error;
  }

  return toRedeemAccessKey(await getEntity(code));
}

export async function deleteRedeemAccessKey(codeValue: string, etag?: string): Promise<void> {
  const current = await getEntity(codeValue);
  const code = normalizeRedeemCode(codeValue);
  try {
    await getTableClient().deleteEntity(code.slice(0, 2), code, {
      etag: etag || current.etag,
    });
  } catch (error: unknown) {
    if (storageStatus(error) === 412) {
      throw new RedeemAccessError(
        "This access key changed since it was opened. Refresh and try again.",
        409,
      );
    }
    throw error;
  }
}
