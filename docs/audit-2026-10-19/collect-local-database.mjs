import fs from 'node:fs';
import console from 'node:console';
import process from 'node:process';
import pg from 'pg';

process.loadEnvFile('.env.local');
const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  connectionTimeoutMillis: 5000,
  options: '-c default_transaction_read_only=on -c statement_timeout=10000',
});
const output = { collectedAt: new Date().toISOString(), scope: 'local database metadata only', checks: {} };
const queries = {
  identity: `select current_database() as database, version(), pg_is_in_recovery() as replica`,
  tables: `select n.nspname as schema,c.relname as name,c.relkind as kind,c.relrowsecurity as rls,c.relforcerowsecurity as force_rls,pg_total_relation_size(c.oid)::text as bytes,s.n_live_tup as estimated_rows from pg_class c join pg_namespace n on n.oid=c.relnamespace left join pg_stat_user_tables s on s.relid=c.oid where n.nspname='public' and c.relkind in ('r','p','m') order by c.relname`,
  policies: `select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname in ('public','storage') order by schemaname,tablename,policyname`,
  grants: `select table_schema,table_name,grantee,privilege_type from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated','PUBLIC') order by table_name,grantee,privilege_type`,
  columns: `select table_name,column_name,data_type from information_schema.columns where table_schema='public' order by table_name,ordinal_position`,
  indexes: `select schemaname,tablename,indexname,indexdef from pg_indexes where schemaname='public' order by tablename,indexname`,
  views: `select c.relname as name,c.reloptions,pg_get_viewdef(c.oid,true) as definition from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v' order by c.relname`,
  functions: `select p.proname,pg_get_function_identity_arguments(p.oid) as arguments,p.prosecdef as security_definer,p.proconfig,p.proacl,pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' order by p.proname`,
  triggers: `select c.relname as table_name,t.tgname,pg_get_triggerdef(t.oid,true) as definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal order by c.relname,t.tgname`,
  foreign_keys_without_index: `select con.conname,c.relname as table_name,pg_get_constraintdef(con.oid) as definition from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and con.contype='f' and not exists(select 1 from pg_index i where i.indrelid=con.conrelid and i.indisvalid and i.indpred is null and (i.indkey::smallint[])[0:cardinality(con.conkey)-1] @> con.conkey) order by c.relname,con.conname`,
};
try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  for (const [name,sql] of Object.entries(queries)) {
    try { output.checks[name] = (await client.query(sql)).rows; }
    catch (e) { output.checks[name] = { errorCode: e.code ?? null, error: String(e.message).replace(/postgres(?:ql)?:\/\/\S+/g,'[redacted]') }; break; }
  }
  await client.query('ROLLBACK');
} catch (e) {
  output.connectionError = { code:e.code ?? null, message: e.code==='ECONNREFUSED' ? 'Local database is not running or reachable.' : String(e.message).replace(/postgres(?:ql)?:\/\/\S+/g,'[redacted]') };
} finally { await client.end().catch(()=>{}); }
fs.writeFileSync('docs/audit-2026-10-19/local-database.json',JSON.stringify(output,null,2));
console.log(JSON.stringify({scope:output.scope,error:output.connectionError,checks:Object.fromEntries(Object.entries(output.checks).map(([k,v])=>[k,Array.isArray(v)?v.length:v]))},null,2));
