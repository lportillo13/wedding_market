#!/usr/bin/env node
/**
 * scripts/generate-supabase-schema-pg.mjs
 * Usage:
 *   node scripts/generate-supabase-schema-pg.mjs [outputPath]
 *
 * Env:
 *   SUPABASE_DB_URL = postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres?sslmode=require
 *   SUPABASE_SCHEMAS (optional, comma-separated; default: "public")
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import pg from 'pg';

// --- tiny dotenv loader for .env.local then .env (no deps) ---
async function loadEnvFile(filePath) {
  const contents = await readFile(filePath, 'utf8');
  const loaded = [];
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const decl = line.startsWith('export ') ? line.slice(7).trim() : line;
    const i = decl.indexOf('=');
    if (i === -1) continue;
    const key = decl.slice(0, i).trim();
    let val = decl.slice(i + 1).trim();
    if (!key) continue;

    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
        .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
        .replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    } else {
      const commentIndex = val.search(/\s+#/);
      if (commentIndex !== -1) val = val.slice(0, commentIndex);
      val = val.replace(/\\ /g, ' ').trim();
    }

    if (process.env[key] === undefined) {
      process.env[key] = val;
      loaded.push(key);
    }
  }
  return loaded;
}

async function loadEnvFiles() {
  const files = ['.env.local', '.env'];
  const summaries = [];
  for (const f of files) {
    const p = resolve(process.cwd(), f);
    if (!existsSync(p)) continue;
    try {
      const keys = await loadEnvFile(p);
      if (keys.length) summaries.push(`${f} (${keys.join(', ')})`);
    } catch (e) {
      console.warn(`Unable to read ${f}:`, e?.message ?? e);
    }
  }
  if (summaries.length) console.info(`Loaded environment variables from: ${summaries.join('; ')}`);
}
await loadEnvFiles();

// --- inputs ---
const dbUrl = process.env.SUPABASE_DB_URL;
const schemaList = (process.env.SUPABASE_SCHEMAS || process.env.SUPABASE_SCHEMA || 'public')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL. Get it from Supabase → Settings → Database → Connection Info (URI).');
  process.exit(1);
}
if (schemaList.length === 0) {
  console.error('No schemas provided to inspect.');
  process.exit(1);
}

const outputPath = resolve(process.cwd(), process.argv[2] || 'schema/supabase-schema.json');

// --- connect ---
const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false } // Supabase requires SSL
});
await client.connect();

const params = schemaList.map((_, i) => `$${i + 1}`).join(', ');

// tables/views
const { rows: tables } = await client.query(
  `select n.nspname as schema,
          c.relname as name,
          c.relkind as kind,          -- r=table, p=partitioned, v=view, m=matview, f=foreign
          obj_description(c.oid, 'pg_class') as comment
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where c.relkind in ('r','p','v','m','f')
     and n.nspname in (${params})
   order by n.nspname, c.relname`,
  schemaList
);

// columns
const { rows: columns } = await client.query(
  `select n.nspname as schema,
          c.relname as table_name,
          a.attname as name,
          a.attnum as ordinal_position,
          pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
          not a.attnotnull as is_nullable,
          pg_get_expr(ad.adbin, ad.adrelid) as default_value,
          col_description(c.oid, a.attnum) as comment
   from pg_attribute a
   join pg_class c on a.attrelid = c.oid
   join pg_namespace n on n.oid = c.relnamespace
   left join pg_attrdef ad on ad.adrelid = a.attrelid and ad.adnum = a.attnum
   where a.attnum > 0 and not a.attisdropped
     and c.relkind in ('r','p','v','m','f')
     and n.nspname in (${params})
   order by n.nspname, c.relname, a.attnum`,
  schemaList
);

// constraints
const { rows: constraints } = await client.query(
  `select n.nspname as schema,
          c.relname as table_name,
          con.conname as name,
          con.contype as type,     -- p=primary, u=unique, f=foreign, c=check, x=exclusion
          pg_get_constraintdef(con.oid) as definition
   from pg_constraint con
   join pg_class c on c.oid = con.conrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname in (${params})
   order by n.nspname, c.relname, con.conname`,
  schemaList
);

// indexes
const { rows: indexes } = await client.query(
  `select n.nspname as schema,
          t.relname as table_name,
          i.relname as name,
          pg_get_indexdef(ix.indexrelid) as definition
   from pg_index ix
   join pg_class t on t.oid = ix.indrelid
   join pg_class i on i.oid = ix.indexrelid
   join pg_namespace n on n.oid = t.relnamespace
   where n.nspname in (${params})
   order by n.nspname, t.relname, i.relname`,
  schemaList
);

await client.end();

// assemble
const map = {};
for (const t of tables) {
  map[t.schema] ??= {};
  map[t.schema][t.name] = {
    kind: t.kind,
    comment: t.comment ?? null,
    columns: [],
    constraints: [],
    indexes: []
  };
}
for (const col of columns) {
  const tbl = map[col.schema]?.[col.table_name];
  if (!tbl) continue;
  tbl.columns.push({
    name: col.name,
    position: Number(col.ordinal_position),
    type: col.data_type,
    nullable: !!col.is_nullable,
    default: col.default_value,
    comment: col.comment ?? null
  });
}
for (const con of constraints) {
  const tbl = map[con.schema]?.[con.table_name];
  if (!tbl) continue;
  tbl.constraints.push({ name: con.name, type: con.type, definition: con.definition });
}
for (const idx of indexes) {
  const tbl = map[idx.schema]?.[idx.table_name];
  if (!tbl) continue;
  tbl.indexes.push({ name: idx.name, definition: idx.definition });
}
for (const s of Object.keys(map)) {
  for (const t of Object.keys(map[s])) {
    map[s][t].columns.sort((a, b) => a.position - b.position);
  }
}

// write
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(map, null, 2));
console.log(\`Supabase schema written to \${outputPath}\`);
