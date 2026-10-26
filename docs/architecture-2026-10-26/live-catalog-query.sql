-- Wedding Market structure audit: catalog metadata only; no customer rows or writes.
SELECT jsonb_build_object(
  'checked_at', now(),
  'database_version', current_setting('server_version'),
  'relations', (SELECT jsonb_agg(jsonb_build_object('name',c.relname,'kind',c.relkind,'rls',c.relrowsecurity,'options',c.reloptions) ORDER BY c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','v','m','p')),
  'indexes', (SELECT count(*) FROM pg_indexes WHERE schemaname='public'),
  'policies', (SELECT count(*) FROM pg_policies WHERE schemaname='public'),
  'migrations', (SELECT jsonb_agg(jsonb_build_object('version',version,'name',name,'sql_md5',md5(coalesce(array_to_string(statements,E'
'),''))) ORDER BY version) FROM supabase_migrations.schema_migrations),
  'foreign_key_gaps', (SELECT coalesce(jsonb_agg(jsonb_build_object('relation',c.relname,'name',con.conname,'definition',pg_get_constraintdef(con.oid)) ORDER BY c.relname,con.conname),'[]'::jsonb) FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND con.contype='f' AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid=con.conrelid AND i.indisvalid AND i.indpred IS NULL AND ARRAY(SELECT key FROM unnest(i.indkey) WITH ORDINALITY AS keys(key,position) WHERE position<=cardinality(con.conkey) ORDER BY position)=con.conkey)),
  'unprotected_anonymous_writes', (SELECT coalesce(jsonb_agg(c.relname),'[]'::jsonb) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity AND (has_table_privilege('anon',c.oid,'INSERT') OR has_table_privilege('anon',c.oid,'UPDATE') OR has_table_privilege('anon',c.oid,'DELETE'))),
  'definer_without_fixed_search_path', (SELECT coalesce(jsonb_agg(p.proname ORDER BY p.proname),'[]'::jsonb) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef AND NOT EXISTS(SELECT 1 FROM unnest(p.proconfig) option WHERE option LIKE 'search_path=%'))
) AS structure_audit;
