BEGIN;
SET LOCAL lock_timeout='5s';
-- Activate after the consent UI is live. Existing clients stay usable during deployment.
INSERT INTO public.site_settings(key,value) VALUES('community_rules_enforced','false'::jsonb) ON CONFLICT(key) DO NOTHING;
ALTER TABLE public.profiles ADD COLUMN suspended_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN community_terms_version text, ADD COLUMN community_terms_accepted_at timestamptz;
CREATE OR REPLACE FUNCTION public.wm_account_exists() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND suspended_at IS NULL);
$$;
CREATE FUNCTION public.accept_community_terms() RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 UPDATE public.profiles SET community_terms_version='2026-10-26',community_terms_accepted_at=now() WHERE id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Account required' USING ERRCODE='42501'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.accept_community_terms() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.accept_community_terms() TO authenticated;
CREATE TABLE public.user_blocks (
 blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(blocker_id,blocked_id),CHECK(blocker_id<>blocked_id)
);
CREATE INDEX user_blocks_reverse_idx ON public.user_blocks(blocked_id,blocker_id);
CREATE TABLE public.content_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reporter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('vendor','conversation')),target_id uuid NOT NULL,vendor_id uuid,
 reason text NOT NULL CHECK(reason IN ('spam','harassment','misleading','rights','other')),
 details text NOT NULL CHECK(length(details)<=2000),created_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz,resolution text CHECK(length(resolution)<=100),
 UNIQUE NULLS NOT DISTINCT(reporter_id,kind,target_id,vendor_id,reason)
);
CREATE INDEX content_reports_open_idx ON public.content_reports(created_at) WHERE resolved_at IS NULL;
CREATE INDEX content_reports_reporter_idx ON public.content_reports(reporter_id,created_at);
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_blocks,public.content_reports FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.user_blocks,public.content_reports TO authenticated;
GRANT ALL ON public.user_blocks,public.content_reports TO service_role;
CREATE POLICY own_blocks ON public.user_blocks FOR SELECT TO authenticated USING(blocker_id=(SELECT auth.uid()));
CREATE POLICY own_reports_or_admin ON public.content_reports FOR SELECT TO authenticated
 USING(reporter_id=(SELECT auth.uid()) OR ((SELECT public.wm_is_admin()) AND (SELECT public.wm_admin_mfa_ok())));

CREATE FUNCTION public.wm_thread_other_user(p_rfq uuid,p_vendor uuid) RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE client_id uuid; vendor_owner uuid;
BEGIN
 SELECT r.owner_id,v.owner_id INTO client_id,vendor_owner FROM public.rfq_invites i
  JOIN public.rfqs r ON r.id=i.rfq_id JOIN public.vendors v ON v.id=i.vendor_id WHERE i.rfq_id=p_rfq AND i.vendor_id=p_vendor;
 IF auth.uid()=client_id THEN RETURN vendor_owner;
 ELSIF auth.uid()=vendor_owner THEN RETURN client_id;
 ELSE RAISE EXCEPTION 'Conversation access required' USING ERRCODE='42501'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.wm_thread_other_user(uuid,uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.conversation_safety_state(p_rfq uuid,p_vendor uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE other_id uuid:=public.wm_thread_other_user(p_rfq,p_vendor);
BEGIN RETURN EXISTS(SELECT 1 FROM public.user_blocks WHERE blocker_id=auth.uid() AND blocked_id=other_id); END $$;
CREATE FUNCTION public.set_conversation_block(p_rfq uuid,p_vendor uuid,p_blocked boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE other_id uuid:=public.wm_thread_other_user(p_rfq,p_vendor);
BEGIN
 IF other_id IS NULL OR auth.uid() IS NULL OR other_id=auth.uid() THEN RAISE EXCEPTION 'Unable to block this contact' USING ERRCODE='42501'; END IF;
 IF p_blocked THEN INSERT INTO public.user_blocks(blocker_id,blocked_id) VALUES(auth.uid(),other_id) ON CONFLICT DO NOTHING;
 ELSE DELETE FROM public.user_blocks WHERE blocker_id=auth.uid() AND blocked_id=other_id; END IF;
END $$;
CREATE FUNCTION public.report_content(p_kind text,p_target uuid,p_vendor uuid,p_reason text,p_details text DEFAULT '') RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE receipt uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid()) THEN RAISE EXCEPTION 'Sign in to report content' USING ERRCODE='42501'; END IF;
 IF NOT pg_try_advisory_xact_lock(hashtextextended('report/'||auth.uid()::text,0)) THEN RAISE EXCEPTION 'A report is already being saved' USING ERRCODE='55P03'; END IF;
 IF p_kind='conversation' THEN PERFORM public.wm_thread_other_user(p_target,p_vendor);
 ELSIF p_kind='vendor' THEN
  IF NOT EXISTS(SELECT 1 FROM public.vendors WHERE id=p_target AND is_published) THEN RAISE EXCEPTION 'Published vendor required' USING ERRCODE='42501'; END IF;
  p_vendor:=NULL;
 ELSE RAISE EXCEPTION 'Invalid content type' USING ERRCODE='22023'; END IF;
 IF length(coalesce(p_details,''))>2000 THEN RAISE EXCEPTION 'Report is too long' USING ERRCODE='22023'; END IF;
 SELECT id INTO receipt FROM public.content_reports WHERE reporter_id=auth.uid() AND kind=p_kind AND target_id=p_target AND vendor_id IS NOT DISTINCT FROM p_vendor AND reason=p_reason;
 IF receipt IS NOT NULL THEN RETURN receipt; END IF;
 IF (SELECT count(*) FROM public.content_reports WHERE reporter_id=auth.uid() AND created_at>now()-interval '1 day')>=10 THEN RAISE EXCEPTION 'Daily report limit reached' USING ERRCODE='54000'; END IF;
 INSERT INTO public.content_reports(reporter_id,kind,target_id,vendor_id,reason,details) VALUES(auth.uid(),p_kind,p_target,p_vendor,p_reason,coalesce(p_details,'')) RETURNING id INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.conversation_safety_state(uuid,uuid),public.set_conversation_block(uuid,uuid,boolean),public.report_content(text,uuid,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.conversation_safety_state(uuid,uuid),public.set_conversation_block(uuid,uuid,boolean),public.report_content(text,uuid,uuid,text,text) TO authenticated;

CREATE FUNCTION public.wm_guard_suspension() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF (NEW.community_terms_version,NEW.community_terms_accepted_at) IS DISTINCT FROM (OLD.community_terms_version,OLD.community_terms_accepted_at) THEN
  IF NEW.community_terms_version IS DISTINCT FROM '2026-10-26' THEN RAISE EXCEPTION 'Invalid terms version' USING ERRCODE='22023'; END IF;
  NEW.community_terms_accepted_at:=now();
 END IF;
 IF NEW.suspended_at IS DISTINCT FROM OLD.suspended_at AND current_user NOT IN ('postgres','supabase_admin','service_role') THEN
  RAISE EXCEPTION 'Only moderation may change account restrictions' USING ERRCODE='42501';
 END IF;RETURN NEW;
END $$;
CREATE TRIGGER wm_guard_suspension BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.wm_guard_suspension();

CREATE FUNCTION public.wm_guard_content_safety() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE client_id uuid; vendor_owner uuid; text_value text;
BEGIN
 IF auth.uid() IS NULL OR auth.role()='service_role' THEN RETURN NEW; END IF;
 IF public.wm_is_admin() AND public.wm_admin_mfa_ok() THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='rfq_invites' AND TG_OP='UPDATE' THEN RETURN NEW; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND suspended_at IS NULL) THEN
  RAISE EXCEPTION 'Account cannot post content. Contact support.' USING ERRCODE='42501';
 END IF;
 IF coalesce((SELECT value='true'::jsonb FROM public.site_settings WHERE key='community_rules_enforced'),false)
  AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND community_terms_version='2026-10-26') THEN
  RAISE EXCEPTION 'Accept the Terms and Community Guidelines before posting.' USING ERRCODE='42501';
 END IF;
 text_value:=concat_ws(' ',to_jsonb(NEW)->>'body',to_jsonb(NEW)->>'title',to_jsonb(NEW)->>'description',to_jsonb(NEW)->>'notes',to_jsonb(NEW)->>'message');
 -- Small deterministic first-pass filter; reports and human review cover contextual/image abuse.
 IF text_value ~* '(<script|javascript:|kill yourself|matate|mátate)' THEN
  RAISE EXCEPTION 'Content requires review. Contact support.' USING ERRCODE='22023';
 END IF;
 IF TG_TABLE_NAME IN ('rfq_invites','quote_messages','quotes') THEN
  SELECT r.owner_id,v.owner_id INTO client_id,vendor_owner FROM public.rfqs r CROSS JOIN public.vendors v WHERE r.id=NEW.rfq_id AND v.id=NEW.vendor_id;
  IF EXISTS(SELECT 1 FROM public.user_blocks WHERE (blocker_id=client_id AND blocked_id=vendor_owner) OR (blocker_id=vendor_owner AND blocked_id=client_id)) THEN
   RAISE EXCEPTION 'This contact cannot receive new inquiries, proposals or messages.' USING ERRCODE='42501';
  END IF;
 END IF;
 RETURN NEW;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['rfqs','rfq_invites','quotes','quote_messages','reviews','vendors','vendor_media','vendor_team','vendor_pricing','vendor_spaces'] LOOP
  EXECUTE format('CREATE TRIGGER wm_content_safety BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.wm_guard_content_safety()',t);
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_suspension(),public.wm_guard_content_safety() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.resolve_content_report(p_report uuid,p_action text,p_message uuid DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE report public.content_reports; subject_id uuid;
BEGIN
 IF NOT public.wm_is_admin() OR NOT public.wm_admin_mfa_ok() THEN RAISE EXCEPTION 'Verified moderator required' USING ERRCODE='42501'; END IF;
 SELECT * INTO STRICT report FROM public.content_reports WHERE id=p_report FOR UPDATE;
 IF p_action='unpublish' AND report.kind='vendor' THEN UPDATE public.vendors SET is_published=false WHERE id=report.target_id;
 ELSIF p_action='suspend' THEN
  IF report.kind='vendor' THEN SELECT owner_id INTO subject_id FROM public.vendors WHERE id=report.target_id;
  ELSE SELECT CASE WHEN r.owner_id=report.reporter_id THEN v.owner_id ELSE r.owner_id END INTO subject_id
   FROM public.rfqs r CROSS JOIN public.vendors v WHERE r.id=report.target_id AND v.id=report.vendor_id; END IF;
  UPDATE public.profiles SET suspended_at=now() WHERE id=subject_id AND role<>'admin';
  IF NOT FOUND THEN RAISE EXCEPTION 'Account cannot be restricted through this report'; END IF;
  UPDATE public.vendors SET is_published=false WHERE owner_id=subject_id;
 ELSIF p_action='remove_message' AND report.kind='conversation' THEN
  UPDATE public.quote_messages SET body='[Removed by moderation]' WHERE id=p_message AND rfq_id=report.target_id AND vendor_id=report.vendor_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Message is outside this report' USING ERRCODE='42501'; END IF;
 ELSIF p_action NOT IN ('resolved','dismissed') THEN RAISE EXCEPTION 'Invalid moderation action'; END IF;
 UPDATE public.content_reports SET resolved_at=now(),resolution=p_action WHERE id=p_report;
END $$;
REVOKE ALL ON FUNCTION public.resolve_content_report(uuid,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resolve_content_report(uuid,text,uuid) TO authenticated;

CREATE FUNCTION public.read_moderation_case(p_report uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE report public.content_reports;
BEGIN
 IF NOT public.wm_is_admin() OR NOT public.wm_admin_mfa_ok() THEN RAISE EXCEPTION 'Verified moderator required' USING ERRCODE='42501'; END IF;
 SELECT * INTO STRICT report FROM public.content_reports WHERE id=p_report;
 IF report.kind<>'conversation' THEN RETURN '[]'::jsonb; END IF;
 RETURN (SELECT coalesce(jsonb_agg(to_jsonb(m)),'[]'::jsonb) FROM
  (SELECT id,sender_role,body,created_at FROM public.quote_messages WHERE rfq_id=report.target_id AND vendor_id=report.vendor_id ORDER BY created_at DESC,id DESC LIMIT 20) m);
END $$;
REVOKE ALL ON FUNCTION public.read_moderation_case(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.read_moderation_case(uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
