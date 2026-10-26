import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { URL } from 'node:url';

/** Replays committed SQL into a disposable PostgreSQL engine; never connects to a service. */
export async function createLocalSchema() {
  const db = new PGlite({ extensions: { pg_trgm } });
  try {
    await db.exec(await readFile(new URL('../../supabase/tests/schema-baseline.sql', import.meta.url), 'utf8'));
    const directory = new URL('../../supabase/migrations/', import.meta.url);
    const migrations = (await readdir(directory)).filter(name => /^\d+_.*\.sql$/.test(name)).sort();
    if (new Set(migrations.map(name => name.split('_')[0])).size !== migrations.length) throw new Error('Duplicate migration version');
    for (const name of migrations) await db.exec(await readFile(new URL(name, directory), 'utf8'));
    return { db, migrations };
  } catch (error) {
    await db.close();
    throw error;
  }
}
