BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';

-- Keep the legacy quote link for older clients, but messages belong to a thread
-- and can precede its first proposal. No history is discarded.
ALTER TABLE public.quote_messages ADD COLUMN rfq_id uuid, ADD COLUMN vendor_id uuid;
UPDATE public.quote_messages m SET rfq_id=q.rfq_id,vendor_id=q.vendor_id FROM public.quotes q WHERE q.id=m.quote_id;
ALTER TABLE public.quote_messages ALTER COLUMN quote_id DROP NOT NULL,
 ALTER COLUMN rfq_id SET NOT NULL, ALTER COLUMN vendor_id SET NOT NULL,
 ADD CONSTRAINT quote_messages_thread_fkey FOREIGN KEY(rfq_id,vendor_id) REFERENCES public.rfq_invites(rfq_id,vendor_id) ON DELETE CASCADE;
CREATE INDEX quote_messages_thread_created_idx ON public.quote_messages(rfq_id,vendor_id,created_at,id);

CREATE FUNCTION public.wm_conversation_open(p_rfq uuid,p_vendor uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.rfq_invites i JOIN public.rfqs r ON r.id=i.rfq_id JOIN public.vendors v ON v.id=i.vendor_id
 WHERE i.rfq_id=p_rfq AND i.vendor_id=p_vendor AND (r.owner_id=auth.uid() OR v.owner_id=auth.uid())
 AND i.closed_at IS NULL AND i.status NOT IN ('declined','expired') AND
 ((r.accepted_quote_id IS NULL AND (i.expires_at IS NULL OR i.expires_at>now())) OR
 EXISTS(SELECT 1 FROM public.quotes q WHERE q.id=r.accepted_quote_id AND q.vendor_id=i.vendor_id)));
$$;
REVOKE ALL ON FUNCTION public.wm_conversation_open(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wm_conversation_open(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.wm_thread_is_open(p_quote uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.quotes q WHERE q.id=p_quote AND public.wm_conversation_open(q.rfq_id,q.vendor_id));
$$;

CREATE OR REPLACE FUNCTION public.wm_guard_message() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q public.quotes;
BEGIN
 IF NEW.quote_id IS NOT NULL THEN
  SELECT * INTO q FROM public.quotes WHERE id=NEW.quote_id;
  IF NOT FOUND OR (NEW.rfq_id IS NOT NULL AND NEW.rfq_id<>q.rfq_id) OR (NEW.vendor_id IS NOT NULL AND NEW.vendor_id<>q.vendor_id) THEN
   RAISE EXCEPTION 'Message and proposal must belong to the same conversation.' USING ERRCODE='42501'; END IF;
  NEW.rfq_id:=q.rfq_id; NEW.vendor_id:=q.vendor_id;
 END IF;
 IF coalesce(auth.role(),'') NOT IN ('','service_role') THEN
  PERFORM 1 FROM public.rfqs WHERE id=NEW.rfq_id FOR UPDATE;
  -- Serialize closure/acceptance with sends. The invoker still passes RLS below.
  PERFORM 1 FROM public.rfq_invites WHERE rfq_id=NEW.rfq_id AND vendor_id=NEW.vendor_id FOR UPDATE;
  IF NEW.sender_id IS DISTINCT FROM auth.uid() OR length(trim(NEW.body)) NOT BETWEEN 1 AND 2000 OR
     NOT public.wm_conversation_open(NEW.rfq_id,NEW.vendor_id) THEN
   RAISE EXCEPTION 'This conversation is closed or the message is invalid.' USING ERRCODE='42501'; END IF;
  NEW.created_at:=now(); NEW.updated_at:=now();
 END IF;
 RETURN NEW;
END $$;

DROP POLICY quote_messages_client_select ON public.quote_messages;
DROP POLICY quote_messages_vendor_select ON public.quote_messages;
DROP POLICY quote_messages_client_insert ON public.quote_messages;
DROP POLICY quote_messages_vendor_insert ON public.quote_messages;
CREATE POLICY messages_thread_read ON public.quote_messages FOR SELECT TO authenticated USING (
 EXISTS(SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=auth.uid()) OR
 EXISTS(SELECT 1 FROM public.vendors v JOIN public.rfq_invites i ON i.vendor_id=v.id
  WHERE v.id=quote_messages.vendor_id AND i.rfq_id=quote_messages.rfq_id AND v.owner_id=auth.uid()));
CREATE POLICY messages_thread_insert ON public.quote_messages FOR INSERT TO authenticated WITH CHECK (
 sender_id=auth.uid() AND public.wm_conversation_open(rfq_id,vendor_id) AND
 ((sender_role='client' AND EXISTS(SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=auth.uid())) OR
  (sender_role='vendor' AND EXISTS(SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.owner_id=auth.uid()))));
REVOKE UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.quote_messages FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.touch_rfq_invite_activity_from_message() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 UPDATE public.rfq_invites SET last_activity_at=NEW.created_at,
  client_last_read_at=CASE WHEN NEW.sender_role='client' THEN NEW.created_at ELSE client_last_read_at END,
  vendor_last_read_at=CASE WHEN NEW.sender_role='vendor' THEN NEW.created_at ELSE vendor_last_read_at END
 WHERE rfq_id=NEW.rfq_id AND vendor_id=NEW.vendor_id;
 RETURN NEW;
END $$;

-- One transaction for either one vendor or a group. The UUID makes retries
-- idempotent; it never silently overwrites an unrelated previous inquiry.
ALTER TABLE public.rfqs ADD COLUMN submission_fingerprint text, ADD COLUMN last_submission_id uuid;
CREATE UNIQUE INDEX rfqs_owner_submission_idx ON public.rfqs(owner_id,last_submission_id) WHERE last_submission_id IS NOT NULL;
CREATE FUNCTION public.create_inquiry(p_vendors uuid[],p_payload jsonb,p_request_id uuid DEFAULT gen_random_uuid(),p_existing uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SET search_path='' AS $$
DECLARE ids uuid[]; rid uuid:=coalesce(p_request_id,gen_random_uuid()); r public.rfqs; request_key uuid:=rid; fingerprint text; updating boolean:=false;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_user(auth.uid()) THEN RAISE EXCEPTION 'Client access required.' USING ERRCODE='42501'; END IF;
 IF coalesce(cardinality(p_vendors),0) NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'Select 1 to 10 vendors.' USING ERRCODE='22023'; END IF;
 SELECT array_agg(DISTINCT x ORDER BY x) INTO ids FROM unnest(p_vendors) x WHERE x IS NOT NULL;
 IF coalesce(cardinality(ids),0) NOT BETWEEN 1 AND 10 OR jsonb_typeof(p_payload) IS DISTINCT FROM 'object' OR
    pg_column_size(p_payload)>16384 OR coalesce(length(trim(p_payload->>'notes')),0) NOT BETWEEN 1 AND 2000 OR
    coalesce((p_payload->>'guest_count')::integer,0)<1 OR
    coalesce((p_payload->>'budget')::integer,0)<0 THEN RAISE EXCEPTION 'Invalid inquiry.' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(ids) x WHERE NOT EXISTS(SELECT 1 FROM public.vendors v WHERE v.id=x AND v.is_published)) THEN
  RAISE EXCEPTION 'A selected vendor is no longer available.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(p_payload::text||ids::text);
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text||'/'||rid::text,0));
 SELECT * INTO r FROM public.rfqs WHERE (id=rid OR last_submission_id=rid) AND owner_id=auth.uid();
 IF FOUND THEN
  IF r.submission_fingerprint IS DISTINCT FROM fingerprint THEN RAISE EXCEPTION 'This submission was already used.' USING ERRCODE='23505'; END IF;
  RETURN jsonb_build_object('rfq_id',r.id,'vendor_count',cardinality(ids),'replayed',true,'updated',false);
 END IF;
 IF p_existing IS NOT NULL THEN
  IF cardinality(ids)<>1 THEN RAISE EXCEPTION 'Only individual requests can be edited.' USING ERRCODE='22023'; END IF;
  SELECT * INTO r FROM public.rfqs WHERE id=p_existing AND owner_id=auth.uid() AND vendor_id=ids[1] FOR UPDATE;
  IF NOT FOUND OR r.accepted_quote_id IS NOT NULL OR EXISTS(SELECT 1 FROM public.quotes WHERE rfq_id=p_existing) OR
     EXISTS(SELECT 1 FROM public.quote_messages WHERE rfq_id=p_existing) OR NOT public.wm_conversation_open(p_existing,ids[1]) THEN
   RAISE EXCEPTION 'Continue this conversation in your inbox.' USING ERRCODE='23505'; END IF;
  rid:=p_existing; updating:=true;
 ELSE
  INSERT INTO public.rfqs(id,owner_id,vendor_id) VALUES(rid,auth.uid(),CASE WHEN cardinality(ids)=1 THEN ids[1] END);
 END IF;
 UPDATE public.rfqs SET event_date=nullif(p_payload->>'event_date','')::date,flexible_date=coalesce((p_payload->>'flexible')::boolean,false),
  guest_count=(p_payload->>'guest_count')::integer,guest_count_range=(p_payload->>'guest_count')::text,
  budget_min=(p_payload->>'budget')::integer,budget_max=(p_payload->>'budget')::integer,
  city=nullif(trim(p_payload->>'city'),''),state=NULL,country='Costa Rica',language=nullif(p_payload->>'language',''),
  theme=nullif(p_payload->>'theme',''),notes=trim(p_payload->>'notes'),contact_email=p_payload->>'email',contact_phone=nullif(p_payload->>'phone',''),
  guest_first_name=nullif(p_payload->>'first_name',''),guest_last_name=nullif(p_payload->>'last_name',''),
  guest_lead_email=p_payload->>'email',guest_phone=nullif(p_payload->>'phone',''),submission_fingerprint=fingerprint,last_submission_id=request_key,updated_at=now() WHERE id=rid;
 IF NOT updating THEN
  INSERT INTO public.rfq_invites(rfq_id,vendor_id,expires_at) SELECT rid,x,now()+interval '14 days' FROM unnest(ids) x;
 ELSE
  UPDATE public.rfq_invites SET last_activity_at=now() WHERE rfq_id=rid AND vendor_id=ids[1];
 END IF;
 RETURN jsonb_build_object('rfq_id',rid,'vendor_count',cardinality(ids),'updated',updating,'replayed',false);
END $$;
REVOKE ALL ON FUNCTION public.create_inquiry(uuid[],jsonb,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_inquiry(uuid[],jsonb,uuid,uuid) TO authenticated;

-- Serialize proposal creation with editing/acceptance; accepted prices cannot
-- race a new revision. PostgreSQL, rather than a caller, allocates versions.
CREATE OR REPLACE FUNCTION public.wm_allocate_quote_version() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM 1 FROM public.rfqs WHERE id=NEW.rfq_id FOR UPDATE;
 IF auth.role()='authenticated' AND NOT public.wm_can_submit_quote(NEW.rfq_id,NEW.vendor_id) THEN
  RAISE EXCEPTION 'This request is closed.' USING ERRCODE='42501'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW.rfq_id::text||'/'||NEW.vendor_id::text,0));
 SELECT coalesce(max(version),0)+1 INTO NEW.version FROM public.quotes WHERE rfq_id=NEW.rfq_id AND vendor_id=NEW.vendor_id;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.wm_notification_allowed(p_recipient uuid,p_actor uuid,p_type text,p_data jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE r_id uuid; v_id uuid; q_id uuid; client_id uuid; vendor_owner uuid; accepted_id uuid;
BEGIN
  IF auth.uid() IS NULL OR p_actor IS DISTINCT FROM auth.uid() OR p_type NOT IN
    ('quote_answered','vendor_new_request','vendor_quote_accepted','thread_reply') THEN RETURN false; END IF;
  BEGIN r_id:=(p_data->>'rfqId')::uuid; v_id:=(p_data->>'vendorId')::uuid; q_id:=(p_data->>'quoteId')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN RETURN false; END;
  SELECT r.owner_id,v.owner_id,r.accepted_quote_id INTO client_id,vendor_owner,accepted_id
    FROM public.rfqs r JOIN public.rfq_invites i ON i.rfq_id=r.id JOIN public.vendors v ON v.id=i.vendor_id
    WHERE r.id=r_id AND v.id=v_id;
  IF NOT FOUND THEN RETURN false; END IF;
  IF p_type NOT IN ('vendor_new_request','thread_reply') AND NOT EXISTS
    (SELECT 1 FROM public.quotes WHERE id=q_id AND rfq_id=r_id AND vendor_id=v_id) THEN RETURN false; END IF;
  IF p_type='vendor_new_request' THEN RETURN p_actor=client_id AND p_recipient=vendor_owner; END IF;
  IF p_type='vendor_quote_accepted' THEN RETURN p_actor=client_id AND p_recipient=vendor_owner AND accepted_id=q_id; END IF;
  IF p_type='quote_answered' THEN RETURN p_actor=vendor_owner AND p_recipient=client_id; END IF;
  RETURN ((p_actor=client_id AND p_recipient=vendor_owner AND p_data->>'senderRole'='client') OR
          (p_actor=vendor_owner AND p_recipient=client_id AND p_data->>'senderRole'='vendor')) AND EXISTS
    (SELECT 1 FROM public.quote_messages WHERE rfq_id=r_id AND vendor_id=v_id AND quote_id IS NOT DISTINCT FROM q_id AND sender_id=p_actor AND created_at>=now()-interval '5 minutes');
END $$;
REVOKE ALL ON FUNCTION public.wm_notification_allowed(uuid,uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wm_notification_allowed(uuid,uuid,text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_inbox_threads(p_viewer text,p_page integer DEFAULT 1,p_archived boolean DEFAULT false,p_search text DEFAULT '',p_rfq uuid DEFAULT NULL)
RETURNS TABLE(invite jsonb,rfq jsonb,vendor jsonb,latest_quote jsonb,quote_count integer,last_activity_at timestamptz,
 unread_at timestamptz,accepted_here boolean,total_count bigint,active_count bigint,archived_count bigint)
LANGUAGE sql STABLE SET search_path='' AS $$
 WITH members AS MATERIALIZED (
  SELECT i, r, v, i.closed_reason=CASE WHEN p_viewer='client' THEN 'archived_by_client' ELSE 'archived_by_vendor' END AS archived
  FROM public.rfq_invites i JOIN public.rfqs_visible r ON r.id=i.rfq_id JOIN public.thread_vendors v ON v.id=i.vendor_id
  WHERE ((p_viewer='client' AND r.owner_id=auth.uid()) OR (p_viewer='vendor' AND v.owner_id=auth.uid()))
   AND (p_rfq IS NULL OR r.id=p_rfq)
   AND (coalesce(p_search,'')='' OR concat_ws(' ',r.id::text,r.city,r.state,r.country,r.notes,v.business_name,v.slug)
     ILIKE '%'||left(p_search,100)||'%' OR EXISTS(SELECT 1 FROM public.quote_messages m WHERE m.rfq_id=i.rfq_id AND m.vendor_id=i.vendor_id AND m.body ILIKE '%'||left(p_search,100)||'%') OR EXISTS(SELECT 1 FROM public.quotes q WHERE q.rfq_id=i.rfq_id AND q.vendor_id=i.vendor_id AND q.message ILIKE '%'||left(p_search,100)||'%'))
 ), counts AS (
  SELECT count(*) FILTER(WHERE NOT coalesce(archived,false)) AS active_count,
   count(*) FILTER(WHERE coalesce(archived,false)) AS archived_count FROM members
 ), page AS MATERIALIZED (
  SELECT * FROM members WHERE coalesce(archived,false)=p_archived
  ORDER BY coalesce((i).last_activity_at,(i).created_at) DESC,(i).rfq_id,(i).vendor_id
  LIMIT 50 OFFSET (greatest(1,least(coalesce(p_page,1),1000))-1)*50
 )
 SELECT to_jsonb(p.i),to_jsonb(p.r)||jsonb_build_object('notes',left((p.r).notes,240)),
  jsonb_build_object('id',(p.v).id,'slug',(p.v).slug,'business_name',(p.v).business_name),
  CASE WHEN q.id IS NOT NULL THEN to_jsonb(q)||jsonb_build_object('message',left(q.message,240)) END,
  stats.quote_count,coalesce((p.i).last_activity_at,(p.i).created_at),
  greatest(msg.latest_at,CASE WHEN p_viewer='client' THEN stats.quote_at ELSE (p.i).created_at END,
   CASE WHEN (p.i).status IN ('accepted','declined','expired') THEN (p.i).last_activity_at END),
  EXISTS(SELECT 1 FROM public.quotes winning WHERE winning.id=(p.r).accepted_quote_id AND winning.vendor_id=(p.i).vendor_id),
  CASE WHEN p_archived THEN counts.archived_count ELSE counts.active_count END,counts.active_count,counts.archived_count
 FROM page p CROSS JOIN counts
 LEFT JOIN LATERAL (SELECT q.* FROM public.quotes q WHERE q.rfq_id=(p.i).rfq_id AND q.vendor_id=(p.i).vendor_id
   ORDER BY q.version DESC,q.created_at DESC LIMIT 1) q ON true
 LEFT JOIN LATERAL (SELECT count(*)::integer quote_count,max(greatest(created_at,updated_at)) quote_at
   FROM public.quotes WHERE rfq_id=(p.i).rfq_id AND vendor_id=(p.i).vendor_id) stats ON true
 LEFT JOIN LATERAL (SELECT max(m.created_at) latest_at FROM public.quote_messages m
   WHERE m.rfq_id=(p.i).rfq_id AND m.vendor_id=(p.i).vendor_id AND m.sender_role<>p_viewer) msg ON true;
$$;
REVOKE ALL ON FUNCTION public.list_inbox_threads(text,integer,boolean,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_inbox_threads(text,integer,boolean,text,uuid) TO authenticated;

CREATE FUNCTION public.list_inbox_threads_v2(p_viewer text,p_page integer DEFAULT 1,p_archived boolean DEFAULT false,p_search text DEFAULT '',p_rfq uuid DEFAULT NULL)
RETURNS TABLE(invite jsonb,rfq jsonb,vendor jsonb,latest_quote jsonb,quote_count integer,last_activity_at timestamptz,
 unread_at timestamptz,accepted_here boolean,total_count bigint,active_count bigint,archived_count bigint)
LANGUAGE sql STABLE SET search_path='' AS $$
 WITH members AS MATERIALIZED (
  SELECT i, r, v, i.closed_reason=CASE WHEN p_viewer='client' THEN 'archived_by_client' ELSE 'archived_by_vendor' END AS archived
  FROM public.rfq_invites i JOIN public.rfqs_visible r ON r.id=i.rfq_id JOIN public.thread_vendors v ON v.id=i.vendor_id
  WHERE ((p_viewer='client' AND r.owner_id=auth.uid()) OR (p_viewer='vendor' AND v.owner_id=auth.uid()))
   AND (p_rfq IS NULL OR r.id=p_rfq)
   AND (coalesce(p_search,'')='' OR concat_ws(' ',r.id::text,r.city,r.state,r.country,r.notes,v.business_name,v.slug)
     ILIKE '%'||left(p_search,100)||'%' OR EXISTS(SELECT 1 FROM public.quote_messages m WHERE m.rfq_id=i.rfq_id AND m.vendor_id=i.vendor_id AND m.body ILIKE '%'||left(p_search,100)||'%') OR EXISTS(SELECT 1 FROM public.quotes q WHERE q.rfq_id=i.rfq_id AND q.vendor_id=i.vendor_id AND q.message ILIKE '%'||left(p_search,100)||'%'))
 ), counts AS (
  SELECT count(*) FILTER(WHERE NOT coalesce(archived,false)) AS active_count,
   count(*) FILTER(WHERE coalesce(archived,false)) AS archived_count FROM members
 ), page AS MATERIALIZED (
  SELECT * FROM members WHERE coalesce(archived,false)=p_archived
  ORDER BY coalesce((i).last_activity_at,(i).created_at) DESC,(i).rfq_id,(i).vendor_id
  LIMIT 50 OFFSET (greatest(1,least(coalesce(p_page,1),1000))-1)*50
 )
 SELECT to_jsonb(p.i),to_jsonb(p.r)||jsonb_build_object('notes',left((p.r).notes,240)),
  jsonb_build_object('id',(p.v).id,'slug',(p.v).slug,'business_name',(p.v).business_name),
  CASE WHEN q.id IS NOT NULL THEN to_jsonb(q)||jsonb_build_object('message',left(q.message,240)) END,
  stats.quote_count,coalesce((p.i).last_activity_at,(p.i).created_at),
  greatest(msg.latest_at,CASE WHEN p_viewer='client' THEN stats.quote_at ELSE (p.i).created_at END,
   CASE WHEN (p.i).status IN ('accepted','declined','expired') THEN (p.i).last_activity_at END),
  EXISTS(SELECT 1 FROM public.quotes winning WHERE winning.id=(p.r).accepted_quote_id AND winning.vendor_id=(p.i).vendor_id),
  CASE WHEN p_archived THEN counts.archived_count ELSE counts.active_count END,counts.active_count,counts.archived_count
 FROM counts LEFT JOIN page p ON true
 LEFT JOIN LATERAL (SELECT q.* FROM public.quotes q WHERE q.rfq_id=(p.i).rfq_id AND q.vendor_id=(p.i).vendor_id
   ORDER BY q.version DESC,q.created_at DESC LIMIT 1) q ON true
 LEFT JOIN LATERAL (SELECT count(*)::integer quote_count,max(greatest(created_at,updated_at)) quote_at
   FROM public.quotes WHERE rfq_id=(p.i).rfq_id AND vendor_id=(p.i).vendor_id) stats ON true
 LEFT JOIN LATERAL (SELECT max(m.created_at) latest_at FROM public.quote_messages m
   WHERE m.rfq_id=(p.i).rfq_id AND m.vendor_id=(p.i).vendor_id AND m.sender_role<>p_viewer) msg ON true;
$$;
REVOKE ALL ON FUNCTION public.list_inbox_threads_v2(text,integer,boolean,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_inbox_threads_v2(text,integer,boolean,text,uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.accept_vendor_quote(p_rfq uuid,p_quote uuid,p_reveal_email boolean DEFAULT false,p_reveal_phone boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rfqs; q public.quotes; i public.rfq_invites;
BEGIN
  SELECT * INTO r FROM public.rfqs WHERE id=p_rfq AND owner_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request ownership required.' USING ERRCODE='42501'; END IF;
  SELECT * INTO q FROM public.quotes WHERE id=p_quote AND rfq_id=p_rfq;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote does not belong to this request.' USING ERRCODE='22023'; END IF;
  IF r.accepted_quote_id IS NOT NULL THEN
    IF r.accepted_quote_id=p_quote THEN RETURN jsonb_build_object('vendorId',q.vendor_id,'alreadyAccepted',true); END IF;
    RAISE EXCEPTION 'A quote has already been accepted.' USING ERRCODE='23505';
  END IF;
  SELECT * INTO i FROM public.rfq_invites WHERE rfq_id=p_rfq AND vendor_id=q.vendor_id FOR UPDATE;
  IF NOT FOUND OR i.status IN ('declined','expired') OR i.closed_at IS NOT NULL OR i.expires_at<=now() THEN
    RAISE EXCEPTION 'This invitation is closed or expired.' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT 1 FROM public.quotes newer WHERE newer.rfq_id=p_rfq AND newer.vendor_id=q.vendor_id AND newer.version>q.version) THEN
    RAISE EXCEPTION 'A newer proposal is available. Refresh before accepting.' USING ERRCODE='22023'; END IF;
  UPDATE public.rfqs SET accepted_quote_id=p_quote,accepted_at=now() WHERE id=p_rfq;
  UPDATE public.rfq_invites SET status='accepted',reveal_email=coalesce(p_reveal_email,false),reveal_phone=coalesce(p_reveal_phone,false),
    last_activity_at=now(),client_last_read_at=now(),closed_at=NULL,closed_reason=NULL WHERE rfq_id=p_rfq AND vendor_id=q.vendor_id;
  UPDATE public.rfq_invites SET status='declined',closed_at=now(),closed_reason='accepted_other_vendor',last_activity_at=now()
    WHERE rfq_id=p_rfq AND vendor_id<>q.vendor_id;
  RETURN jsonb_build_object('vendorId',q.vendor_id,'alreadyAccepted',false);
END $$;
REVOKE ALL ON FUNCTION public.accept_vendor_quote(uuid,uuid,boolean,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.accept_vendor_quote(uuid,uuid,boolean,boolean) TO authenticated;


CREATE OR REPLACE FUNCTION public.wm_guard_rfq_booking() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND OLD.accepted_quote_id IS NOT NULL AND
     ROW(NEW.accepted_quote_id,NEW.accepted_at) IS DISTINCT FROM ROW(OLD.accepted_quote_id,OLD.accepted_at) THEN
    RAISE EXCEPTION 'An accepted booking cannot be replaced.' USING ERRCODE='42501'; END IF;
  IF NEW.accepted_quote_id IS NOT NULL AND (TG_OP='INSERT' OR NEW.accepted_quote_id IS DISTINCT FROM OLD.accepted_quote_id) THEN
    IF NOT EXISTS (SELECT 1 FROM public.quotes q JOIN public.rfq_invites i ON i.rfq_id=q.rfq_id AND i.vendor_id=q.vendor_id
      WHERE q.id=NEW.accepted_quote_id AND q.rfq_id=NEW.id AND i.status NOT IN ('declined','expired')
      AND i.closed_at IS NULL AND (i.expires_at IS NULL OR i.expires_at>now()) AND NOT EXISTS
       (SELECT 1 FROM public.quotes newer WHERE newer.rfq_id=q.rfq_id AND newer.vendor_id=q.vendor_id AND newer.version>q.version)) THEN
      RAISE EXCEPTION 'Invalid booking linkage.' USING ERRCODE='42501'; END IF;
    NEW.accepted_at:=now();
  END IF;
  RETURN NEW;
END $$;

NOTIFY pgrst,'reload schema';
COMMIT;
