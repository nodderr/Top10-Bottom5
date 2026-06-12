#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
// Simple forward-only migration runner.
// - Reads server/migrations/*.sql in lexicographic order
// - Tracks applied filenames in public.schema_migrations
// - Each migration runs in a single transaction; failure rolls back cleanly
//
// Usage:
//   cd server && npm run migrate
//   (or) node scripts/migrate.js

const path = require('node:path');
const fs = require('node:fs/promises');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Add it to server/.env');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });

  try {
    await pool.query(`
      create table if not exists public.schema_migrations (
        id          text primary key,
        applied_at  timestamptz not null default now()
      )
    `);

    const files = (await fs.readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    const { rows } = await pool.query('select id from public.schema_migrations');
    const applied = new Set(rows.map((r) => r.id));

    let ranAny = false;
    for (const file of files) {
      const id = file.replace(/\.sql$/, '');
      if (applied.has(id)) {
        console.log(`  skip    ${id}`);
        continue;
      }

      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      const client = await pool.connect();
      try {
        await client.query('begin');
        await client.query(sql);
        await client.query(
          'insert into public.schema_migrations (id) values ($1)',
          [id]
        );
        await client.query('commit');
        console.log(`  applied ${id}`);
        ranAny = true;
      } catch (err) {
        await client.query('rollback');
        console.error(`  failed  ${id}`);
        throw err;
      } finally {
        client.release();
      }
    }

    if (!ranAny) console.log('All migrations already applied.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
