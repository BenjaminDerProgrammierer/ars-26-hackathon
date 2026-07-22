import { execFile } from "node:child_process";
import { randomInt, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { ComputeManagementClient, type VirtualMachine } from "@azure/arm-compute";
import { NetworkManagementClient } from "@azure/arm-network";
import { TableClient, type TableEntityResult, TableServiceClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import {
  type AdminOperationEntity,
  getAdminOperationStorage,
  type OperationLease,
} from "./admin-operation-storage.js";
import { createApiKeys, deleteApiKey } from "./openrouter.js";

const LOCATION = "austriaeast";
const RESOURCE_GROUP = "ArsElectronicaHackathon";
const TABLE_PARTITION = "LOGIN";
const DEFAULT_TABLE_NAME = "DevelopmentEnvironmentLogins";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789._-+=";
const ADMIN_USERNAME = "student";
const VNET_NAME = "vcenv-vnet";
const SUBNET_NAME = "vcenv-subnet";
const BOOTSTRAP_TEMPLATE = fileURLToPath(new URL("../../cloud-init/bootstrap.sh", import.meta.url));
const DEVELOPMENT_ENVIRONMENT_TEMPLATE = fileURLToPath(
  new URL("../../../infra/modules/development-environment.bicep", import.meta.url),
);
const OPERATION_PARTITION = "DEV_ENVIRONMENT";
const OPERATION_LEASE = "dev-environments";
const execFileAsync = promisify(execFile);

type EnvironmentProperties = {
  ordinal: number;
  codeServerUrl: string;
  codeServerPassword: string;
  devUrl: string;
  publicHost: string;
  sshHost: string;
  sshUser: string;
  sshPassword: string;
  status: string;
  provisioningState: string;
  image: string;
  loginText: string;
  createdAt: Date;
  updatedAt: Date;
  redeemCode?: string;
  openRouterKeyHash?: string;
};

export type DevEnvironment = {
  name: string;
  ordinal: number;
  codeServerUrl: string;
  codeServerPassword: string;
  devUrl: string;
  publicHost: string;
  sshHost: string;
  sshUser: string;
  sshPassword: string;
  status: string;
  provisioningState: string;
  image: string;
  loginText: string;
  createdAt: string;
  updatedAt: string;
  redeemCode: string | null;
  etag: string;
};

export type StartDeploymentRequest = {
  count: number;
  apiKeyLimit: number | null;
  apiKeyExpiresAt?: Date;
};

export type StartDeploymentInput = StartDeploymentRequest & { modelId: string };

export type EnvironmentBulkAction = "start" | "stop" | "delete";
export type EnvironmentOperationStatus = "running" | "completed" | "partial" | "failed";

export type EnvironmentOperation = {
  id: string;
  kind: "create" | EnvironmentBulkAction;
  label: string;
  status: EnvironmentOperationStatus;
  total: number;
  processed: number;
  succeeded: number;
  failed: Array<{ name: string; error: string }>;
  createdNames: string[];
  detail: string;
  startedAt: string;
  finishedAt: string | null;
};

export class EnvironmentOperationConflictError extends Error {
  readonly statusCode = 409;
}

let credential: DefaultAzureCredential | undefined;
let computeClient: ComputeManagementClient | undefined;
let networkClient: NetworkManagementClient | undefined;
let tableClient: TableClient | undefined;
let tableReady: Promise<void> | undefined;
let activeOperation: EnvironmentOperation | null = null;
let operationWrites = Promise.resolve();

function serializeOperation(operation: EnvironmentOperation): AdminOperationEntity {
  return {
    partitionKey: OPERATION_PARTITION,
    rowKey: operation.id,
    kind: operation.kind,
    label: operation.label,
    status: operation.status,
    total: operation.total,
    processed: operation.processed,
    succeeded: operation.succeeded,
    failedCount: operation.failed.length,
    createdAt: operation.startedAt,
    startedAt: operation.startedAt,
    finishedAt: operation.finishedAt ?? "",
    error: "",
    resultJson: "",
    failedJson: JSON.stringify(operation.failed),
    createdNamesJson: JSON.stringify(operation.createdNames),
    detail: operation.detail,
  };
}

function deserializeOperation(entity: AdminOperationEntity): EnvironmentOperation {
  return {
    id: entity.rowKey,
    kind: entity.kind as EnvironmentOperation["kind"],
    label: entity.label,
    status: entity.status as EnvironmentOperationStatus,
    total: entity.total,
    processed: entity.processed,
    succeeded: entity.succeeded,
    failed: entity.failedJson
      ? (JSON.parse(entity.failedJson) as Array<{ name: string; error: string }>)
      : [],
    createdNames: entity.createdNamesJson ? (JSON.parse(entity.createdNamesJson) as string[]) : [],
    detail: entity.detail,
    startedAt: entity.startedAt,
    finishedAt: entity.finishedAt || null,
  };
}

function persistActiveOperation(): void {
  if (!activeOperation) return;
  const entity = serializeOperation(activeOperation);
  operationWrites = operationWrites.then(() => getAdminOperationStorage().replace(entity));
}

function setOperationDetail(detail: string): void {
  if (activeOperation?.status === "running") {
    activeOperation.detail = detail;
    persistActiveOperation();
  }
}

async function runOperationStage<T>(detail: string, action: () => Promise<T>): Promise<T> {
  setOperationDetail(detail);
  try {
    return await action();
  } catch (error: unknown) {
    throw new Error(`${detail}: ${errorMessage(error)}`, { cause: error });
  }
}

function getCredential(): DefaultAzureCredential {
  if (!credential) credential = new DefaultAzureCredential();
  return credential;
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function tableEndpoint(): string {
  return (
    process.env.AZURE_STORAGE_TABLE_ENDPOINT?.trim() ||
    `https://${requiredEnvironment("AZURE_STORAGE_ACCOUNT_NAME")}.table.core.windows.net`
  );
}

function tableName(): string {
  return process.env.AZURE_DEV_ENVIRONMENT_TABLE_NAME?.trim() || DEFAULT_TABLE_NAME;
}

function getComputeClient(): ComputeManagementClient {
  if (!computeClient) {
    computeClient = new ComputeManagementClient(
      getCredential(),
      requiredEnvironment("AZURE_SUBSCRIPTION_ID"),
    );
  }
  return computeClient;
}

function getNetworkClient(): NetworkManagementClient {
  if (!networkClient) {
    networkClient = new NetworkManagementClient(
      getCredential(),
      requiredEnvironment("AZURE_SUBSCRIPTION_ID"),
    );
  }
  return networkClient;
}

function getTableClient(): TableClient {
  if (!tableClient) {
    tableClient = new TableClient(tableEndpoint(), tableName(), getCredential());
  }
  return tableClient;
}

async function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = new TableServiceClient(tableEndpoint(), getCredential())
      .createTable(tableName())
      .catch((error: unknown) => {
        tableReady = undefined;
        throw error;
      });
  }
  await tableReady;
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function toDevEnvironment(entity: TableEntityResult<EnvironmentProperties>): DevEnvironment {
  if (!entity.rowKey) throw new Error("Development environment login is missing its row key");
  return {
    name: entity.rowKey,
    ordinal: entity.ordinal,
    codeServerUrl: entity.codeServerUrl,
    codeServerPassword: entity.codeServerPassword,
    devUrl: entity.devUrl,
    publicHost: entity.publicHost,
    sshHost: entity.sshHost,
    sshUser: entity.sshUser,
    sshPassword: entity.sshPassword,
    status: entity.status,
    provisioningState: entity.provisioningState,
    image: entity.image,
    loginText: entity.loginText,
    createdAt: asDate(entity.createdAt).toISOString(),
    updatedAt: asDate(entity.updatedAt).toISOString(),
    redeemCode: entity.redeemCode ?? null,
    etag: entity.etag,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function azureStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("statusCode" in error)) return undefined;
  return typeof error.statusCode === "number" ? error.statusCode : undefined;
}

function generatePassword(length = 16): string {
  const characters = ["A", "a", "2", "."];
  while (characters.length < length) {
    characters.push(PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]);
  }
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }
  return characters.join("");
}

function generateEnvironmentName(ordinal: number): string {
  const timestamp = Date.now().toString(36);
  const suffix = randomInt(36 ** 4)
    .toString(36)
    .padStart(4, "0");
  return `vcenv-${timestamp}-${suffix}-${ordinal}`;
}

export function formatStudentLoginText(input: {
  ordinal: number;
  name: string;
  codeServerUrl: string;
  password: string;
  devUrl: string;
  sshHost?: string;
}): string {
  return [
    "===================  STUDENT LOGINS  ===================",
    "",
    `Environment ${input.ordinal}  (${input.name})`,
    `  Code Server (HTTPS) : ${input.codeServerUrl}`,
    `  Password            : ${input.password}`,
    `  Dev server (HTTP)   : ${input.devUrl}`,
    ...(input.sshHost
      ? [`  SSH                 : ssh ${ADMIN_USERNAME}@${input.sshHost}   (same password)`]
      : []),
    "",
    "========================================================",
  ].join("\n");
}

export function validateStartDeploymentInput(value: unknown): StartDeploymentRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Request body must be a JSON object");
  }
  const body = value as Record<string, unknown>;
  if (!Number.isInteger(body.count) || (body.count as number) < 1 || (body.count as number) > 45) {
    throw new Error("Environment count must be an integer between 1 and 45");
  }
  let apiKeyLimit: number | null = null;
  if (body.apiKeyLimit !== undefined && body.apiKeyLimit !== null && body.apiKeyLimit !== "") {
    if (typeof body.apiKeyLimit !== "number" || !Number.isFinite(body.apiKeyLimit)) {
      throw new Error("API key spending limit must be a non-negative number or null");
    }
    if (body.apiKeyLimit < 0) {
      throw new Error("API key spending limit must be a non-negative number or null");
    }
    apiKeyLimit = body.apiKeyLimit;
  }

  let apiKeyExpiresAt: Date | undefined;
  if (
    body.apiKeyExpiresAt !== undefined &&
    body.apiKeyExpiresAt !== null &&
    body.apiKeyExpiresAt !== ""
  ) {
    if (typeof body.apiKeyExpiresAt !== "string") {
      throw new Error("API key expiration must be an ISO 8601 timestamp");
    }
    apiKeyExpiresAt = new Date(body.apiKeyExpiresAt);
    if (Number.isNaN(apiKeyExpiresAt.valueOf()) || apiKeyExpiresAt <= new Date()) {
      throw new Error("API key expiration must be in the future");
    }
  }

  return {
    count: body.count as number,
    apiKeyLimit,
    ...(apiKeyExpiresAt ? { apiKeyExpiresAt } : {}),
  };
}

export function validateEnvironmentNames(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("At least one development environment is required");
  }
  if (value.length > 100) throw new Error("Bulk operations are limited to 100 environments");
  const names = value.map((name) => {
    if (typeof name !== "string" || !/^vcenv-[a-z0-9-]{1,56}$/.test(name)) {
      throw new Error("Invalid development environment name");
    }
    return name;
  });
  return [...new Set(names)];
}

export function validateBulkAction(value: unknown): EnvironmentBulkAction {
  if (value !== "start" && value !== "stop" && value !== "delete") {
    throw new Error("Action must be start, stop, or delete");
  }
  return value;
}

function developmentEnvironmentSubnetId(): string {
  const subscriptionId = requiredEnvironment("AZURE_SUBSCRIPTION_ID");
  return `/subscriptions/${subscriptionId}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Network/virtualNetworks/${VNET_NAME}/subnets/${SUBNET_NAME}`;
}

export function developmentEnvironmentDeploymentParameters(input: {
  name: string;
  password: string;
  provisioningCommand: string;
  subnetResourceId: string;
}): Record<string, { value: unknown }> {
  return {
    name: { value: input.name },
    location: { value: LOCATION },
    adminUsername: { value: ADMIN_USERNAME },
    adminPassword: { value: input.password },
    subnetResourceId: { value: input.subnetResourceId },
    provisioningCommand: { value: input.provisioningCommand },
    tags: { value: { managedBy: "ars-hackathon-admin", environment: input.name } },
  };
}

async function deployDevelopmentEnvironment(input: {
  name: string;
  password: string;
  provisioningCommand: string;
  subnetResourceId: string;
}): Promise<void> {
  const parameterDirectory = await mkdtemp(join(tmpdir(), "vcenv-deployment-"));
  const parameterFile = join(parameterDirectory, "parameters.json");
  try {
    await writeFile(
      parameterFile,
      JSON.stringify({
        $schema:
          "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
        contentVersion: "1.0.0.0",
        parameters: developmentEnvironmentDeploymentParameters(input),
      }),
      { encoding: "utf8", mode: 0o600 },
    );
    await execFileAsync(
      "az",
      [
        "deployment",
        "group",
        "create",
        "--name",
        `vm-${input.name}`,
        "--resource-group",
        RESOURCE_GROUP,
        "--template-file",
        DEVELOPMENT_ENVIRONMENT_TEMPLATE,
        "--parameters",
        `@${parameterFile}`,
        "--only-show-errors",
        "--output",
        "none",
      ],
      { maxBuffer: 4 * 1024 * 1024 },
    );
  } finally {
    await rm(parameterDirectory, { recursive: true, force: true });
  }
}

function escapeSingleQuotedShellValue(value: string): string {
  return value.replaceAll("'", "'\\''");
}

function renderOpenRouterConfiguration(apiKey: string, modelId: string): string {
  const auth = Buffer.from(
    `${JSON.stringify({ openrouter: { type: "api_key", key: apiKey } }, null, 2)}\n`,
  ).toString("base64");
  const settings = Buffer.from(
    `${JSON.stringify({ defaultProvider: "openrouter", defaultModel: modelId }, null, 2)}\n`,
  ).toString("base64");
  return [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    `pi_agent_dir=/home/${ADMIN_USERNAME}/.pi/agent`,
    `install -d -m 0700 -o "${ADMIN_USERNAME}" -g "${ADMIN_USERNAME}" "$pi_agent_dir"`,
    `printf '%s' '${auth}' | base64 -d > "$pi_agent_dir/auth.json"`,
    `printf '%s' '${settings}' | base64 -d > "$pi_agent_dir/settings.json"`,
    'rm -f "$pi_agent_dir/models.json"',
    `chown -R "${ADMIN_USERNAME}:${ADMIN_USERNAME}" "$pi_agent_dir"`,
    'chmod 0600 "$pi_agent_dir/auth.json"',
    "",
  ].join("\n");
}

async function renderProvisioningCommand(
  input: StartDeploymentInput,
  password: string,
  fqdn: string,
  apiKey: string,
) {
  const placeholder = (name: string) => `\${${name}}`;
  const replacements = new Map([
    [placeholder("VC_STUDENT_USER"), ADMIN_USERNAME],
    [placeholder("VC_STUDENT_PASSWORD"), password],
    [placeholder("VC_LLM_BASE_URL"), OPENROUTER_BASE_URL],
    [placeholder("VC_LLM_API_KEY"), apiKey],
    [placeholder("VC_LLM_MODEL_ID"), input.modelId],
    [placeholder("VC_LLM_MODEL_NAME"), input.modelId],
    [placeholder("VC_FQDN"), fqdn],
  ]);
  let bootstrap = await readFile(BOOTSTRAP_TEMPLATE, "utf8");
  for (const [placeholder, value] of replacements) {
    bootstrap = bootstrap.replaceAll(placeholder, escapeSingleQuotedShellValue(value));
  }
  const provisioningScript = `${bootstrap}\n${renderOpenRouterConfiguration(apiKey, input.modelId)}`;
  const encodedProvisioningScript = Buffer.from(provisioningScript).toString("base64");
  const command = `install -d -m 0700 /opt/vcenv && printf '%s' '${encodedProvisioningScript}' | base64 -d > /opt/vcenv/provision.sh && chmod 0700 /opt/vcenv/provision.sh && /opt/vcenv/provision.sh`;
  if (Buffer.byteLength(command) > 256 * 1024) {
    throw new Error("Rendered provisioning command exceeds the VM extension's 256 KB limit");
  }
  return command;
}

async function provisionEnvironment(
  input: StartDeploymentInput,
  ordinal: number,
  name: string,
  password: string,
  apiKey: string,
  openRouterKeyHash: string,
): Promise<DevEnvironment> {
  await runOperationStage("Preparing the development environment login table", ensureTable);
  const subnetId = developmentEnvironmentSubnetId();
  const publicHost = `${name}.${LOCATION}.cloudapp.azure.com`;
  const provisioningCommand = await renderProvisioningCommand(input, password, publicHost, apiKey);
  const network = getNetworkClient();
  await runOperationStage(`Deploying the Ubuntu virtual machine ${name}`, () =>
    deployDevelopmentEnvironment({
      name,
      password,
      provisioningCommand,
      subnetResourceId: subnetId,
    }),
  );
  const publicIp = await runOperationStage(`Reading the public IP for ${name}`, () =>
    network.publicIPAddresses.get(RESOURCE_GROUP, `${name}-pip`),
  );

  const resolvedHost = publicIp.dnsSettings?.fqdn || publicHost;
  const resolvedCodeUrl = `https://${resolvedHost}/`;
  const resolvedDevUrl = `http://${resolvedHost}:8080/`;
  const sshHost = publicIp.ipAddress || resolvedHost;
  const now = new Date();
  const entity = {
    partitionKey: TABLE_PARTITION,
    rowKey: name,
    ordinal,
    codeServerUrl: resolvedCodeUrl,
    codeServerPassword: password,
    devUrl: resolvedDevUrl,
    publicHost: resolvedHost,
    sshHost,
    sshUser: ADMIN_USERNAME,
    sshPassword: password,
    status: "Starting",
    provisioningState: "Succeeded",
    image: "Ubuntu 24.04 LTS",
    loginText: formatStudentLoginText({
      ordinal,
      name,
      codeServerUrl: resolvedCodeUrl,
      password,
      devUrl: resolvedDevUrl,
      sshHost,
    }),
    openRouterKeyHash,
    createdAt: now,
    updatedAt: now,
  };
  await runOperationStage(`Saving the student login for ${name}`, () =>
    getTableClient().upsertEntity(entity, "Replace"),
  );
  return toDevEnvironment(
    await getTableClient().getEntity<EnvironmentProperties>(TABLE_PARTITION, name),
  );
}

async function createEnvironment(
  input: StartDeploymentInput,
  ordinal: number,
): Promise<DevEnvironment> {
  const name = generateEnvironmentName(ordinal);
  const password = generatePassword();
  const result = await runOperationStage(`Creating the OpenRouter API key for ${name}`, () =>
    createApiKeys([
      {
        name: `Development environment ${name}`,
        limit: input.apiKeyLimit,
        ...(input.apiKeyExpiresAt ? { expiresAt: input.apiKeyExpiresAt } : {}),
      },
    ]),
  );
  const openRouterKey = result.created[0];
  if (!openRouterKey) throw new Error(`OpenRouter did not return an API key for ${name}`);

  try {
    return await provisionEnvironment(
      input,
      ordinal,
      name,
      password,
      openRouterKey.key,
      openRouterKey.data.hash,
    );
  } catch (error: unknown) {
    try {
      await deleteApiKey(openRouterKey.data.hash);
    } catch (cleanupError: unknown) {
      throw new Error(
        `${errorMessage(error)}. The unused OpenRouter key could not be removed: ${errorMessage(cleanupError)}`,
        { cause: error },
      );
    }
    throw error;
  }
}

async function refreshEnvironmentStates(environments: DevEnvironment[]): Promise<DevEnvironment[]> {
  const virtualMachines = new Map<string, VirtualMachine>();
  for await (const virtualMachine of getComputeClient().virtualMachines.list(RESOURCE_GROUP)) {
    if (virtualMachine.name && virtualMachine.tags?.managedBy === "ars-hackathon-admin") {
      virtualMachines.set(virtualMachine.name, virtualMachine);
    }
  }

  return Promise.all(
    environments.map(async (environment) => {
      const virtualMachine = virtualMachines.get(environment.name);
      let status = "Missing";
      const provisioningState = virtualMachine?.provisioningState || "Missing";
      if (virtualMachine) {
        const instanceView = await getComputeClient().virtualMachines.instanceView(
          RESOURCE_GROUP,
          environment.name,
        );
        const powerState = instanceView.statuses?.find(({ code }) =>
          code?.startsWith("PowerState/"),
        );
        status = powerState?.displayStatus?.replace(/^VM /, "") || "Unknown";
      }
      if (status !== environment.status || provisioningState !== environment.provisioningState) {
        await getTableClient().updateEntity(
          {
            partitionKey: TABLE_PARTITION,
            rowKey: environment.name,
            status,
            provisioningState,
            updatedAt: new Date(),
          },
          "Merge",
          { etag: "*" },
        );
        return { ...environment, status, provisioningState, updatedAt: new Date().toISOString() };
      }
      return environment;
    }),
  );
}

export async function listDevEnvironments(
  options: { refresh?: boolean } = {},
): Promise<DevEnvironment[]> {
  await ensureTable();
  const environments: DevEnvironment[] = [];
  for await (const entity of getTableClient().listEntities<EnvironmentProperties>({
    queryOptions: { filter: `PartitionKey eq '${TABLE_PARTITION}'` },
  })) {
    environments.push(toDevEnvironment(entity));
  }
  environments.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  return options.refresh ? refreshEnvironmentStates(environments) : environments;
}

export async function getDevEnvironments(names: string[]): Promise<DevEnvironment[]> {
  await ensureTable();
  return Promise.all(
    names.map(async (name) => {
      try {
        return toDevEnvironment(
          await getTableClient().getEntity<EnvironmentProperties>(TABLE_PARTITION, name),
        );
      } catch (error: unknown) {
        if (azureStatus(error) === 404)
          throw new Error(`Development environment ${name} not found`);
        throw error;
      }
    }),
  );
}

export async function setEnvironmentRedeemCode(name: string, code: string): Promise<void> {
  await ensureTable();
  await getTableClient().updateEntity(
    {
      partitionKey: TABLE_PARTITION,
      rowKey: name,
      redeemCode: code,
      updatedAt: new Date(),
    },
    "Merge",
    { etag: "*" },
  );
}

async function runEnvironmentAction(name: string, action: EnvironmentBulkAction): Promise<null> {
  const virtualMachines = getComputeClient().virtualMachines;
  if (action === "start") {
    await runOperationStage(`Starting ${name}`, () =>
      virtualMachines.beginStartAndWait(RESOURCE_GROUP, name),
    );
    await getTableClient().updateEntity(
      { partitionKey: TABLE_PARTITION, rowKey: name, status: "Running", updatedAt: new Date() },
      "Merge",
      { etag: "*" },
    );
    return null;
  }
  if (action === "stop") {
    await runOperationStage(`Deallocating ${name}`, () =>
      virtualMachines.beginDeallocateAndWait(RESOURCE_GROUP, name),
    );
    await getTableClient().updateEntity(
      {
        partitionKey: TABLE_PARTITION,
        rowKey: name,
        status: "Deallocated",
        updatedAt: new Date(),
      },
      "Merge",
      { etag: "*" },
    );
    return null;
  }
  const environmentEntity = await getTableClient().getEntity<EnvironmentProperties>(
    TABLE_PARTITION,
    name,
  );
  setOperationDetail(`Deleting the virtual machine ${name}`);
  try {
    await virtualMachines.beginDeleteAndWait(RESOURCE_GROUP, name);
  } catch (error: unknown) {
    if (azureStatus(error) !== 404) throw error;
  }
  for (const [kind, deleteResource] of [
    [
      "network interface",
      () => getNetworkClient().networkInterfaces.beginDeleteAndWait(RESOURCE_GROUP, `${name}-nic`),
    ],
    [
      "public IP",
      () => getNetworkClient().publicIPAddresses.beginDeleteAndWait(RESOURCE_GROUP, `${name}-pip`),
    ],
  ] as const) {
    try {
      await deleteResource();
    } catch (error: unknown) {
      if (azureStatus(error) !== 404) {
        throw new Error(`Failed to delete ${kind} for ${name}: ${errorMessage(error)}`);
      }
    }
  }
  if (environmentEntity.openRouterKeyHash) {
    try {
      await deleteApiKey(environmentEntity.openRouterKeyHash);
    } catch (error: unknown) {
      if (azureStatus(error) !== 404) throw error;
    }
  }
  await getTableClient().deleteEntity(TABLE_PARTITION, name);
  return null;
}

function operationSnapshot(): EnvironmentOperation | null {
  return activeOperation
    ? {
        ...activeOperation,
        failed: [...activeOperation.failed],
        createdNames: [...activeOperation.createdNames],
      }
    : null;
}

async function latestStoredOperation(): Promise<EnvironmentOperation | null> {
  const operations = (await getAdminOperationStorage().list(OPERATION_PARTITION))
    .map(deserializeOperation)
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt));
  const latest = operations[0];
  const running = operations.filter(({ status }) => status === "running");
  if (running.length === 0) return latest ?? null;

  const lease = await getAdminOperationStorage().acquireLease(OPERATION_LEASE);
  if (!lease) return latest;
  try {
    await markOperationsInterrupted(running);
    return latest ?? null;
  } finally {
    await lease.release();
  }
}

async function markOperationsInterrupted(operations: EnvironmentOperation[]): Promise<void> {
  for (const operation of operations) {
    operation.status = "failed";
    operation.detail = "The server stopped before the operation finished";
    operation.failed.push({ name: "operation", error: operation.detail });
    operation.finishedAt = new Date().toISOString();
    await getAdminOperationStorage().replace(serializeOperation(operation));
  }
}

async function runConcurrent<T>(
  items: T[],
  execute: (item: T, index: number) => Promise<string | null>,
  lease: OperationLease,
): Promise<void> {
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < items.length) {
      lease.assertActive();
      const index = nextIndex;
      nextIndex += 1;
      const item = items[index];
      try {
        const createdName = await execute(item, index);
        if (createdName) activeOperation?.createdNames.push(createdName);
        if (activeOperation) activeOperation.succeeded += 1;
      } catch (error: unknown) {
        activeOperation?.failed.push({ name: String(item), error: errorMessage(error) });
      } finally {
        if (activeOperation) activeOperation.processed += 1;
        persistActiveOperation();
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(5, items.length) }, worker));
}

async function startOperation(
  kind: EnvironmentOperation["kind"],
  label: string,
  items: string[],
  execute: (item: string, index: number) => Promise<string | null>,
): Promise<EnvironmentOperation> {
  const lease = await getAdminOperationStorage().acquireLease(OPERATION_LEASE);
  if (!lease) {
    throw new EnvironmentOperationConflictError(
      "A development environment operation is already running",
    );
  }
  try {
    const abandoned = (await getAdminOperationStorage().list(OPERATION_PARTITION))
      .map(deserializeOperation)
      .filter(({ status }) => status === "running");
    await markOperationsInterrupted(abandoned);
    activeOperation = {
      id: randomUUID(),
      kind,
      label,
      status: "running",
      total: items.length,
      processed: 0,
      succeeded: 0,
      failed: [],
      createdNames: [],
      detail: "Waiting to start",
      startedAt: new Date().toISOString(),
      finishedAt: null,
    };
    await getAdminOperationStorage().create(serializeOperation(activeOperation));
  } catch (error: unknown) {
    activeOperation = null;
    await lease.release();
    throw error;
  }
  queueMicrotask(() => {
    void (async () => {
      try {
        await runConcurrent(items, execute, lease);
        if (!activeOperation) return;
        lease.assertActive();
        activeOperation.status =
          activeOperation.failed.length === 0
            ? "completed"
            : activeOperation.succeeded === 0
              ? "failed"
              : "partial";
        activeOperation.detail =
          activeOperation.status === "completed"
            ? "Operation completed"
            : "Operation completed with provisioning errors";
      } catch (error: unknown) {
        if (!activeOperation) return;
        activeOperation.failed.push({ name: "operation", error: errorMessage(error) });
        activeOperation.status = "failed";
        activeOperation.detail = "Operation failed";
      } finally {
        if (activeOperation) {
          activeOperation.finishedAt = new Date().toISOString();
          persistActiveOperation();
        }
        try {
          await operationWrites;
        } finally {
          await lease.release();
          activeOperation = null;
        }
      }
    })().catch((error: unknown) => {
      console.error(`Failed to persist development environment operation "${label}":`, error);
    });
  });
  return operationSnapshot() as EnvironmentOperation;
}

export async function startDevEnvironmentCreation(
  input: StartDeploymentInput,
): Promise<EnvironmentOperation> {
  requiredEnvironment("AZURE_SUBSCRIPTION_ID");
  requiredEnvironment("AZURE_STORAGE_ACCOUNT_NAME");
  if (!(process.env.OPENROUTER_MANAGEMENT_KEY || process.env.OPENROUTER_API_KEY)?.trim()) {
    throw new Error("OPENROUTER_MANAGEMENT_KEY is not set");
  }
  const ordinals = Array.from({ length: input.count }, (_, index) => String(index + 1));
  return startOperation(
    "create",
    `Creating ${input.count} development environment${input.count === 1 ? "" : "s"}`,
    ordinals,
    async (ordinal) => (await createEnvironment(input, Number(ordinal))).name,
  );
}

export async function startDevEnvironmentBulkAction(
  names: string[],
  action: EnvironmentBulkAction,
): Promise<EnvironmentOperation> {
  requiredEnvironment("AZURE_SUBSCRIPTION_ID");
  requiredEnvironment("AZURE_STORAGE_ACCOUNT_NAME");
  const labels = { start: "Starting", stop: "Stopping", delete: "Deleting" };
  return startOperation(
    action,
    `${labels[action]} ${names.length} development environment${names.length === 1 ? "" : "s"}`,
    names,
    (name) => runEnvironmentAction(name, action),
  );
}

export async function getDevEnvironmentContext(): Promise<{
  location: string;
  resourceGroup: string;
  tableName: string;
  accountName: string | null;
  subscriptionName: string | null;
  image: string | null;
  configured: boolean;
  operation: EnvironmentOperation | null;
}> {
  return {
    location: LOCATION,
    resourceGroup: RESOURCE_GROUP,
    tableName: tableName(),
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim() || null,
    subscriptionName: process.env.AZURE_SUBSCRIPTION_NAME?.trim() || null,
    image: "Ubuntu 24.04 LTS",
    configured: Boolean(
      process.env.AZURE_SUBSCRIPTION_ID?.trim() &&
        process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim() &&
        (process.env.OPENROUTER_MANAGEMENT_KEY?.trim() || process.env.OPENROUTER_API_KEY?.trim()),
    ),
    operation: await latestStoredOperation(),
  };
}
