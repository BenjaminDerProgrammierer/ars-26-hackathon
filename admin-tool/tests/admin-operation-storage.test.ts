import assert from "node:assert/strict";
import test from "node:test";
import type { BlobLeaseClient } from "@azure/storage-blob";
import { RenewableBlobLease } from "../src/lib/admin-operation-storage.js";

function waitForAbort(signal: AbortSignal, timeoutMs = 500): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Lease did not abort within ${timeoutMs}ms`)),
      timeoutMs,
    );
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}

test("a hung renewal cannot keep a locally expired lease active", async () => {
  let renewalStarted: (() => void) | undefined;
  const started = new Promise<void>((resolve) => {
    renewalStarted = resolve;
  });
  const client = {
    renewLease: async ({ abortSignal }: { abortSignal?: AbortSignal }) => {
      renewalStarted?.();
      await new Promise<void>((_resolve, reject) => {
        abortSignal?.addEventListener("abort", () => reject(abortSignal.reason), { once: true });
      });
    },
    releaseLease: async () => undefined,
  } as unknown as BlobLeaseClient;
  const lease = new RenewableBlobLease(client, { durationMs: 40, renewalMs: 5 });

  const aborted = waitForAbort(lease.signal);
  await started;
  await aborted;

  assert.equal(lease.signal.aborted, true);
  assert.throws(() => lease.assertActive(), /expired before renewal was confirmed/);
  await lease.release();
});

test("a late renewal response cannot resurrect an expired lease", async () => {
  let finishRenewal: (() => void) | undefined;
  const client = {
    renewLease: () => new Promise<void>((resolve) => (finishRenewal = resolve)),
    releaseLease: async () => undefined,
  } as unknown as BlobLeaseClient;
  const lease = new RenewableBlobLease(client, { durationMs: 30, renewalMs: 5 });

  await new Promise((resolve) => setTimeout(resolve, 45));
  finishRenewal?.();
  await new Promise<void>((resolve) => setImmediate(resolve));

  assert.equal(lease.signal.aborted, true);
  assert.throws(() => lease.assertActive(), /expired before renewal was confirmed/);
  await lease.release();
});
