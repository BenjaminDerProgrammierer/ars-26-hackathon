import assert from "node:assert/strict";
import test from "node:test";
import { TableClient, TableServiceClient } from "@azure/data-tables";
import {
  type AdminOperationEntity,
  type AdminOperationStorage,
  RecoveringWriteQueue,
  setAdminOperationStorageForTests,
} from "../src/lib/admin-operation-storage.js";
import {
  clearCompletedDevEnvironmentOperations,
  developmentEnvironmentDeploymentArguments,
  developmentEnvironmentDeploymentParameters,
  EnvironmentRedeemConflictError,
  formatStudentLoginText,
  setEnvironmentRedeemCode,
  validateBulkAction,
  validateEnvironmentNames,
  validateStartDeploymentInput,
} from "../src/lib/dev-environments.js";

function operationEntity(id: string, status: string): AdminOperationEntity {
  return {
    partitionKey: "DEV_ENVIRONMENT",
    rowKey: id,
    kind: "create",
    label: `Operation ${id}`,
    status,
    total: 1,
    processed: status === "running" ? 0 : 1,
    succeeded: status === "completed" ? 1 : 0,
    failedCount: status === "failed" ? 1 : 0,
    createdAt: "2026-07-22T10:00:00.000Z",
    startedAt: "2026-07-22T10:00:00.000Z",
    finishedAt: status === "running" ? "" : "2026-07-22T10:01:00.000Z",
    error: "",
    resultJson: "",
    failedJson: "[]",
    createdNamesJson: "[]",
    detail: "",
  };
}

test("maps a development environment to Bicep deployment parameters", () => {
  assert.deepEqual(
    developmentEnvironmentDeploymentParameters({
      name: "vcenv-example-1",
      password: "secret",
      provisioningCommand: "/opt/vcenv/provision.sh",
      subnetResourceId: "/subscriptions/example/subnets/vcenv-subnet",
    }),
    {
      name: { value: "vcenv-example-1" },
      location: { value: "austriaeast" },
      adminUsername: { value: "student" },
      adminPassword: { value: "secret" },
      subnetResourceId: { value: "/subscriptions/example/subnets/vcenv-subnet" },
      provisioningCommand: { value: "/opt/vcenv/provision.sh" },
      tags: {
        value: {
          managedBy: "ars-hackathon-admin",
          environment: "vcenv-example-1",
        },
      },
    },
  );
});

test("pins Azure CLI deployments to the configured subscription", () => {
  const args = developmentEnvironmentDeploymentArguments(
    {
      name: "vcenv-example-1",
      parameterFile: "/tmp/parameters.json",
    },
    "subscription-id",
  );
  assert.deepEqual(args.slice(0, 9), [
    "deployment",
    "group",
    "create",
    "--name",
    "vm-vcenv-example-1",
    "--resource-group",
    "ArsElectronicaHackathon",
    "--subscription",
    "subscription-id",
  ]);
});

test("validates Azure virtual machine creation options", () => {
  assert.deepEqual(
    validateStartDeploymentInput({
      count: 12,
      apiKeyLimit: 5,
    }),
    {
      count: 12,
      apiKeyLimit: 5,
    },
  );
});

test("rejects unsupported deployment values", () => {
  assert.throws(
    () =>
      validateStartDeploymentInput({
        count: 46,
      }),
    /between 1 and 45/,
  );
  assert.throws(
    () =>
      validateStartDeploymentInput({
        count: 2,
        apiKeyExpiresAt: "2020-01-01T00:00:00.000Z",
      }),
    /expiration must be in the future/,
  );
  assert.throws(
    () =>
      validateStartDeploymentInput({
        count: 2,
        apiKeyLimit: -1,
      }),
    /non-negative/,
  );
});

test("formats redeem access using the student logins hand-out", () => {
  assert.equal(
    formatStudentLoginText({
      ordinal: 3,
      name: "vcenv-example-3",
      codeServerUrl: "https://example/",
      password: "secret",
      devUrl: "http://example:8080/",
      sshHost: "example",
    }),
    [
      "===================  STUDENT LOGINS  ===================",
      "",
      "Environment 3  (vcenv-example-3)",
      "  Code Server (HTTPS) : https://example/",
      "  Password            : secret",
      "  Dev server (HTTP)   : http://example:8080/",
      "  SSH                 : ssh student@example   (same password)",
      "",
      "========================================================",
    ].join("\n"),
  );
});

test("validates environment bulk actions", () => {
  assert.deepEqual(validateEnvironmentNames(["vcenv-example-1", "vcenv-example-1"]), [
    "vcenv-example-1",
  ]);
  assert.equal(validateBulkAction("stop"), "stop");
  assert.throws(() => validateBulkAction("restart"), /start, stop, or delete/);
});

test("uses optimistic concurrency when associating an environment redeem key", async (context) => {
  const previousAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  context.after(() => {
    if (previousAccountName === undefined) delete process.env.AZURE_STORAGE_ACCOUNT_NAME;
    else process.env.AZURE_STORAGE_ACCOUNT_NAME = previousAccountName;
  });
  process.env.AZURE_STORAGE_ACCOUNT_NAME = "testaccount";
  context.mock.method(TableServiceClient.prototype, "createTable", async () => undefined);
  const updates: unknown[] = [];
  context.mock.method(TableClient.prototype, "updateEntity", async (...args: unknown[]) => {
    updates.push(args);
    throw Object.assign(new Error("precondition failed"), { statusCode: 412 });
  });

  await assert.rejects(
    setEnvironmentRedeemCode("vcenv-example-1", "ABCD-EFGH-2345", 'W/"etag"'),
    EnvironmentRedeemConflictError,
  );
  assert.deepEqual((updates[0] as unknown[])[2], { etag: 'W/"etag"' });
});

test("continues queued persistence after a transient write failure", async () => {
  const errors: unknown[] = [];
  const writes: string[] = [];
  const queue = new RecoveringWriteQueue((error) => errors.push(error));
  queue.enqueue(async () => {
    throw new Error("temporary table failure");
  });
  queue.enqueue(async () => {
    writes.push("final state");
  });

  await queue.drain();
  assert.equal(errors.length, 1);
  assert.deepEqual(writes, ["final state"]);
});

test("clears completed development environment operations and keeps running ones", async () => {
  const entities = new Map(
    [
      operationEntity("completed", "completed"),
      operationEntity("partial", "partial"),
      operationEntity("failed", "failed"),
      operationEntity("running", "running"),
    ].map((entity) => [entity.rowKey, entity]),
  );
  const storage = {
    list: async (partitionKey: string) =>
      [...entities.values()].filter((entity) => entity.partitionKey === partitionKey),
    delete: async (_partitionKey: string, rowKey: string) => {
      entities.delete(rowKey);
    },
  } as AdminOperationStorage;
  setAdminOperationStorageForTests(storage);

  try {
    assert.equal(await clearCompletedDevEnvironmentOperations(), 3);
    assert.deepEqual([...entities.keys()], ["running"]);
  } finally {
    setAdminOperationStorageForTests();
  }
});
