-- Schema-only fixture derived from live catalogs on 2026-10-19. No customer records.

CREATE ROLE anon NOLOGIN;

CREATE ROLE authenticated NOLOGIN;

CREATE ROLE service_role NOLOGIN BYPASSRLS;

CREATE ROLE supabase_auth_admin NOLOGIN;

CREATE SCHEMA auth;

CREATE SCHEMA extensions;

CREATE EXTENSION pg_trgm WITH SCHEMA public;

CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb DEFAULT '{}'::jsonb);

CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;

CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.role',true),'') $$;

CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT jsonb_build_object('sub',auth.uid(),'role',auth.role(),'aal',current_setting('request.jwt.claim.aal',true)) $$;

GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;

GRANT CREATE ON SCHEMA public TO authenticated,service_role;

GRANT ALL ON auth.users TO service_role,supabase_auth_admin;
