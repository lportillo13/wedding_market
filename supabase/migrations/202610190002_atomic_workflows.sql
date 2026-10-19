BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';

-- All section writes, including settings, commit together. Invoker authority
-- preserves RLS, and the vendor row lock serializes concurrent replacements.
CREATE FUNCTION public.replace_vendor_section(p_vendor uuid,p_section text,p_rows jsonb,p_settings jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  PERFORM 1 FROM public.vendors WHERE id=p_vendor AND owner_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Vendor ownership required.' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(p_rows) IS DISTINCT FROM 'array' OR jsonb_typeof(p_settings) IS DISTINCT FROM 'object'
     OR pg_column_size(p_rows)>131072 OR pg_column_size(p_settings)>16384 OR jsonb_array_length(p_rows)>366 THEN
    RAISE EXCEPTION 'Invalid or oversized section.' USING ERRCODE='22023'; END IF;
  IF p_section='pricing' THEN
    IF jsonb_array_length(p_rows)>100 THEN RAISE EXCEPTION 'Too many pricing items.'; END IF;
    DELETE FROM public.vendor_pricing WHERE vendor_id=p_vendor;
    INSERT INTO public.vendor_pricing(vendor_id,item_key,price_cents,currency,contact_for_price,notes)
      SELECT p_vendor,x.item_key,x.price_cents,coalesce(x.currency,'USD'),coalesce(x.contact_for_price,false),coalesce(x.notes,'{}'::jsonb)
      FROM jsonb_to_recordset(p_rows) AS x(item_key text,price_cents bigint,currency text,contact_for_price boolean,notes jsonb);
    IF EXISTS (SELECT 1 FROM public.vendor_pricing WHERE vendor_id=p_vendor AND
      (length(item_key)>120 OR length(currency)<>3 OR price_cents<0)) THEN RAISE EXCEPTION 'Invalid pricing item.'; END IF;
    UPDATE public.vendors SET
      pricing_typical_spend_cents=(p_settings->>'pricing_typical_spend_cents')::bigint,
      pricing_typical_spend_currency=coalesce(p_settings->>'pricing_typical_spend_currency','USD'),
      pricing_peak_seasons=ARRAY(SELECT jsonb_array_elements_text(coalesce(p_settings->'pricing_peak_seasons','[]'::jsonb))) WHERE id=p_vendor;
  ELSIF p_section='amenities' THEN
    DELETE FROM public.vendor_amenities WHERE vendor_id=p_vendor;
    INSERT INTO public.vendor_amenities(vendor_id,amenity_key)
      SELECT p_vendor,x.amenity_key FROM jsonb_to_recordset(p_rows) AS x(amenity_key text);
    UPDATE public.vendors SET capacity_max=(p_settings->>'capacity_max')::integer,
      event_types=ARRAY(SELECT jsonb_array_elements_text(coalesce(p_settings->'event_types','[]'::jsonb))) WHERE id=p_vendor;
  ELSIF p_section='team' THEN
    IF jsonb_array_length(p_rows)>50 THEN RAISE EXCEPTION 'Too many team members.'; END IF;
    DELETE FROM public.vendor_team WHERE vendor_id=p_vendor;
    INSERT INTO public.vendor_team(vendor_id,name,title,bio,headshot_url,responds_within_hours,sort_order)
      SELECT p_vendor,x.name,x.title,x.bio,x.headshot_url,x.responds_within_hours,x.sort_order
      FROM jsonb_to_recordset(p_rows) AS x(name text,title jsonb,bio jsonb,headshot_url text,responds_within_hours integer,sort_order integer);
  ELSIF p_section='availability' THEN
    DELETE FROM public.vendor_availability WHERE vendor_id=p_vendor;
    INSERT INTO public.vendor_availability(vendor_id,available_on,availability_status)
      SELECT p_vendor,x.available_on,coalesce(x.availability_status,'available')
      FROM jsonb_to_recordset(p_rows) AS x(available_on date,availability_status text);
  ELSE RAISE EXCEPTION 'Unknown vendor section.' USING ERRCODE='22023'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.replace_vendor_section(uuid,text,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.replace_vendor_section(uuid,text,jsonb,jsonb) TO authenticated;

CREATE FUNCTION public.accept_vendor_quote(p_rfq uuid,p_quote uuid,p_reveal_email boolean DEFAULT false,p_reveal_phone boolean DEFAULT false)
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
  UPDATE public.rfqs SET accepted_quote_id=p_quote,accepted_at=now() WHERE id=p_rfq;
  UPDATE public.rfq_invites SET status='accepted',reveal_email=coalesce(p_reveal_email,false),reveal_phone=coalesce(p_reveal_phone,false),
    last_activity_at=now(),client_last_read_at=now(),closed_at=NULL,closed_reason=NULL WHERE rfq_id=p_rfq AND vendor_id=q.vendor_id;
  UPDATE public.rfq_invites SET status='declined',closed_at=now(),closed_reason='accepted_other_vendor',last_activity_at=now()
    WHERE rfq_id=p_rfq AND vendor_id<>q.vendor_id;
  RETURN jsonb_build_object('vendorId',q.vendor_id,'alreadyAccepted',false);
END $$;
REVOKE ALL ON FUNCTION public.accept_vendor_quote(uuid,uuid,boolean,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.accept_vendor_quote(uuid,uuid,boolean,boolean) TO authenticated;

-- A valid accepted quote must always belong to the same RFQ and invitation.
CREATE FUNCTION public.wm_guard_rfq_booking() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND OLD.accepted_quote_id IS NOT NULL AND
     ROW(NEW.accepted_quote_id,NEW.accepted_at) IS DISTINCT FROM ROW(OLD.accepted_quote_id,OLD.accepted_at) THEN
    RAISE EXCEPTION 'An accepted booking cannot be replaced.' USING ERRCODE='42501'; END IF;
  IF NEW.accepted_quote_id IS NOT NULL AND (TG_OP='INSERT' OR NEW.accepted_quote_id IS DISTINCT FROM OLD.accepted_quote_id) THEN
    IF NOT EXISTS (SELECT 1 FROM public.quotes q JOIN public.rfq_invites i ON i.rfq_id=q.rfq_id AND i.vendor_id=q.vendor_id
      WHERE q.id=NEW.accepted_quote_id AND q.rfq_id=NEW.id AND i.status NOT IN ('declined','expired')
      AND i.closed_at IS NULL AND (i.expires_at IS NULL OR i.expires_at>now())) THEN
      RAISE EXCEPTION 'Invalid booking linkage.' USING ERRCODE='42501'; END IF;
    NEW.accepted_at:=now();
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_rfq_booking() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_guard_rfq_booking BEFORE INSERT OR UPDATE ON public.rfqs FOR EACH ROW EXECUTE FUNCTION public.wm_guard_rfq_booking();

CREATE FUNCTION public.wm_guard_message() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN RETURN NEW; END IF;
  IF length(trim(NEW.body)) NOT BETWEEN 1 AND 10000 OR NOT EXISTS (
    SELECT 1 FROM public.quotes q JOIN public.rfqs r ON r.id=q.rfq_id
    JOIN public.rfq_invites i ON i.rfq_id=q.rfq_id AND i.vendor_id=q.vendor_id
    WHERE q.id=NEW.quote_id AND i.closed_at IS NULL AND i.status NOT IN ('declined','expired') AND
      ((r.accepted_quote_id IS NULL AND (i.expires_at IS NULL OR i.expires_at>now())) OR
       EXISTS (SELECT 1 FROM public.quotes winning WHERE winning.id=r.accepted_quote_id AND winning.vendor_id=q.vendor_id))) THEN
    RAISE EXCEPTION 'This conversation is closed or the message is invalid.' USING ERRCODE='42501'; END IF;
  NEW.created_at:=now(); NEW.updated_at:=now();
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_message() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_guard_message BEFORE INSERT ON public.quote_messages FOR EACH ROW EXECUTE FUNCTION public.wm_guard_message();
NOTIFY pgrst,'reload schema';
COMMIT;
