-- One transaction; the recovered baseline is recorded, not executed over live data.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations(version text PRIMARY KEY, statements text[], name text);
ALTER TABLE supabase_migrations.schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON SCHEMA supabase_migrations FROM PUBLIC,anon,authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA supabase_migrations FROM PUBLIC,anon,authenticated;
-- Apply after deploying readers that use rfqs_visible (migration 003).
-- The base table remains writable by the request owner. Invited vendor reads
-- use the security-barrier projection, which masks contact fields until consent.
DROP POLICY IF EXISTS rfqs_vendor_select ON public.rfqs;
NOTIFY pgrst,'reload schema';
INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES ('202610190004','contact_privacy',ARRAY[$wm_454e2cacaf99$-- Apply after deploying readers that use rfqs_visible (migration 003).
-- The base table remains writable by the request owner. Invited vendor reads
-- use the security-barrier projection, which masks contact fields until consent.
BEGIN;
DROP POLICY IF EXISTS rfqs_vendor_select ON public.rfqs;
NOTIFY pgrst,'reload schema';
COMMIT;
$wm_454e2cacaf99$]);
-- Apply after the admin enrollment/challenge UI has been deployed.
CREATE FUNCTION public.wm_admin_mfa_ok() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin')
  OR coalesce(auth.jwt()->>'aal','')='aal2';
$$;
REVOKE ALL ON FUNCTION public.wm_admin_mfa_ok() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wm_admin_mfa_ok() TO authenticated;
-- Keep the current user's own profile readable for the enrollment screen.
-- An admin at AAL1 cannot use the ordinary admin policy to read other profiles.
CREATE POLICY wm_admin_mfa_required ON public.profiles AS RESTRICTIVE FOR ALL TO authenticated
 USING (id=auth.uid() OR (SELECT public.wm_admin_mfa_ok()))
 WITH CHECK (id=auth.uid() OR (SELECT public.wm_admin_mfa_ok()));
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename<>'profiles' LOOP
  EXECUTE format('CREATE POLICY wm_admin_mfa_required ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.wm_admin_mfa_ok())) WITH CHECK ((SELECT public.wm_admin_mfa_ok()))',t.tablename);
 END LOOP;
END $$;
NOTIFY pgrst,'reload schema';
INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES ('202610190005','admin_mfa',ARRAY[$wm_7500a2e476be$-- Apply after the admin enrollment/challenge UI has been deployed.
BEGIN;
CREATE FUNCTION public.wm_admin_mfa_ok() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin')
  OR coalesce(auth.jwt()->>'aal','')='aal2';
$$;
REVOKE ALL ON FUNCTION public.wm_admin_mfa_ok() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wm_admin_mfa_ok() TO authenticated;
-- Keep the current user's own profile readable for the enrollment screen.
-- An admin at AAL1 cannot use the ordinary admin policy to read other profiles.
CREATE POLICY wm_admin_mfa_required ON public.profiles AS RESTRICTIVE FOR ALL TO authenticated
 USING (id=auth.uid() OR (SELECT public.wm_admin_mfa_ok()))
 WITH CHECK (id=auth.uid() OR (SELECT public.wm_admin_mfa_ok()));
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename<>'profiles' LOOP
  EXECUTE format('CREATE POLICY wm_admin_mfa_required ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.wm_admin_mfa_ok())) WITH CHECK ((SELECT public.wm_admin_mfa_ok()))',t.tablename);
 END LOOP;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
$wm_7500a2e476be$]);
SELECT json_build_object('result','authorization repair applied','version',version(),
 'protected_tables',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity),
 'anon_quote_view',has_table_privilege('anon','public.vendor_latest_quotes','SELECT'),
 'anon_truncate_vendors',has_table_privilege('anon','public.vendors','TRUNCATE'),
 'auth_truncate_rfqs',has_table_privilege('authenticated','public.rfqs','TRUNCATE'),
 'auth_schema_create',has_schema_privilege('authenticated','public','CREATE'),
 'migrations',(SELECT json_agg(version ORDER BY version) FROM supabase_migrations.schema_migrations)) AS verification;
COMMIT;
