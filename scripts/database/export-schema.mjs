import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import console from 'node:console';
import pg from 'pg';
import nextEnv from '@next/env';
import { databaseConnectionOptions } from './connection.mjs';

nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) throw new Error('Configure SUPABASE_DB_URL privately before exporting schema metadata.');
const schemas = (process.env.SUPABASE_SCHEMAS || 'public').split(',').map(name => name.trim()).filter(Boolean);
if (!schemas.length || schemas.some(name => !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name))) throw new Error('Invalid schema selection.');
const ca = process.env.SUPABASE_DB_CA_FILE ? await readFile(process.env.SUPABASE_DB_CA_FILE, 'utf8') : undefined;
const client = new pg.Client(databaseConnectionOptions(connectionString, { ca, tlsOverride: process.env.NODE_TLS_REJECT_UNAUTHORIZED }));
const output = path.resolve(process.argv[2] || 'schema/supabase-schema.json');
try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  const { rows: tables } = await client.query(`SELECT c.relname AS name,c.relkind AS kind,n.nspname AS schema,obj_description(c.oid,'pg_class') AS comment FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=ANY($1) AND c.relkind IN ('r','p','v','m','f') ORDER BY n.nspname,c.relname`, [schemas]);
  const snapshot = {};
  for (const table of tables) {
    snapshot[table.schema] ??= {};
    snapshot[table.schema][table.name] = { kind: table.kind, comment: table.comment, columns: [], constraints: [], indexes: [] };
  }
  const { rows: columns } = await client.query(`SELECT n.nspname AS schema,c.relname AS relation,a.attname AS name,a.attnum AS position,format_type(a.atttypid,a.atttypmod) AS type,NOT a.attnotnull AS nullable,pg_get_expr(d.adbin,d.adrelid) AS default,col_description(c.oid,a.attnum) AS comment FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE n.nspname=ANY($1) AND a.attnum>0 AND NOT a.attisdropped ORDER BY n.nspname,c.relname,a.attnum`, [schemas]);
  for (const { schema, relation, ...column } of columns) snapshot[schema]?.[relation]?.columns.push(column);
  const { rows: constraints } = await client.query(`SELECT n.nspname AS schema,c.relname AS relation,con.conname AS name,con.contype AS type,pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=ANY($1) ORDER BY n.nspname,c.relname,con.conname`, [schemas]);
  for (const { schema, relation, ...constraint } of constraints) snapshot[schema]?.[relation]?.constraints.push(constraint);
  const { rows: indexes } = await client.query(`SELECT schemaname AS schema,tablename AS relation,indexname AS name,indexdef AS definition FROM pg_indexes WHERE schemaname=ANY($1) ORDER BY schemaname,tablename,indexname`, [schemas]);
  for (const { schema, relation, ...index } of indexes) snapshot[schema]?.[relation]?.indexes.push(index);
  await client.query('ROLLBACK');
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Read-only schema metadata exported for ${tables.length} relations.`);
} catch (error) {
  console.error(`Schema export failed (${typeof error.code === 'string' ? error.code : 'connection-or-query-error'}). Verify the private connection and trusted CA configuration.`);
  process.exitCode = 1;
} finally { await client.end(); }
