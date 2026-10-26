import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createLocalSchema } from './local-schema.mjs';
import { URL } from 'node:url';
import console from 'node:console';

const { db, migrations } = await createLocalSchema();
try {
  const queries = {
    relations: `SELECT c.relname AS name,c.relkind AS kind,c.relrowsecurity AS rls,c.reloptions AS options FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','v','m','p') ORDER BY c.relname`,
    columns: `SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position`,
    constraints: `SELECT c.relname AS relation,con.conname AS name,con.contype AS type,pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' ORDER BY c.relname,con.conname`,
    indexes: `SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname`,
    unindexedForeignKeys: `SELECT c.relname AS relation,con.conname AS name,pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND con.contype='f' AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid=con.conrelid AND i.indisvalid AND i.indpred IS NULL AND ARRAY(SELECT key FROM unnest(i.indkey) WITH ORDINALITY AS keys(key,position) WHERE position<=cardinality(con.conkey) ORDER BY position)=con.conkey) ORDER BY c.relname,con.conname`,
    policies: `SELECT tablename,policyname,permissive,roles,cmd FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname`,
    functions: `SELECT p.proname AS name,p.prosecdef AS security_definer,p.proconfig AS settings,pg_get_function_identity_arguments(p.oid) AS arguments FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' ORDER BY p.proname`,
  };
  const report = { checkedAt: new Date().toISOString(), source: 'Disposable replay of repository migrations; not a live production inspection', migrations };
  for (const [name, sql] of Object.entries(queries)) report[name] = (await db.query(sql)).rows;
  const catalog = (await db.query(await readFile(new URL('./catalog.sql', import.meta.url), 'utf8'))).rows[0].catalog;
  await mkdir(new URL('../../.cache/restructure-2026-10-26/', import.meta.url), { recursive: true });
  await writeFile(new URL('../../.cache/restructure-2026-10-26/database-structure.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  await writeFile(new URL('../../.cache/restructure-2026-10-26/local-database-catalog.json', import.meta.url), JSON.stringify(catalog, null, 2) + '\n');
  console.log(JSON.stringify({ migrations: migrations.length, relations: report.relations.length, indexes: report.indexes.length, policies: report.policies.length, unindexedForeignKeys: report.unindexedForeignKeys }, null, 2));
} finally { await db.close(); }
