import { getMigrations } from "better-auth/db/migration";

import { createAuth } from "../server/auth-config";
import { getDB } from "../server/db";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

async function migrate() {
  for (const path of [".env.local", ".env"]) if (existsSync(path)) loadEnvFile(path);
  const auth = createAuth();
  const migrations = await getMigrations(auth.options);
  await migrations.runMigrations();
  await getDB().query(`
    CREATE TABLE IF NOT EXISTS creator_ai_usage (
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      day date NOT NULL DEFAULT CURRENT_DATE,
      requests integer NOT NULL DEFAULT 0,
      last_request timestamptz NOT NULL DEFAULT NOW(),
      PRIMARY KEY(user_id, day)
    );
    CREATE TABLE IF NOT EXISTS creator_snapshot (
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      account_id text NOT NULL REFERENCES account(id) ON DELETE CASCADE,
      day date NOT NULL DEFAULT CURRENT_DATE,
      data jsonb NOT NULL,
      PRIMARY KEY(user_id, account_id, day)
    );
    CREATE TABLE IF NOT EXISTS creator_sync (
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      account_id text PRIMARY KEY REFERENCES account(id) ON DELETE CASCADE,
      data jsonb,
      status text NOT NULL DEFAULT 'connected',
      synced_at timestamptz,
      attempted_at timestamptz
    );
  `);
  console.log("Migrações aplicadas.");
  await getDB().end();
}
migrate().catch(() => {
  console.error("Falha na migração. Verifique conexão, permissões e esquema do PostgreSQL.");
  process.exitCode = 1;
});
