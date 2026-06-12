#!/usr/bin/env node
// One-off: lists schema_migrations + tables/views created by the auth_and_elo migration.
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const m = await pool.query('select id, applied_at from public.schema_migrations order by id');
    console.log('schema_migrations:');
    for (const r of m.rows) console.log(`  ${r.id}  applied_at=${r.applied_at.toISOString()}`);

    const t = await pool.query(`
      select table_name, table_type
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('users','sessions','elo_ratings','games','round_results','schema_migrations','leaderboard')
      order by table_type, table_name
    `);
    console.log('\npublic objects:');
    for (const r of t.rows) console.log(`  ${r.table_type.padEnd(10)} ${r.table_name}`);

    const i = await pool.query(`
      select indexname from pg_indexes
      where schemaname='public'
        and tablename in ('users','sessions','elo_ratings','games','round_results')
      order by tablename, indexname
    `);
    console.log('\nindexes:');
    for (const r of i.rows) console.log(`  ${r.indexname}`);
  } finally {
    await pool.end();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
