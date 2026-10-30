-- The website checks one address before collecting the rest of a signup.
-- Only the server's existing service role can execute this boolean lookup.
CREATE OR REPLACE FUNCTION public.wm_signup_email_exists(p_email text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog
SET statement_timeout = '3s'
AS $$
BEGIN
  IF p_email IS NULL OR length(btrim(p_email)) NOT BETWEEN 3 AND 254 THEN
    RAISE EXCEPTION 'Invalid email address' USING ERRCODE = '22023';
  END IF;
  RETURN EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(btrim(p_email)));
END;
$$;
REVOKE ALL ON FUNCTION public.wm_signup_email_exists(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wm_signup_email_exists(text) TO service_role;
