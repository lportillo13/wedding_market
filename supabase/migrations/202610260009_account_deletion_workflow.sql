BEGIN;
SET LOCAL lock_timeout='5s';

CREATE TABLE public.account_deletion_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE,
 contact_email text, language text NOT NULL DEFAULT 'en' CHECK(language IN ('en','es')),
 requested_at timestamptz NOT NULL DEFAULT now(), due_at timestamptz NOT NULL DEFAULT now()+interval '30 days',
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed')),
 completed_at timestamptz
);
CREATE INDEX account_deletions_due_idx ON public.account_deletion_requests(due_at) WHERE status<>'completed';
CREATE TABLE public.account_deletion_media (
 request_id uuid NOT NULL REFERENCES public.account_deletion_requests(id) ON DELETE CASCADE,
 owner_prefix text NOT NULL, done boolean NOT NULL DEFAULT false,
 PRIMARY KEY(request_id,owner_prefix)
);
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_media ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_deletion_requests,public.account_deletion_media FROM PUBLIC,anon,authenticated;
GRANT SELECT(id,user_id,language,requested_at,due_at,status,completed_at) ON public.account_deletion_requests TO authenticated;
GRANT SELECT ON public.account_deletion_media TO authenticated;
GRANT ALL ON public.account_deletion_requests,public.account_deletion_media TO service_role;
CREATE POLICY deletion_own_or_admin ON public.account_deletion_requests FOR SELECT TO authenticated
 USING(user_id=(SELECT auth.uid()) OR ((SELECT public.wm_is_admin()) AND (SELECT public.wm_admin_mfa_ok())));
CREATE POLICY deletion_media_admin ON public.account_deletion_media FOR SELECT TO authenticated
 USING((SELECT public.wm_is_admin()) AND (SELECT public.wm_admin_mfa_ok()));

CREATE FUNCTION public.request_account_deletion(p_language text DEFAULT 'en') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); result public.account_deletion_requests;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=uid) THEN
  RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';
 END IF;
 INSERT INTO public.account_deletion_requests(user_id,contact_email,language)
  SELECT uid,email,CASE WHEN p_language='es' THEN 'es' ELSE 'en' END FROM auth.users WHERE id=uid
  ON CONFLICT(user_id) DO NOTHING;
 SELECT * INTO STRICT result FROM public.account_deletion_requests WHERE user_id=uid;
 RETURN jsonb_build_object('id',result.id,'requestedAt',result.requested_at,'dueAt',result.due_at,'status',result.status);
END $$;
REVOKE ALL ON FUNCTION public.request_account_deletion(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_account_deletion(text) TO authenticated;

-- An unexpired JWT cannot recreate data after a profile is removed. Init-plan once per statement.
CREATE FUNCTION public.wm_account_exists() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid());
$$;
REVOKE ALL ON FUNCTION public.wm_account_exists() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wm_account_exists() TO authenticated;
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('account_deletion_requests','account_deletion_media') LOOP
  EXECUTE format('CREATE POLICY wm_existing_account_required ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.wm_account_exists())) WITH CHECK ((SELECT public.wm_account_exists()))',t.tablename);
 END LOOP;
END $$;

-- Only the server after an MFA admin approval may process a saved request.
-- Data and media-cleanup intent commit together; provider failures remain retryable.
CREATE FUNCTION public.purge_requested_account(p_request uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job public.account_deletion_requests; uid uuid;
BEGIN
 SELECT * INTO STRICT job FROM public.account_deletion_requests WHERE id=p_request FOR UPDATE;
 IF job.status='completed' THEN RETURN jsonb_build_object('alreadyCompleted',true); END IF;
 uid:=job.user_id;
 IF uid IS NULL THEN RAISE EXCEPTION 'Invalid deletion request'; END IF;
 IF EXISTS(SELECT 1 FROM public.profiles WHERE id=uid AND role='admin') AND
  (SELECT count(*) FROM public.profiles WHERE role='admin')<2 THEN
  RAISE EXCEPTION 'Appoint another administrator before removing the last administrator' USING ERRCODE='23514';
 END IF;
 INSERT INTO public.account_deletion_media(request_id,owner_prefix) VALUES
  (p_request,'clients/'||uid::text||'/'),(p_request,'vendors/'||uid::text||'/') ON CONFLICT DO NOTHING;
 UPDATE public.account_deletion_requests SET status='processing' WHERE id=p_request;
 -- Remove this client's inquiry data. Other clients' inquiries and other vendors' bookings survive.
 DELETE FROM public.rfqs WHERE owner_id=uid;
 -- Legacy pointers to this vendor's proposals otherwise prevent the vendor cascade.
 UPDATE public.rfqs SET accepted_quote_id=NULL,accepted_at=NULL WHERE accepted_quote_id IN (
  SELECT q.id FROM public.quotes q JOIN public.vendors v ON v.id=q.vendor_id WHERE v.owner_id=uid);
 DELETE FROM public.vendors WHERE owner_id=uid;
 DELETE FROM public.reviews WHERE author_id=uid;
 DELETE FROM public.profiles WHERE id=uid;
 RETURN jsonb_build_object('alreadyCompleted',false);
END $$;
REVOKE ALL ON FUNCTION public.purge_requested_account(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.purge_requested_account(uuid) TO service_role;

CREATE FUNCTION public.finish_account_deletion(p_request uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.account_deletion_media WHERE request_id=p_request AND NOT done) THEN
  RAISE EXCEPTION 'Media cleanup is incomplete';
 END IF;
 UPDATE public.account_deletion_requests SET status='completed',completed_at=now(),contact_email=NULL,user_id=NULL
  WHERE id=p_request AND status='processing';
 IF NOT FOUND THEN RAISE EXCEPTION 'Deletion is not processing'; END IF;
 DELETE FROM public.account_deletion_media WHERE request_id=p_request;
END $$;
REVOKE ALL ON FUNCTION public.finish_account_deletion(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_account_deletion(uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
