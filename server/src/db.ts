import { Pool } from 'pg';

// Single shared pool for the lifetime of the Express process.
// dotenv is loaded by index.ts before this module is imported.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
});
