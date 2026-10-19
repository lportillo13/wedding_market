-- Apply after the admin enrollment/challenge UI has been deployed.
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
