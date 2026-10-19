import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const phase=process.argv[2] ?? 'initial';
const groups={initial:['202610190000_live_schema_baseline','202610190001_security_hardening','202610190002_atomic_workflows'],queries:['202610190003_scoped_query_summaries'],postdeploy:['202610190004_contact_privacy','202610190005_admin_mfa']};
if (!(phase in groups)) throw new Error('Choose initial, queries, or postdeploy.');
const names=groups[phase];
let sql=`-- One transaction; the recovered baseline is recorded, not executed over live data.\nBEGIN;\nSET LOCAL lock_timeout='5s';\nSET LOCAL statement_timeout='30s';\nCREATE SCHEMA IF NOT EXISTS supabase_migrations;\nCREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations(version text PRIMARY KEY, statements text[], name text);\nALTER TABLE supabase_migrations.schema_migrations ENABLE ROW LEVEL SECURITY;\nREVOKE ALL ON SCHEMA supabase_migrations FROM PUBLIC,anon,authenticated;\nREVOKE ALL ON ALL TABLES IN SCHEMA supabase_migrations FROM PUBLIC,anon,authenticated;\n`;
const hashes={};
for (const [index,name] of names.entries()) {
  const source=await readFile(`supabase/migrations/${name}.sql`,'utf8');
  const hash=createHash('sha256').update(source).digest('hex'); hashes[name]=hash;
  const [version,...label]=name.split('_');
  if (phase!=='initial' || index>0) sql+=source.replace(/^BEGIN;\s*|\s*COMMIT;\s*$/gm,'')+'\n';
  const delimiter=`$wm_${hash.slice(0,12)}$`;
  sql+=`INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES ('${version}','${label.join('_')}',ARRAY[${delimiter}${source}${delimiter}]);\n`;
}
sql+=`SELECT json_build_object('result','authorization repair applied','version',version(),
 'protected_tables',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity),
 'anon_quote_view',has_table_privilege('anon','public.vendor_latest_quotes','SELECT'),
 'anon_truncate_vendors',has_table_privilege('anon','public.vendors','TRUNCATE'),
 'auth_truncate_rfqs',has_table_privilege('authenticated','public.rfqs','TRUNCATE'),
 'auth_schema_create',has_schema_privilege('authenticated','public','CREATE'),
 'migrations',(SELECT json_agg(version ORDER BY version) FROM supabase_migrations.schema_migrations)) AS verification;\nCOMMIT;\n`;
const suffix=phase==='initial'?'':`-${phase}`;
await writeFile(`docs/audit-2026-10-19/apply-database-remediation${suffix}.sql`,sql);
await writeFile(`docs/audit-2026-10-19/database-remediation-hashes${suffix}.json`,JSON.stringify(hashes,null,2)+'\n');
console.log('Prepared one-transaction migration and source hashes. Baseline will only be recorded.');
