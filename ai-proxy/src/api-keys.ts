import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { ProxyDatabase } from "./db.js";

export interface AuthenticatedApiKey {
  id: string;
  userId: string;
  prefix: string;
}

interface ApiKeyRow {
  id: string;
  user_id: string;
  key_prefix: string;
}

export function hashApiKey(secret: string, pepper: string): string {
  return createHash("sha256")
    .update(`${pepper}:${secret}`, "utf8")
    .digest("hex");
}

export function createApiKey(
  db: ProxyDatabase,
  userId: string,
  pepper: string,
) {
  const secret = `ars_${randomBytes(32).toString("base64url")}`;
  const prefix = secret.slice(0, 12);
  const now = new Date().toISOString();
  const id = randomUUID();

  db.transaction(() => {
    db.prepare(
      "UPDATE proxy_api_key SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
    ).run(now, userId);
    db.prepare(
      `INSERT INTO proxy_api_key (id, user_id, key_prefix, secret_hash, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(id, userId, prefix, hashApiKey(secret, pepper), now);
  }).immediate();

  return { secret, prefix, createdAt: now };
}

export function authenticateApiKey(
  db: ProxyDatabase,
  secret: string,
  pepper: string,
): AuthenticatedApiKey | null {
  const row = db
    .prepare(
      `SELECT id, user_id, key_prefix
       FROM proxy_api_key
       WHERE secret_hash = ? AND revoked_at IS NULL`,
    )
    .get(hashApiKey(secret, pepper)) as ApiKeyRow | undefined;

  if (!row) return null;
  db.prepare("UPDATE proxy_api_key SET last_used_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    row.id,
  );
  return { id: row.id, userId: row.user_id, prefix: row.key_prefix };
}

export function getActiveApiKey(db: ProxyDatabase, userId: string) {
  return db
    .prepare(
      `SELECT key_prefix AS prefix, created_at AS createdAt, last_used_at AS lastUsedAt
       FROM proxy_api_key WHERE user_id = ? AND revoked_at IS NULL`,
    )
    .get(userId) as
    | { prefix: string; createdAt: string; lastUsedAt: string | null }
    | undefined;
}
