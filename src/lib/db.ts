import { Pool } from 'pg';

// Reuse a single Pool across hot reloads in dev. In prod (Vercel serverless),
// each isolated function gets its own — that's fine; the Neon pooler handles
// connection multiplexing on its side.
const globalForPg = globalThis as unknown as { __pgPool?: Pool };

export const pool: Pool =
  globalForPg.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPg.__pgPool = pool;
}
