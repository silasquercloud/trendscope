import type { QueryConfig } from "pg";

import { authConfigured, providerConfigured } from "./auth-config";
import { getDB } from "./db";

type DatabaseStatus = { reachable: boolean; schemaReady: boolean };
let checkedAt = 0;
let check: Promise<DatabaseStatus> | undefined;

async function databaseStatus(): Promise<DatabaseStatus> {
  if (!process.env.DATABASE_URL) return { reachable: false, schemaReady: false };
  // Share a bounded check between requests; an anonymous status request must not
  // create an unbounded stream of database queries.
  if (!check || Date.now() - checkedAt > 15000) {
    checkedAt = Date.now();
    check = (async () => {
      try {
        const query = {
          text: `SELECT
            to_regclass('public."user"') IS NOT NULL AND
            to_regclass('public.session') IS NOT NULL AND
            to_regclass('public.account') IS NOT NULL AND
            to_regclass('public.verification') IS NOT NULL AND
            to_regclass('public."rateLimit"') IS NOT NULL AND
            to_regclass('public.creator_sync') IS NOT NULL AND
            to_regclass('public.creator_snapshot') IS NOT NULL AND
            to_regclass('public.creator_ai_usage') IS NOT NULL AS ready`,
          query_timeout: 5000,
        } satisfies QueryConfig & { query_timeout: number };
        const result = await getDB().query<{ ready: boolean }>(query);
        return { reachable: true, schemaReady: result.rows[0]?.ready === true };
      } catch {
        // Never return raw database errors, hosts, connection strings or credentials.
        return { reachable: false, schemaReady: false };
      }
    })();
  }
  return check;
}

export async function readiness() {
  const missingEnvironment = [
    !process.env.DATABASE_URL && "DATABASE_URL",
    !process.env.BETTER_AUTH_URL && "BETTER_AUTH_URL",
    (process.env.BETTER_AUTH_SECRET?.length ?? 0) < 32 && "BETTER_AUTH_SECRET",
  ].filter((name): name is string => Boolean(name));
  const database = { configured: Boolean(process.env.DATABASE_URL), ...(await databaseStatus()) };
  const providers = { google: providerConfigured("google"), tiktok: providerConfigured("tiktok") };
  return {
    readyForSignIn: authConfigured() && database.schemaReady && (providers.google || providers.tiktok),
    missingEnvironment,
    database,
    migrationsEnabled: process.env.RUN_DB_MIGRATIONS === "1",
    providers,
    aiConfigured: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL),
  };
}
