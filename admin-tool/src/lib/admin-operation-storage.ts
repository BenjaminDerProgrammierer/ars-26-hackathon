import { randomUUID } from "node:crypto";
import { TableClient, type TableEntityResult, TableServiceClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import { type BlobLeaseClient, BlobServiceClient, type BlockBlobClient } from "@azure/storage-blob";

const DEFAULT_TABLE_NAME = "AdminOperations";
const DEFAULT_LEASE_CONTAINER_NAME = "admin-operation-leases";
const LEASE_DURATION_SECONDS = 60;
const LEASE_RENEWAL_MS = 20_000;

export type AdminOperationEntity = {
  partitionKey: string;
  rowKey: string;
  kind: string;
  label: string;
  status: string;
  total: number;
  processed: number;
  succeeded: number;
  failedCount: number;
  createdAt: string;
  startedAt: string;
  finishedAt: string;
  error: string;
  resultJson: string;
  failedJson: string;
  createdNamesJson: string;
  detail: string;
};

export interface OperationLease {
  assertActive(): void;
  release(): Promise<void>;
}

export interface AdminOperationStorage {
  create(entity: AdminOperationEntity): Promise<void>;
  replace(entity: AdminOperationEntity): Promise<void>;
  get(partitionKey: string, rowKey: string): Promise<AdminOperationEntity | undefined>;
  list(partitionKey: string): Promise<AdminOperationEntity[]>;
  delete(partitionKey: string, rowKey: string): Promise<void>;
  acquireLease(name: string): Promise<OperationLease | null>;
}

export class RecoveringWriteQueue {
  private writes = Promise.resolve();

  constructor(private readonly onError: (error: unknown) => void = () => undefined) {}

  enqueue(write: () => Promise<void>): void {
    this.writes = this.writes.catch((error: unknown) => this.onError(error)).then(write);
  }

  async drain(): Promise<void> {
    await this.writes;
  }
}

function statusCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("statusCode" in error && typeof error.statusCode === "number") return error.statusCode;
  if ("status" in error && typeof error.status === "number") return error.status;
  return undefined;
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function accountName(): string {
  return requiredEnvironment("AZURE_STORAGE_ACCOUNT_NAME");
}

function tableEndpoint(): string {
  return (
    process.env.AZURE_STORAGE_TABLE_ENDPOINT?.trim() ||
    `https://${accountName()}.table.core.windows.net`
  );
}

function blobEndpoint(): string {
  return (
    process.env.AZURE_STORAGE_BLOB_ENDPOINT?.trim() ||
    `https://${accountName()}.blob.core.windows.net`
  );
}

function tableName(): string {
  return process.env.AZURE_ADMIN_OPERATION_TABLE_NAME?.trim() || DEFAULT_TABLE_NAME;
}

function leaseContainerName(): string {
  return process.env.AZURE_ADMIN_LEASE_CONTAINER_NAME?.trim() || DEFAULT_LEASE_CONTAINER_NAME;
}

class RenewableBlobLease implements OperationLease {
  private renewalTimer: NodeJS.Timeout | undefined;
  private renewalInProgress = false;
  private lostError: Error | undefined;

  constructor(private readonly client: BlobLeaseClient) {
    this.renewalTimer = setInterval(() => void this.renew(), LEASE_RENEWAL_MS);
    this.renewalTimer.unref();
  }

  private async renew(): Promise<void> {
    if (this.renewalInProgress || this.lostError) return;
    this.renewalInProgress = true;
    try {
      await this.client.renewLease();
    } catch (error: unknown) {
      this.lostError = new Error(
        `The distributed operation lease was lost: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
      if (this.renewalTimer) clearInterval(this.renewalTimer);
    } finally {
      this.renewalInProgress = false;
    }
  }

  assertActive(): void {
    if (this.lostError) throw this.lostError;
  }

  async release(): Promise<void> {
    if (this.renewalTimer) clearInterval(this.renewalTimer);
    this.renewalTimer = undefined;
    if (this.lostError) return;
    try {
      await this.client.releaseLease();
    } catch (error: unknown) {
      if (statusCode(error) !== 409 && statusCode(error) !== 412) throw error;
    }
  }
}

class AzureAdminOperationStorage implements AdminOperationStorage {
  private readonly credential = new DefaultAzureCredential();
  private tableClient: TableClient | undefined;
  private tableReady: Promise<void> | undefined;
  private blobServiceClient: BlobServiceClient | undefined;
  private leaseContainerReady: Promise<void> | undefined;

  private getTableClient(): TableClient {
    if (!this.tableClient) {
      this.tableClient = new TableClient(tableEndpoint(), tableName(), this.credential);
    }
    return this.tableClient;
  }

  private async ensureTable(): Promise<void> {
    if (!this.tableReady) {
      this.tableReady = new TableServiceClient(tableEndpoint(), this.credential)
        .createTable(tableName())
        .catch((error: unknown) => {
          this.tableReady = undefined;
          throw error;
        });
    }
    await this.tableReady;
  }

  private getBlobServiceClient(): BlobServiceClient {
    if (!this.blobServiceClient) {
      this.blobServiceClient = new BlobServiceClient(blobEndpoint(), this.credential);
    }
    return this.blobServiceClient;
  }

  private async getLeaseBlob(name: string): Promise<BlockBlobClient> {
    const container = this.getBlobServiceClient().getContainerClient(leaseContainerName());
    if (!this.leaseContainerReady) {
      this.leaseContainerReady = container
        .createIfNotExists()
        .then(() => undefined)
        .catch((error: unknown) => {
          this.leaseContainerReady = undefined;
          throw error;
        });
    }
    await this.leaseContainerReady;
    const blob = container.getBlockBlobClient(`${name}.lock`);
    try {
      await blob.upload("", 0, { conditions: { ifNoneMatch: "*" } });
    } catch (error: unknown) {
      if (statusCode(error) !== 409 && statusCode(error) !== 412) throw error;
    }
    return blob;
  }

  async create(entity: AdminOperationEntity): Promise<void> {
    await this.ensureTable();
    await this.getTableClient().createEntity(entity);
  }

  async replace(entity: AdminOperationEntity): Promise<void> {
    await this.ensureTable();
    await this.getTableClient().upsertEntity(entity, "Replace");
  }

  async get(partitionKey: string, rowKey: string): Promise<AdminOperationEntity | undefined> {
    await this.ensureTable();
    try {
      return await this.getTableClient().getEntity<AdminOperationEntity>(partitionKey, rowKey);
    } catch (error: unknown) {
      if (statusCode(error) === 404) return undefined;
      throw error;
    }
  }

  async list(partitionKey: string): Promise<AdminOperationEntity[]> {
    await this.ensureTable();
    const entities: AdminOperationEntity[] = [];
    for await (const entity of this.getTableClient().listEntities<AdminOperationEntity>({
      queryOptions: { filter: `PartitionKey eq '${partitionKey}'` },
    })) {
      entities.push(entity as TableEntityResult<AdminOperationEntity>);
    }
    return entities;
  }

  async delete(partitionKey: string, rowKey: string): Promise<void> {
    await this.ensureTable();
    try {
      await this.getTableClient().deleteEntity(partitionKey, rowKey);
    } catch (error: unknown) {
      if (statusCode(error) !== 404) throw error;
    }
  }

  async acquireLease(name: string): Promise<OperationLease | null> {
    const blob = await this.getLeaseBlob(name);
    const leaseClient = blob.getBlobLeaseClient(randomUUID());
    try {
      await leaseClient.acquireLease(LEASE_DURATION_SECONDS);
      return new RenewableBlobLease(leaseClient);
    } catch (error: unknown) {
      if (statusCode(error) === 409 || statusCode(error) === 412) return null;
      throw error;
    }
  }
}

let testStorage: AdminOperationStorage | undefined;
let azureStorage: AdminOperationStorage | undefined;

export function getAdminOperationStorage(): AdminOperationStorage {
  if (testStorage) return testStorage;
  azureStorage ??= new AzureAdminOperationStorage();
  return azureStorage;
}

export function setAdminOperationStorageForTests(storage?: AdminOperationStorage): void {
  testStorage = storage;
}
