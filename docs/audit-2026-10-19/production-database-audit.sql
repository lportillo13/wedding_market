-- Metadata and aggregate statistics only. No customer rows, mutations, or EXPLAIN ANALYZE.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '10s';
SET LOCAL lock_timeout = '2s';

SELECT current_database(), current_setting('server_version') AS postgres_version,
       pg_database_size(current_database()) AS database_bytes;

SELECT n.nspname AS schema, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls,
       pg_total_relation_size(c.oid) AS total_bytes,
       s.n_live_tup AS estimated_live_rows, s.n_dead_tup AS estimated_dead_rows,
       s.last_autovacuum, s.last_autoanalyze
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
WHERE n.nspname IN ('public', 'storage') AND c.relkind IN ('r', 'p')
ORDER BY total_bytes DESC;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

SELECT table_schema, table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'PUBLIC')
ORDER BY table_name, grantee, privilege_type;

SELECT table_name, column_name, grantee, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'profiles'
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
ORDER BY grantee, column_name, privilege_type;

SELECT c.relname AS view_name, c.reloptions AS security_options,
       pg_get_viewdef(c.oid, TRUE) AS definition
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'v'
ORDER BY c.relname;

SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS arguments,
       p.prosecdef AS security_definer, p.proconfig AS function_settings,
       p.proacl AS explicit_grants
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f' ORDER BY p.proname;

SELECT c.relname AS table_name, t.tgname,
       pg_get_triggerdef(t.oid, TRUE) AS definition
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND NOT t.tgisinternal ORDER BY c.relname, t.tgname;

SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

SELECT con.conname, c.relname AS table_name, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND con.contype = 'f'
AND NOT EXISTS (
  SELECT 1 FROM pg_index i
  WHERE i.indrelid = con.conrelid AND i.indisvalid AND i.indpred IS NULL
  AND (i.indkey::smallint[])[0:cardinality(con.conkey)-1] @> con.conkey
)
ORDER BY c.relname, con.conname;

SELECT state, wait_event_type, COUNT(*) AS connections
FROM pg_stat_activity WHERE datname = current_database()
GROUP BY state, wait_event_type ORDER BY connections DESC;

SELECT datname, numbackends, xact_commit, xact_rollback, blks_read, blks_hit,
       temp_bytes, deadlocks, stats_reset
FROM pg_stat_database WHERE datname = current_database();

-- Fingerprints and counters avoid returning SQL text that might contain literals.
SELECT queryid, calls, total_exec_time, mean_exec_time, rows,
       shared_blks_read, shared_blks_hit, temp_blks_written
FROM extensions.pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 15;

ROLLBACK;
