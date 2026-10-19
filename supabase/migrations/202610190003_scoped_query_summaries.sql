BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
CREATE OR REPLACE FUNCTION public.is_vendor(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT _uid=auth.uid() AND (EXISTS(SELECT 1 FROM public.profiles WHERE id=_uid AND role='vendor')
  OR EXISTS(SELECT 1 FROM public.vendors WHERE owner_id=_uid));
$$;
-- Intentional security-barrier projection. Its owner reads the base rows;
-- explicit membership and client consent are applied before caller predicates.
CREATE VIEW public.rfqs_visible WITH (security_barrier=true) AS
SELECT r.id,
  r.owner_id,
  r.created_at,
  r.event_date,
  r.guest_count,
  r.budget_min,
  r.budget_max,
  r.city,
  r.state,
  r.country,
  r.language,
  r.theme,
  r.notes,
  r.accepted_quote_id,
  r.accepted_at,
  r.updated_at,
  CASE WHEN r.owner_id=auth.uid() OR auth.role()='service_role' OR consent.email THEN r.contact_email END AS contact_email,
  CASE WHEN r.owner_id=auth.uid() OR auth.role()='service_role' OR consent.phone THEN r.contact_phone END AS contact_phone,
  r.flexible_date,
  r.guest_count_range,
  CASE WHEN r.owner_id=auth.uid() OR auth.role()='service_role' OR consent.booked THEN r.guest_first_name END AS guest_first_name,
  CASE WHEN r.owner_id=auth.uid() OR auth.role()='service_role' OR consent.booked THEN r.guest_last_name END AS guest_last_name,
  CASE WHEN r.owner_id=auth.uid() OR auth.role()='service_role' OR consent.email THEN r.guest_lead_email END AS guest_lead_email,
  CASE WHEN r.owner_id=auth.uid() OR auth.role()='service_role' OR consent.phone THEN r.guest_phone END AS guest_phone,
  r.vendor_id
FROM public.rfqs r
LEFT JOIN LATERAL (
 SELECT bool_or(i.reveal_email) AS email,bool_or(i.reveal_phone) AS phone,bool_or(true) AS booked
 FROM public.rfq_invites i JOIN public.vendors v ON v.id=i.vendor_id
 JOIN public.quotes q ON q.id=r.accepted_quote_id AND q.vendor_id=i.vendor_id
 WHERE i.rfq_id=r.id AND v.owner_id=auth.uid()
) consent ON true
WHERE r.owner_id=auth.uid() OR auth.role()='service_role' OR EXISTS (
 SELECT 1 FROM public.rfq_invites i JOIN public.vendors v ON v.id=i.vendor_id
 WHERE i.rfq_id=r.id AND v.owner_id=auth.uid());
REVOKE ALL ON public.rfqs_visible FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.rfqs_visible TO authenticated,service_role;

-- Keep existing conversations identifiable when a vendor unpublishes a listing,
-- without granting access to the vendor's full draft profile.
CREATE VIEW public.thread_vendors WITH (security_barrier=true) AS
 SELECT v.id,v.slug,v.business_name,v.owner_id FROM public.vendors v
 WHERE v.owner_id=auth.uid() OR auth.role()='service_role' OR EXISTS (
  SELECT 1 FROM public.rfq_invites i JOIN public.rfqs r ON r.id=i.rfq_id
  WHERE i.vendor_id=v.id AND r.owner_id=auth.uid());
REVOKE ALL ON public.thread_vendors FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.thread_vendors TO authenticated,service_role;

CREATE FUNCTION public.wm_thread_is_open(p_quote uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS (SELECT 1 FROM public.quotes q JOIN public.rfqs r ON r.id=q.rfq_id
 JOIN public.vendors v ON v.id=q.vendor_id JOIN public.rfq_invites i ON i.rfq_id=q.rfq_id AND i.vendor_id=q.vendor_id
 WHERE q.id=p_quote AND (r.owner_id=auth.uid() OR v.owner_id=auth.uid())
 AND i.closed_at IS NULL AND i.status NOT IN ('declined','expired') AND
 ((r.accepted_quote_id IS NULL AND (i.expires_at IS NULL OR i.expires_at>now())) OR
 EXISTS (SELECT 1 FROM public.quotes winning WHERE winning.id=r.accepted_quote_id AND winning.vendor_id=q.vendor_id)));
$$;
REVOKE ALL ON FUNCTION public.wm_thread_is_open(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wm_thread_is_open(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.wm_guard_message() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF current_user IN ('postgres','supabase_admin','service_role') THEN RETURN NEW; END IF;
 IF length(trim(NEW.body)) NOT BETWEEN 1 AND 10000 OR NOT public.wm_thread_is_open(NEW.quote_id) THEN
   RAISE EXCEPTION 'This conversation is closed or the message is invalid.' USING ERRCODE='42501'; END IF;
 NEW.created_at:=now(); NEW.updated_at:=now(); RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_message() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.list_inbox_threads(p_viewer text,p_page integer DEFAULT 1,p_archived boolean DEFAULT false,p_search text DEFAULT '',p_rfq uuid DEFAULT NULL)
RETURNS TABLE(invite jsonb,rfq jsonb,vendor jsonb,latest_quote jsonb,quote_count integer,last_activity_at timestamptz,
 unread_at timestamptz,accepted_here boolean,total_count bigint,active_count bigint,archived_count bigint)
LANGUAGE sql STABLE SET search_path='' AS $$
 WITH members AS MATERIALIZED (
  SELECT i, r, v, i.closed_reason=CASE WHEN p_viewer='client' THEN 'archived_by_client' ELSE 'archived_by_vendor' END AS archived
  FROM public.rfq_invites i JOIN public.rfqs_visible r ON r.id=i.rfq_id JOIN public.thread_vendors v ON v.id=i.vendor_id
  WHERE ((p_viewer='client' AND r.owner_id=auth.uid()) OR (p_viewer='vendor' AND v.owner_id=auth.uid()))
   AND (p_rfq IS NULL OR r.id=p_rfq)
   AND (coalesce(p_search,'')='' OR concat_ws(' ',r.id::text,r.city,r.state,r.country,r.notes,v.business_name,v.slug)
     ILIKE '%'||left(p_search,100)||'%')
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
 LEFT JOIN LATERAL (SELECT max(m.created_at) latest_at FROM public.quote_messages m JOIN public.quotes q ON q.id=m.quote_id
   WHERE q.rfq_id=(p.i).rfq_id AND q.vendor_id=(p.i).vendor_id AND m.sender_role<>p_viewer) msg ON true;
$$;
REVOKE ALL ON FUNCTION public.list_inbox_threads(text,integer,boolean,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_inbox_threads(text,integer,boolean,text,uuid) TO authenticated;

CREATE FUNCTION public.search_vendor_directory(p_query text DEFAULT '',p_category text DEFAULT '',p_page integer DEFAULT 1,p_size integer DEFAULT 12)
RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 WITH filtered AS MATERIALIZED (
  SELECT s.id,s.slug,s.business_name,s.thumbnail_image,s.rating_avg,s.rating_count,s.created_at,s.categories,
   left(s.bio_en,160) bio_en,left(s.bio_es,160) bio_es,v.logo_url
  FROM public.vendor_public_search s JOIN public.vendors v ON v.id=s.id
  WHERE (coalesce(p_category,'')='' OR s.categories @> ARRAY[left(p_category,100)]) AND
   (coalesce(p_query,'')='' OR concat_ws(' ',s.slug,s.business_name,s.bio_en,s.bio_es,s.extra_info_en,s.extra_info_es)
    ILIKE '%'||left(p_query,100)||'%')
 ), page AS (
  SELECT * FROM filtered ORDER BY created_at DESC,id
  LIMIT greatest(1,least(coalesce(p_size,12),50))
  OFFSET (greatest(1,least(coalesce(p_page,1),1000))-1)*greatest(1,least(coalesce(p_size,12),50))
 ) SELECT jsonb_build_object('items',coalesce((SELECT jsonb_agg(to_jsonb(page)) FROM page),'[]'::jsonb),
   'total',(SELECT count(*) FROM filtered));
$$;
REVOKE ALL ON FUNCTION public.search_vendor_directory(text,text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_vendor_directory(text,text,integer,integer) TO anon,authenticated;

CREATE FUNCTION public.notification_recipient_language(p_recipient uuid,p_rfq uuid,p_vendor uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p.language FROM public.profiles p WHERE p.id=p_recipient AND EXISTS (
  SELECT 1 FROM public.rfq_invites i JOIN public.rfqs r ON r.id=i.rfq_id JOIN public.vendors v ON v.id=i.vendor_id
  WHERE i.rfq_id=p_rfq AND i.vendor_id=p_vendor AND
   ((auth.uid()=r.owner_id AND p.id=v.owner_id) OR (auth.uid()=v.owner_id AND p.id=r.owner_id)));
$$;
REVOKE ALL ON FUNCTION public.notification_recipient_language(uuid,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.notification_recipient_language(uuid,uuid,uuid) TO authenticated;

CREATE FUNCTION public.append_vendor_media(p_vendor uuid,p_assets jsonb) RETURNS void
LANGUAGE plpgsql SET search_path='' AS $$
DECLARE gallery jsonb; combined jsonb; images integer; videos integer;
BEGIN
 SELECT coalesce(gallery_images,'[]'::jsonb) INTO gallery FROM public.vendors WHERE id=p_vendor AND owner_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Vendor ownership required.' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_assets) IS DISTINCT FROM 'array' OR pg_column_size(p_assets)>131072 OR jsonb_array_length(p_assets)>20 THEN
  RAISE EXCEPTION 'Invalid media batch.' USING ERRCODE='22023'; END IF;
 combined:=p_assets||gallery;
 SELECT count(*) FILTER(WHERE item->>'type' IS DISTINCT FROM 'video'),count(*) FILTER(WHERE item->>'type'='video') INTO images,videos
  FROM jsonb_array_elements(combined) item;
 IF images>20 OR videos>3 THEN RAISE EXCEPTION 'Vendor media limit exceeded.' USING ERRCODE='22023'; END IF;
 UPDATE public.vendors SET gallery_images=combined WHERE id=p_vendor;
END $$;
REVOKE ALL ON FUNCTION public.append_vendor_media(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.append_vendor_media(uuid,jsonb) TO authenticated;
CREATE INDEX IF NOT EXISTS rfq_invites_rfq_activity_idx ON public.rfq_invites(rfq_id,last_activity_at DESC);
NOTIFY pgrst,'reload schema';
COMMIT;
