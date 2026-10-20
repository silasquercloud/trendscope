import { Pool } from "pg";

const globalDB = globalThis as unknown as { trendscopePool?: Pool };
export function getDB(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
  globalDB.trendscopePool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    // TLS is controlled by DATABASE_URL (sslmode=require/verify-full).
  });
  return globalDB.trendscopePool;
}
