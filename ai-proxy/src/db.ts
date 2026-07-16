import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type ProxyDatabase = Database.Database;

export function initializeProxySchema(db: ProxyDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS budget_account (
      user_id TEXT PRIMARY KEY,
      limit_nano_usd INTEGER NOT NULL,
      spent_nano_usd INTEGER NOT NULL DEFAULT 0,
      reserved_nano_usd INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_reset_at TEXT
    );

    CREATE TABLE IF NOT EXISTS proxy_api_key (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      secret_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      last_used_at TEXT,
      revoked_at TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS proxy_api_key_one_active_per_user
      ON proxy_api_key(user_id) WHERE revoked_at IS NULL;
    CREATE INDEX IF NOT EXISTS proxy_api_key_user_id ON proxy_api_key(user_id);

    CREATE TABLE IF NOT EXISTS usage_event (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      api_key_id TEXT NOT NULL,
      model TEXT NOT NULL,
      status TEXT NOT NULL,
      reserved_nano_usd INTEGER NOT NULL,
      actual_nano_usd INTEGER,
      prompt_tokens INTEGER,
      completion_tokens INTEGER,
      provider_generation_id TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      error_code TEXT
    );

    CREATE INDEX IF NOT EXISTS usage_event_user_created
      ON usage_event(user_id, created_at DESC);
  `);
}

export function createDatabase(filename: string): ProxyDatabase {
  if (filename !== ":memory:") {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }

  const db = new Database(filename);
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  if (filename !== ":memory:") db.pragma("journal_mode = WAL");
  initializeProxySchema(db);
  return db;
}
