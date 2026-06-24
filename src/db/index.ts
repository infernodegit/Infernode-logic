import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Provision the Replit PostgreSQL database first.",
  );
}

const globalForDb = globalThis as unknown as { __infernodePool?: Pool };

export const pool =
  globalForDb.__infernodePool ??
  new Pool({ connectionString, max: 5 });

if (!globalForDb.__infernodePool) {
  globalForDb.__infernodePool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };
