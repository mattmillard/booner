// Applies db/migrations/*.sql in name order, each once, each in a transaction.
import { readdir, readFile } from 'node:fs/promises';
import { pool } from '../src/db.ts';

const dir = new URL('../../db/migrations/', import.meta.url);

await pool.query(
  'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
);
const applied = new Set((await pool.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));

for (const name of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()) {
  if (applied.has(name)) continue;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(await readFile(new URL(name, dir), 'utf8'));
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
    await client.query('COMMIT');
    console.log('applied', name);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
await pool.end();
