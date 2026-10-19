-- Authorization repair for the live 2026-10-19 catalog. Does not delete application rows.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
-- TRUNCATE is not subject to RLS. API clients never need schema-level privileges.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON ALL TABLES IN SCHEMA public FROM PUBLIC,anon,authenticated;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM PUBLIC,anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.wm_is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;
REVOKE ALL ON FUNCTION public.wm_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wm_is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.wm_guard_profile_role() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    IF (TG_OP = 'INSERT' AND NEW.role NOT IN ('user', 'vendor')) OR
       (TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role
        AND (NEW.role = 'admin' OR OLD.role = 'admin')) THEN
      RAISE EXCEPTION 'Administrative roles require a trusted server operation.' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_profile_role() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS wm_guard_profile_role ON public.profiles;
CREATE TRIGGER wm_guard_profile_role BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.wm_guard_profile_role();

-- Auth creates a safe default profile even when email confirmation is required.
-- Never trust a role supplied in user-editable Auth metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE m jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  guests integer; budget numeric; wedding_date date;
BEGIN
  BEGIN guests:=(m->>'guest_count')::integer;
  EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN guests:=NULL; END;
  BEGIN budget:=(m->>'wedding_budget')::numeric;
  EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN budget:=NULL; END;
  BEGIN wedding_date:=(m->>'tentative_wedding_date')::date;
  EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN wedding_date:=NULL; END;
  INSERT INTO public.profiles
    (id, role, full_name, phone, country, tentative_wedding_date, guest_count, wedding_budget, wedding_theme, language)
  VALUES
    (NEW.id, 'user', left(coalesce(m->>'full_name', ''), 200),
     left(m->>'phone',40), left(m->>'country',120),
     wedding_date, CASE WHEN guests BETWEEN 1 AND 100000 THEN guests END,
     CASE WHEN budget BETWEEN 0 AND 1000000000 THEN budget END,
     left(m->>'wedding_theme',120), CASE WHEN m->>'language' = 'es' THEN 'es' ELSE 'en' END)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS wm_create_profile ON auth.users;
CREATE TRIGGER wm_create_profile AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Replace overlapping permissive policies, rather than adding another OR branch.
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'
    AND tablename IN ('profiles','vendors','amenity_lookup','languages','vendor_amenities',
      'vendor_pricing','vendor_spaces','vendor_team','quotes','rfqs','rfq_invites','reviews','notifications')
  LOOP EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename); END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_self_select ON public.profiles FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY profiles_self_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendors_published_select ON public.vendors FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY vendors_owner_manage ON public.vendors FOR ALL TO authenticated
  USING (owner_id = (SELECT auth.uid()) OR (SELECT public.wm_is_admin()))
  WITH CHECK (owner_id = (SELECT auth.uid()) OR (SELECT public.wm_is_admin()));

CREATE OR REPLACE FUNCTION public.wm_guard_vendor_rating() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user NOT IN ('postgres','supabase_admin','service_role') THEN
    IF TG_OP='INSERT' THEN NEW.rating_avg:=0; NEW.rating_count:=0;
    ELSIF ROW(NEW.rating_avg,NEW.rating_count) IS DISTINCT FROM ROW(OLD.rating_avg,OLD.rating_count) THEN
      RAISE EXCEPTION 'Ratings are computed from reviews.' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_vendor_rating() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_guard_vendor_rating BEFORE INSERT OR UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.wm_guard_vendor_rating();

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['amenity_lookup','languages'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon, authenticated',t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated',t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated',t);
    EXECUTE format('CREATE POLICY lookup_public_read ON public.%I FOR SELECT TO anon,authenticated USING (true)',t);
    EXECUTE format('CREATE POLICY lookup_admin_manage ON public.%I FOR ALL TO authenticated USING ((SELECT public.wm_is_admin())) WITH CHECK ((SELECT public.wm_is_admin()))',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['vendor_amenities','vendor_pricing','vendor_spaces','vendor_team'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated',t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated',t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated',t);
    EXECUTE format('CREATE POLICY vendor_detail_public_read ON public.%I FOR SELECT TO anon,authenticated USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.is_published))',t);
    EXECUTE format('CREATE POLICY vendor_detail_owner_manage ON public.%I FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND (v.owner_id = (SELECT auth.uid()) OR (SELECT public.wm_is_admin())))) WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND (v.owner_id = (SELECT auth.uid()) OR (SELECT public.wm_is_admin()))))',t);
  END LOOP;
END $$;

-- No public proposal or profile-role enumeration through owner-executed views.
ALTER VIEW public.profiles_resolved SET (security_invoker = true);
ALTER VIEW public.vendor_latest_quotes SET (security_invoker = true);
REVOKE ALL ON public.profiles_resolved, public.vendor_latest_quotes FROM anon, authenticated;
GRANT SELECT ON public.profiles_resolved, public.vendor_latest_quotes TO authenticated;
ALTER VIEW public.vendor_public_search SET (security_invoker = true);
ALTER VIEW public.vendor_profile_view SET (security_invoker = true);
ALTER VIEW public.vendor_ratings SET (security_invoker = true);
ALTER VIEW public.reviews_public SET (security_invoker = true);

CREATE OR REPLACE FUNCTION public.is_user(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT _uid = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'user');
$$;
CREATE OR REPLACE FUNCTION public.is_vendor(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT _uid = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'vendor');
$$;
REVOKE ALL ON FUNCTION public.is_user(uuid), public.is_vendor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_user(uuid), public.is_vendor(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_vendor_view_rfq(_uid uuid, _rfq_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT _uid = auth.uid() AND EXISTS (
    SELECT 1 FROM public.rfq_invites i JOIN public.vendors v ON v.id = i.vendor_id
    WHERE i.rfq_id = _rfq_id AND v.owner_id = _uid
  );
$$;
REVOKE ALL ON FUNCTION public.can_vendor_view_rfq(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_vendor_view_rfq(uuid,uuid) TO authenticated;

ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY rfqs_owner_select ON public.rfqs FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));
CREATE POLICY rfqs_vendor_select ON public.rfqs FOR SELECT TO authenticated USING (public.can_vendor_view_rfq((SELECT auth.uid()),id));
CREATE POLICY rfqs_owner_insert ON public.rfqs FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()) AND public.is_user((SELECT auth.uid())));
CREATE POLICY rfqs_owner_update ON public.rfqs FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY rfqs_owner_delete ON public.rfqs FOR DELETE TO authenticated USING (owner_id = (SELECT auth.uid()));

ALTER TABLE public.rfq_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY invites_members_read ON public.rfq_invites FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid())) OR
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.owner_id=(SELECT auth.uid())));
CREATE POLICY invites_owner_insert ON public.rfq_invites FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid()) AND r.accepted_quote_id IS NULL) AND
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.is_published));
CREATE POLICY invites_members_update ON public.rfq_invites FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid())) OR
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.owner_id=(SELECT auth.uid()))) WITH CHECK (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid())) OR
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.owner_id=(SELECT auth.uid())));

CREATE OR REPLACE FUNCTION public.wm_guard_invite() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE is_client boolean;
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN RETURN NEW; END IF;
  IF TG_OP='INSERT' THEN
    NEW.created_at := now();
    NEW.expires_at := least(coalesce(NEW.expires_at,now()+interval '14 days'),now()+interval '14 days');
    NEW.status := 'invited';
    NEW.reveal_email := false; NEW.reveal_phone := false;
    RETURN NEW;
  END IF;
  IF ROW(NEW.rfq_id,NEW.vendor_id,NEW.id,NEW.created_at,NEW.expires_at) IS DISTINCT FROM
     ROW(OLD.rfq_id,OLD.vendor_id,OLD.id,OLD.created_at,OLD.expires_at) THEN
    RAISE EXCEPTION 'Invitation identity and expiry cannot be changed.' USING ERRCODE='42501';
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.rfqs WHERE id=OLD.rfq_id AND owner_id=auth.uid()) INTO is_client;
  IF NOT is_client THEN
    IF ROW(NEW.reveal_email,NEW.reveal_phone,NEW.client_last_read_at) IS DISTINCT FROM
       ROW(OLD.reveal_email,OLD.reveal_phone,OLD.client_last_read_at) OR
       (NEW.status IS DISTINCT FROM OLD.status AND
         (NEW.status NOT IN ('viewed','responded','declined') OR OLD.status IN ('declined','expired','accepted'))) THEN
      RAISE EXCEPTION 'Vendors cannot change client consent or reopen a closed invitation.' USING ERRCODE='42501';
    END IF;
    IF ROW(NEW.closed_at,NEW.closed_reason) IS DISTINCT FROM ROW(OLD.closed_at,OLD.closed_reason) AND
      (OLD.closed_reason IN ('archived_by_client','accepted_other_vendor') OR
       (NEW.closed_reason IS NOT NULL AND NEW.closed_reason <> 'archived_by_vendor')) THEN
      RAISE EXCEPTION 'Only the client can change this closure.' USING ERRCODE='42501';
    END IF;
  ELSIF NEW.vendor_last_read_at IS DISTINCT FROM OLD.vendor_last_read_at THEN
    RAISE EXCEPTION 'Clients cannot change vendor read markers.' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_invite() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER wm_guard_invite BEFORE INSERT OR UPDATE ON public.rfq_invites
  FOR EACH ROW EXECUTE FUNCTION public.wm_guard_invite();

CREATE OR REPLACE FUNCTION public.wm_can_submit_quote(p_rfq uuid,p_vendor uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.rfq_invites i
    JOIN public.vendors v ON v.id=i.vendor_id JOIN public.rfqs r ON r.id=i.rfq_id
    WHERE i.rfq_id=p_rfq AND i.vendor_id=p_vendor AND v.owner_id=auth.uid()
      AND r.accepted_quote_id IS NULL AND i.status NOT IN ('declined','expired','accepted')
      AND i.closed_at IS NULL AND (i.expires_at IS NULL OR i.expires_at>now()));
$$;
REVOKE ALL ON FUNCTION public.wm_can_submit_quote(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wm_can_submit_quote(uuid,uuid) TO authenticated;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.quotes FROM anon,authenticated;
CREATE POLICY quotes_members_select ON public.quotes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid())) OR
  (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.owner_id=(SELECT auth.uid()))
   AND public.can_vendor_view_rfq((SELECT auth.uid()),rfq_id)));
CREATE POLICY quotes_invited_insert ON public.quotes FOR INSERT TO authenticated WITH CHECK (public.wm_can_submit_quote(rfq_id,vendor_id));

CREATE OR REPLACE FUNCTION public.wm_allocate_quote_version() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW.rfq_id::text||'/'||NEW.vendor_id::text,0));
  SELECT coalesce(max(version),0)+1 INTO NEW.version FROM public.quotes WHERE rfq_id=NEW.rfq_id AND vendor_id=NEW.vendor_id;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_allocate_quote_version() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_allocate_quote_version BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.wm_allocate_quote_version();
CREATE UNIQUE INDEX quotes_thread_version_unique ON public.quotes(rfq_id,vendor_id,version);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviews_published_read ON public.reviews FOR SELECT TO anon,authenticated USING (
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.is_published));
CREATE POLICY reviews_author_read ON public.reviews FOR SELECT TO authenticated USING (author_id=(SELECT auth.uid()));
CREATE POLICY reviews_eligible_insert ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  author_id=(SELECT auth.uid()) AND public.can_user_review((SELECT auth.uid()),vendor_id,rfq_id));
CREATE POLICY reviews_author_update ON public.reviews FOR UPDATE TO authenticated
  USING (author_id=(SELECT auth.uid()) AND created_at>=now()-interval '7 days')
  WITH CHECK (author_id=(SELECT auth.uid()) AND created_at>=now()-interval '7 days');
CREATE POLICY reviews_author_delete ON public.reviews FOR DELETE TO authenticated
  USING (author_id=(SELECT auth.uid()) AND created_at>=now()-interval '7 days');
CREATE OR REPLACE FUNCTION public.wm_guard_review_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    IF current_user NOT IN ('postgres','supabase_admin','service_role') THEN NEW.created_at:=now(); END IF;
    RETURN NEW;
  END IF;
  IF current_user NOT IN ('postgres','supabase_admin','service_role') AND
    ROW(NEW.id,NEW.rfq_id,NEW.vendor_id,NEW.author_id,NEW.created_at) IS DISTINCT FROM
    ROW(OLD.id,OLD.rfq_id,OLD.vendor_id,OLD.author_id,OLD.created_at) THEN
    RAISE EXCEPTION 'Review ownership and booking linkage are immutable.' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_review_identity() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_guard_review_identity BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.wm_guard_review_identity();

-- Ratings run with narrowly scoped trigger authority, not the review author's UPDATE rights.
CREATE OR REPLACE FUNCTION public.recalc_vendor_rating(p_vendor_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.vendors v SET rating_avg=a.avg_rating,rating_count=a.cnt
  FROM (SELECT coalesce(avg(stars),0) AS avg_rating,count(*)::integer AS cnt
        FROM public.reviews WHERE vendor_id=p_vendor_id) a WHERE v.id=p_vendor_id;
$$;
CREATE OR REPLACE FUNCTION public.tg_reviews_after_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP='DELETE' THEN PERFORM public.recalc_vendor_rating(OLD.vendor_id);
  ELSE
    PERFORM public.recalc_vendor_rating(NEW.vendor_id);
    IF TG_OP='UPDATE' AND OLD.vendor_id IS DISTINCT FROM NEW.vendor_id THEN PERFORM public.recalc_vendor_rating(OLD.vendor_id); END IF;
  END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.recalc_vendor_rating(uuid),public.tg_reviews_after_write() FROM PUBLIC,anon,authenticated;

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
  IF p_type<>'vendor_new_request' AND NOT EXISTS
    (SELECT 1 FROM public.quotes WHERE id=q_id AND rfq_id=r_id AND vendor_id=v_id) THEN RETURN false; END IF;
  IF p_type='vendor_new_request' THEN RETURN p_actor=client_id AND p_recipient=vendor_owner; END IF;
  IF p_type='vendor_quote_accepted' THEN RETURN p_actor=client_id AND p_recipient=vendor_owner AND accepted_id=q_id; END IF;
  IF p_type='quote_answered' THEN RETURN p_actor=vendor_owner AND p_recipient=client_id; END IF;
  RETURN ((p_actor=client_id AND p_recipient=vendor_owner AND p_data->>'senderRole'='client') OR
          (p_actor=vendor_owner AND p_recipient=client_id AND p_data->>'senderRole'='vendor')) AND EXISTS
    (SELECT 1 FROM public.quote_messages WHERE quote_id=q_id AND sender_id=p_actor AND created_at>=now()-interval '5 minutes');
END $$;
REVOKE ALL ON FUNCTION public.wm_notification_allowed(uuid,uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wm_notification_allowed(uuid,uuid,text,jsonb) TO authenticated;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_recipient_select ON public.notifications FOR SELECT TO authenticated USING (recipient_id=(SELECT auth.uid()));
CREATE POLICY notifications_member_insert ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.wm_notification_allowed(recipient_id,actor_id,type,data));
CREATE POLICY notifications_recipient_update ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id=(SELECT auth.uid())) WITH CHECK (recipient_id=(SELECT auth.uid()));
CREATE POLICY notifications_recipient_delete ON public.notifications FOR DELETE TO authenticated USING (recipient_id=(SELECT auth.uid()));
REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE(read_at,deleted_at) ON public.notifications TO authenticated;

CREATE INDEX IF NOT EXISTS vendor_spaces_vendor_id_idx ON public.vendor_spaces(vendor_id);
CREATE INDEX IF NOT EXISTS quote_messages_sender_id_idx ON public.quote_messages(sender_id);
CREATE INDEX IF NOT EXISTS vendor_amenities_amenity_key_idx ON public.vendor_amenities(amenity_key);
CREATE INDEX IF NOT EXISTS vendor_categories_category_id_idx ON public.vendor_categories(category_id);
CREATE INDEX IF NOT EXISTS notifications_actor_created_idx ON public.notifications(actor_id,created_at);
CREATE INDEX IF NOT EXISTS rfq_invites_vendor_activity_idx ON public.rfq_invites(vendor_id,last_activity_at DESC);
CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx ON public.notifications(recipient_id,created_at DESC) WHERE read_at IS NULL AND deleted_at IS NULL;
-- Remove duplicate timestamp work; keep the canonical quotes_set_updated_at trigger.
DROP TRIGGER IF EXISTS trg_quotes_touch ON public.quotes;
NOTIFY pgrst, 'reload schema';
COMMIT;
