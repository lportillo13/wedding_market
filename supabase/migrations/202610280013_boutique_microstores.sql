BEGIN;
SET LOCAL lock_timeout='5s';

CREATE TABLE public.boutiques (
 vendor_id uuid PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
 enabled boolean NOT NULL DEFAULT false,
 duration_minutes integer NOT NULL DEFAULT 60 CHECK(duration_minutes BETWEEN 15 AND 180),
 companions_max integer NOT NULL DEFAULT 2 CHECK(companions_max BETWEEN 0 AND 10),
 visit_fee_cents integer NOT NULL DEFAULT 0 CHECK(visit_fee_cents BETWEEN 0 AND 100000000),
 currency text NOT NULL DEFAULT 'CRC' CHECK(currency IN ('CRC','USD')),
 policies jsonb NOT NULL DEFAULT '{"en":"","es":""}' CHECK(jsonb_typeof(policies)='object' AND length(policies::text)<=6000),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE public.boutique_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vendor_id uuid NOT NULL REFERENCES public.boutiques(vendor_id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('dress','suit')),
 name jsonb NOT NULL CHECK(jsonb_typeof(name)='object' AND length(name::text)<=400),
 description jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(description)='object' AND length(description::text)<=6000),
 designer text NOT NULL DEFAULT '' CHECK(length(designer)<=160),reference text NOT NULL DEFAULT '' CHECK(length(reference)<=120),
 offer text NOT NULL CHECK(offer IN ('purchase','rental','both')),
 details jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(details)='object' AND length(details::text)<=4000),
 sample_sizes text NOT NULL DEFAULT '' CHECK(length(sample_sizes)<=300),order_sizes text NOT NULL DEFAULT '' CHECK(length(order_sizes)<=300),
 lead_time text NOT NULL DEFAULT '' CHECK(length(lead_time)<=500),
 price_cents integer CHECK(price_cents BETWEEN 0 AND 1000000000),currency text NOT NULL DEFAULT 'CRC' CHECK(currency IN ('CRC','USD')),
 media jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(media)='array' AND jsonb_array_length(media)<=6),
 is_published boolean NOT NULL DEFAULT false,updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX boutique_items_vendor_idx ON public.boutique_items(vendor_id,updated_at DESC,id);
CREATE TABLE public.boutique_favorites (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 item_id uuid NOT NULL REFERENCES public.boutique_items(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,item_id)
);
CREATE INDEX boutique_favorites_item_idx ON public.boutique_favorites(item_id);
CREATE TABLE public.boutique_appointments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vendor_id uuid NOT NULL REFERENCES public.boutiques(vendor_id) ON DELETE CASCADE,
 client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 submission_id uuid NOT NULL,request_fingerprint jsonb NOT NULL,
 starts_at timestamptz NOT NULL,duration_minutes integer NOT NULL,
 wedding_date date,companions integer NOT NULL CHECK(companions BETWEEN 0 AND 10),
 size_note text NOT NULL DEFAULT '' CHECK(length(size_note)<=300),budget text NOT NULL DEFAULT '' CHECK(length(budget)<=120),
 note text NOT NULL DEFAULT '' CHECK(length(note)<=2000),
 status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','confirmed','declined','cancelled')),
 version integer NOT NULL DEFAULT 1,store_note text NOT NULL DEFAULT '' CHECK(length(store_note)<=2000),
 items_snapshot jsonb NOT NULL DEFAULT '[]',policies_snapshot jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(client_id,submission_id)
);
CREATE INDEX boutique_appointments_client_idx ON public.boutique_appointments(client_id,created_at DESC,id);
CREATE INDEX boutique_appointments_vendor_idx ON public.boutique_appointments(vendor_id,created_at DESC,id);
CREATE INDEX boutique_appointments_calendar_idx ON public.boutique_appointments(vendor_id,starts_at) WHERE status='confirmed';
CREATE TABLE public.boutique_appointment_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),appointment_id uuid NOT NULL REFERENCES public.boutique_appointments(id) ON DELETE CASCADE,
 sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,submission_id uuid NOT NULL,
 body text NOT NULL CHECK(length(btrim(body)) BETWEEN 1 AND 2000),created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(sender_id,submission_id)
);
CREATE INDEX boutique_appointment_messages_thread_idx ON public.boutique_appointment_messages(appointment_id,created_at,id);

CREATE FUNCTION public.wm_boutique_owner(p_vendor uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.wm_account_exists() AND EXISTS(SELECT 1 FROM public.vendors WHERE id=p_vendor AND owner_id=auth.uid());
$$;
CREATE FUNCTION public.wm_boutique_public(p_vendor uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.boutiques b JOIN public.vendors v ON v.id=b.vendor_id JOIN public.profiles p ON p.id=v.owner_id
 WHERE b.vendor_id=p_vendor AND b.enabled AND v.is_published AND p.suspended_at IS NULL);
$$;
CREATE FUNCTION public.wm_boutique_participant(p_appointment uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.wm_account_exists() AND EXISTS(SELECT 1 FROM public.boutique_appointments a JOIN public.vendors v ON v.id=a.vendor_id
 WHERE a.id=p_appointment AND auth.uid() IN (a.client_id,v.owner_id));
$$;
CREATE FUNCTION public.wm_boutique_contact(p_client uuid,p_vendor uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT NOT EXISTS(SELECT 1 FROM public.user_blocks b JOIN public.vendors v ON v.id=p_vendor
 WHERE (b.blocker_id=p_client AND b.blocked_id=v.owner_id) OR (b.blocker_id=v.owner_id AND b.blocked_id=p_client));
$$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['boutiques','boutique_items','boutique_favorites','boutique_appointments','boutique_appointment_messages'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 END LOOP;
END $$;
CREATE POLICY boutique_owner_read ON public.boutiques FOR SELECT TO authenticated USING(public.wm_boutique_owner(vendor_id));
CREATE POLICY boutique_item_owner_read ON public.boutique_items FOR SELECT TO authenticated USING(public.wm_boutique_owner(vendor_id));
CREATE POLICY boutique_favorite_owner_read ON public.boutique_favorites FOR SELECT TO authenticated USING(user_id=auth.uid() AND public.wm_account_exists());
CREATE POLICY boutique_appointment_read ON public.boutique_appointments FOR SELECT TO authenticated USING(public.wm_boutique_participant(id));
CREATE POLICY boutique_message_read ON public.boutique_appointment_messages FOR SELECT TO authenticated USING(public.wm_boutique_participant(appointment_id));
CREATE TRIGGER wm_content_safety BEFORE INSERT OR UPDATE ON public.boutiques FOR EACH ROW EXECUTE FUNCTION public.wm_guard_content_safety();
CREATE TRIGGER wm_content_safety BEFORE INSERT OR UPDATE ON public.boutique_items FOR EACH ROW EXECUTE FUNCTION public.wm_guard_content_safety();
CREATE TRIGGER wm_content_safety BEFORE INSERT ON public.boutique_appointments FOR EACH ROW EXECUTE FUNCTION public.wm_guard_content_safety();
CREATE TRIGGER wm_store_note_safety BEFORE UPDATE ON public.boutique_appointments FOR EACH ROW WHEN (NEW.store_note IS DISTINCT FROM OLD.store_note) EXECUTE FUNCTION public.wm_guard_content_safety();
CREATE TRIGGER wm_content_safety BEFORE INSERT ON public.boutique_appointment_messages FOR EACH ROW EXECUTE FUNCTION public.wm_guard_content_safety();

-- Public projection never exposes owners, private appointments or guest prices/contact details.
CREATE FUNCTION public.boutique_storefront(p_slug text DEFAULT NULL,p_page integer DEFAULT 1,p_kind text DEFAULT NULL,p_item uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE shop jsonb; vid uuid; client_access boolean:=public.wm_account_exists() AND public.is_user(auth.uid());
BEGIN
 IF p_page NOT BETWEEN 1 AND 1000 OR (p_kind IS NOT NULL AND p_kind NOT IN ('dress','suit')) THEN RAISE EXCEPTION 'Invalid page or category' USING ERRCODE='22023'; END IF;
 IF p_slug IS NULL THEN
  RETURN jsonb_build_object('items',coalesce((SELECT jsonb_agg(x.item) FROM (
   SELECT jsonb_build_object('vendor_id',v.id,'slug',v.slug,'name',v.business_name,'bio',v.bio,'hero_image',v.hero_image,
   'city',l.city,'region',l.region,'logo',v.logo_url) item FROM public.boutiques b JOIN public.vendors v ON v.id=b.vendor_id
   LEFT JOIN public.vendor_locations l ON l.vendor_id=v.id WHERE public.wm_boutique_public(v.id)
   ORDER BY v.business_name,v.id LIMIT 12 OFFSET (p_page-1)*12) x),'[]'::jsonb));
 END IF;
 SELECT v.id,to_jsonb(b)||jsonb_build_object('slug',v.slug,'name',v.business_name,'bio',v.bio,'hero_image',v.hero_image,
 'logo',v.logo_url,'city',l.city,'region',l.region,'languages',v.languages,
 'address',CASE WHEN client_access THEN v.address_label ELSE NULL END,'map_url',CASE WHEN client_access THEN v.map_url ELSE NULL END)
 INTO vid,shop FROM public.boutiques b JOIN public.vendors v ON v.id=b.vendor_id LEFT JOIN public.vendor_locations l ON l.vendor_id=v.id
 WHERE v.slug=p_slug AND public.wm_boutique_public(v.id);
 IF vid IS NULL THEN RETURN NULL; END IF;
 RETURN shop||jsonb_build_object('items',coalesce((SELECT jsonb_agg(x.item) FROM (
 SELECT to_jsonb(i)||jsonb_build_object('price_cents',CASE WHEN client_access THEN i.price_cents ELSE NULL END) item
 FROM public.boutique_items i WHERE i.vendor_id=vid AND i.is_published AND (p_kind IS NULL OR i.kind=p_kind) AND (p_item IS NULL OR i.id=p_item)
 ORDER BY i.updated_at DESC,i.id LIMIT 12 OFFSET (p_page-1)*12) x),'[]'::jsonb));
END $$;

CREATE FUNCTION public.save_boutique(p_vendor uuid,p_data jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.wm_boutique_owner(p_vendor) THEN RAISE EXCEPTION 'Vendor access required' USING ERRCODE='42501'; END IF;
 INSERT INTO public.boutiques(vendor_id,enabled,duration_minutes,companions_max,visit_fee_cents,currency,policies)
 VALUES(p_vendor,(p_data->>'enabled')::boolean,(p_data->>'duration_minutes')::integer,(p_data->>'companions_max')::integer,
 (p_data->>'visit_fee_cents')::integer,p_data->>'currency',p_data->'policies')
 ON CONFLICT(vendor_id) DO UPDATE SET enabled=excluded.enabled,duration_minutes=excluded.duration_minutes,
 companions_max=excluded.companions_max,visit_fee_cents=excluded.visit_fee_cents,currency=excluded.currency,policies=excluded.policies,updated_at=clock_timestamp();
END $$;
CREATE FUNCTION public.save_boutique_item(p_vendor uuid,p_id uuid,p_data jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v public.vendors; selected_media jsonb; iid uuid:=coalesce(p_id,gen_random_uuid());
BEGIN
 SELECT * INTO v FROM public.vendors WHERE id=p_vendor FOR UPDATE;
 IF NOT public.wm_boutique_owner(p_vendor) OR NOT EXISTS(SELECT 1 FROM public.boutiques WHERE vendor_id=p_vendor) THEN RAISE EXCEPTION 'Boutique access required' USING ERRCODE='42501'; END IF;
 IF p_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.boutique_items WHERE id=p_id AND vendor_id=p_vendor) THEN RAISE EXCEPTION 'Outfit unavailable' USING ERRCODE='42501'; END IF;
 IF p_id IS NULL AND (SELECT count(*) FROM public.boutique_items WHERE vendor_id=p_vendor)>=60 THEN RAISE EXCEPTION 'Collection limit reached' USING ERRCODE='22023'; END IF;
 IF jsonb_typeof(p_data->'media_indexes') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'media_indexes')>6 THEN RAISE EXCEPTION 'Invalid media selection' USING ERRCODE='22023'; END IF;
 SELECT coalesce(jsonb_agg(asset ORDER BY position),'[]'::jsonb) INTO selected_media FROM jsonb_array_elements(coalesce(v.gallery_images,'[]')) WITH ORDINALITY AS library(asset,position)
 WHERE (position-1)::text IN (SELECT jsonb_array_elements_text(p_data->'media_indexes'));
 IF jsonb_array_length(selected_media)<>jsonb_array_length(p_data->'media_indexes') THEN RAISE EXCEPTION 'Reload your media library' USING ERRCODE='22023'; END IF;
 IF coalesce((p_data->>'is_published')::boolean,false) AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(selected_media) a WHERE coalesce(a->>'type','image')<>'video' AND coalesce(a->>'format','') NOT IN ('mp4','webm','mov')) THEN RAISE EXCEPTION 'A photo is required' USING ERRCODE='22023'; END IF;
 IF length(btrim(coalesce(p_data->'name'->>'en','')))=0 AND length(btrim(coalesce(p_data->'name'->>'es','')))=0 THEN RAISE EXCEPTION 'Outfit name required' USING ERRCODE='22023'; END IF;
 INSERT INTO public.boutique_items(id,vendor_id,kind,name,description,designer,reference,offer,details,sample_sizes,order_sizes,lead_time,price_cents,currency,media,is_published)
 VALUES(iid,p_vendor,p_data->>'kind',p_data->'name',p_data->'description',p_data->>'designer',p_data->>'reference',p_data->>'offer',p_data->'details',
 p_data->>'sample_sizes',p_data->>'order_sizes',p_data->>'lead_time',(p_data->>'price_cents')::integer,p_data->>'currency',selected_media,(p_data->>'is_published')::boolean)
 ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,name=excluded.name,description=excluded.description,designer=excluded.designer,
 reference=excluded.reference,offer=excluded.offer,details=excluded.details,sample_sizes=excluded.sample_sizes,order_sizes=excluded.order_sizes,
 lead_time=excluded.lead_time,price_cents=excluded.price_cents,currency=excluded.currency,media=excluded.media,is_published=excluded.is_published,updated_at=clock_timestamp();
 RETURN iid;
END $$;

CREATE FUNCTION public.set_boutique_favorite(p_item uuid,p_saved boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.wm_account_exists() THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
 IF NOT p_saved THEN DELETE FROM public.boutique_favorites WHERE user_id=auth.uid() AND item_id=p_item; RETURN; END IF;
 PERFORM 1 FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.boutique_items WHERE id=p_item AND is_published AND public.wm_boutique_public(vendor_id)) THEN RAISE EXCEPTION 'Outfit unavailable' USING ERRCODE='22023'; END IF;
 IF (SELECT count(*) FROM public.boutique_favorites WHERE user_id=auth.uid())>=200 AND NOT EXISTS(SELECT 1 FROM public.boutique_favorites WHERE user_id=auth.uid() AND item_id=p_item) THEN RAISE EXCEPTION 'Favorite limit reached' USING ERRCODE='22023'; END IF;
 INSERT INTO public.boutique_favorites(user_id,item_id) VALUES(auth.uid(),p_item) ON CONFLICT DO NOTHING;
END $$;
CREATE FUNCTION public.boutique_saved_outfits(p_page integer DEFAULT 1) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.wm_account_exists() THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
 IF p_page NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 RETURN coalesce((SELECT jsonb_agg(x.item) FROM (SELECT to_jsonb(i)||jsonb_build_object('slug',v.slug,'vendor_name',v.business_name,
 'price_cents',CASE WHEN public.is_user(auth.uid()) THEN i.price_cents ELSE NULL END) item FROM public.boutique_favorites f
 JOIN public.boutique_items i ON i.id=f.item_id JOIN public.vendors v ON v.id=i.vendor_id
 WHERE f.user_id=auth.uid() AND i.is_published AND public.wm_boutique_public(i.vendor_id)
 ORDER BY f.created_at DESC,f.item_id LIMIT 12 OFFSET (p_page-1)*12) x),'[]'::jsonb);
END $$;

CREATE FUNCTION public.request_boutique_appointment(p_vendor uuid,p_submission uuid,p_data jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b public.boutiques; old public.boutique_appointments; result_id uuid; ids uuid[]; snapshots jsonb; start_time timestamptz;
BEGIN
 IF NOT public.wm_account_exists() OR NOT public.is_user(auth.uid()) THEN RAISE EXCEPTION 'Client account required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 SELECT * INTO old FROM public.boutique_appointments WHERE client_id=auth.uid() AND submission_id=p_submission;
 IF FOUND THEN
  IF old.vendor_id<>p_vendor OR old.request_fingerprint IS DISTINCT FROM p_data THEN RAISE EXCEPTION 'A retry cannot change an existing request' USING ERRCODE='22023'; END IF;
  RETURN old.id;
 END IF;
 SELECT * INTO b FROM public.boutiques WHERE vendor_id=p_vendor FOR UPDATE;
 IF NOT FOUND OR NOT public.wm_boutique_public(p_vendor) OR public.wm_boutique_owner(p_vendor) OR NOT public.wm_boutique_contact(auth.uid(),p_vendor) THEN RAISE EXCEPTION 'Boutique unavailable' USING ERRCODE='42501'; END IF;
 IF (p_data->>'policies_version')::timestamptz IS DISTINCT FROM b.updated_at OR p_data->>'accepted' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Review current visit policies' USING ERRCODE='22023'; END IF;
 start_time:=(p_data->>'starts_at')::timestamptz;
 IF start_time IS NULL OR start_time<=now() OR start_time>now()+interval '2 years' OR (p_data->>'companions')::integer>b.companions_max THEN RAISE EXCEPTION 'Invalid date or companions' USING ERRCODE='22023'; END IF;
 IF (SELECT count(*) FROM public.boutique_appointments WHERE client_id=auth.uid() AND status='requested')>=20 THEN RAISE EXCEPTION 'Please manage your pending visits first' USING ERRCODE='22023'; END IF;
 SELECT coalesce(array_agg(x::uuid),'{}'::uuid[]) INTO ids FROM jsonb_array_elements_text(p_data->'items') x;
 IF cardinality(ids)>5 OR cardinality(ids)<>(SELECT count(DISTINCT x) FROM unnest(ids) x) THEN RAISE EXCEPTION 'Select up to five different outfits' USING ERRCODE='22023'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'kind',kind)),'[]'::jsonb) INTO snapshots FROM public.boutique_items
 WHERE id=ANY(ids) AND vendor_id=p_vendor AND is_published;
 IF jsonb_array_length(snapshots)<>cardinality(ids) THEN RAISE EXCEPTION 'An outfit is no longer available' USING ERRCODE='22023'; END IF;
 INSERT INTO public.boutique_appointments(vendor_id,client_id,submission_id,request_fingerprint,starts_at,duration_minutes,wedding_date,companions,size_note,budget,note,items_snapshot,policies_snapshot)
 VALUES(p_vendor,auth.uid(),p_submission,p_data,start_time,b.duration_minutes,nullif(p_data->>'wedding_date','')::date,
 (p_data->>'companions')::integer,coalesce(p_data->>'size_note',''),coalesce(p_data->>'budget',''),coalesce(p_data->>'note',''),snapshots,
 jsonb_build_object('policies',b.policies,'visit_fee_cents',b.visit_fee_cents,'currency',b.currency,'version',b.updated_at)) RETURNING id INTO result_id;
 RETURN result_id;
END $$;
CREATE FUNCTION public.decide_boutique_appointment(p_id uuid,p_status text,p_version integer,p_note text DEFAULT '') RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.boutique_appointments; own boolean;
BEGIN
 IF NOT public.wm_boutique_participant(p_id) THEN RAISE EXCEPTION 'Appointment access required' USING ERRCODE='42501'; END IF;
 -- All confirmations in one store serialize, preventing concurrent double bookings.
 PERFORM 1 FROM public.boutiques WHERE vendor_id=(SELECT vendor_id FROM public.boutique_appointments WHERE id=p_id) FOR UPDATE;
 SELECT * INTO STRICT a FROM public.boutique_appointments WHERE id=p_id FOR UPDATE;
 own:=public.wm_boutique_owner(a.vendor_id);
 IF p_status NOT IN ('confirmed','declined','cancelled') OR (p_status IN ('confirmed','declined') AND NOT own) THEN RAISE EXCEPTION 'Decision not permitted' USING ERRCODE='42501'; END IF;
 IF a.status=p_status THEN RETURN; END IF;
 IF a.version<>p_version OR a.status IN ('cancelled','declined') OR (a.status='confirmed' AND p_status<>'cancelled') THEN RAISE EXCEPTION 'Appointment changed; refresh before deciding' USING ERRCODE='40001'; END IF;
 IF length(p_note)>2000 THEN RAISE EXCEPTION 'Note too long' USING ERRCODE='22023'; END IF;
 IF p_status='confirmed' THEN
  IF a.starts_at<=now() OR NOT public.wm_boutique_contact(a.client_id,a.vendor_id) THEN RAISE EXCEPTION 'Visit cannot be confirmed' USING ERRCODE='42501'; END IF;
  IF EXISTS(SELECT 1 FROM public.boutique_appointments x WHERE x.vendor_id=a.vendor_id AND x.id<>a.id AND x.status='confirmed'
   AND x.starts_at<a.starts_at+make_interval(mins=>a.duration_minutes) AND x.starts_at+make_interval(mins=>x.duration_minutes)>a.starts_at) THEN RAISE EXCEPTION 'Another visit is already confirmed at that time' USING ERRCODE='22023'; END IF;
 END IF;
 UPDATE public.boutique_appointments SET status=p_status,version=version+1,store_note=CASE WHEN own THEN p_note ELSE store_note END,updated_at=now() WHERE id=p_id;
END $$;
CREATE FUNCTION public.boutique_appointment_inbox(p_page integer DEFAULT 1,p_id uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.wm_account_exists() THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
 IF p_page NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 RETURN coalesce((SELECT jsonb_agg(x.item) FROM (SELECT (to_jsonb(a)-'request_fingerprint'-'submission_id')||jsonb_build_object(
 'vendor_name',v.business_name,'client_name',p.full_name,'messages',CASE WHEN p_id IS NOT NULL THEN
 coalesce((SELECT jsonb_agg(to_jsonb(m)-'submission_id' ORDER BY m.created_at,m.id) FROM (SELECT * FROM public.boutique_appointment_messages
 WHERE appointment_id=a.id ORDER BY created_at DESC,id DESC LIMIT 50) m),'[]'::jsonb) ELSE '[]'::jsonb END) item
 FROM public.boutique_appointments a JOIN public.vendors v ON v.id=a.vendor_id JOIN public.profiles p ON p.id=a.client_id
 WHERE auth.uid() IN (a.client_id,v.owner_id) AND (p_id IS NULL OR a.id=p_id)
 ORDER BY a.created_at DESC,a.id LIMIT 12 OFFSET (p_page-1)*12) x),'[]'::jsonb);
END $$;
CREATE FUNCTION public.reply_boutique_appointment(p_id uuid,p_submission uuid,p_body text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.boutique_appointments; old public.boutique_appointment_messages;
BEGIN
 IF NOT public.wm_boutique_participant(p_id) THEN RAISE EXCEPTION 'Appointment access required' USING ERRCODE='42501'; END IF;
 SELECT * INTO STRICT a FROM public.boutique_appointments WHERE id=p_id FOR UPDATE;
 IF NOT public.wm_boutique_contact(a.client_id,a.vendor_id) THEN RAISE EXCEPTION 'This contact cannot receive messages' USING ERRCODE='42501'; END IF;
 SELECT * INTO old FROM public.boutique_appointment_messages WHERE sender_id=auth.uid() AND submission_id=p_submission;
 IF FOUND THEN
  IF old.appointment_id<>p_id OR old.body IS DISTINCT FROM btrim(p_body) THEN RAISE EXCEPTION 'A retry cannot replace a message' USING ERRCODE='22023'; END IF;
  RETURN;
 END IF;
 IF (SELECT count(*) FROM public.boutique_appointment_messages WHERE appointment_id=p_id)>=500 THEN RAISE EXCEPTION 'Conversation limit reached' USING ERRCODE='22023'; END IF;
 INSERT INTO public.boutique_appointment_messages(appointment_id,sender_id,submission_id,body) VALUES(p_id,auth.uid(),p_submission,btrim(p_body));
END $$;

REVOKE ALL ON FUNCTION public.wm_boutique_owner(uuid),public.wm_boutique_public(uuid),public.wm_boutique_participant(uuid),public.wm_boutique_contact(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wm_boutique_owner(uuid),public.wm_boutique_participant(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.boutique_storefront(text,integer,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.boutique_storefront(text,integer,text,uuid) TO anon,authenticated;
REVOKE ALL ON FUNCTION public.save_boutique(uuid,jsonb),public.save_boutique_item(uuid,uuid,jsonb),public.set_boutique_favorite(uuid,boolean),public.boutique_saved_outfits(integer),public.request_boutique_appointment(uuid,uuid,jsonb),public.decide_boutique_appointment(uuid,text,integer,text),public.boutique_appointment_inbox(integer,uuid),public.reply_boutique_appointment(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_boutique(uuid,jsonb),public.save_boutique_item(uuid,uuid,jsonb),public.set_boutique_favorite(uuid,boolean),public.boutique_saved_outfits(integer),public.request_boutique_appointment(uuid,uuid,jsonb),public.decide_boutique_appointment(uuid,text,integer,text),public.boutique_appointment_inbox(integer,uuid),public.reply_boutique_appointment(uuid,uuid,text) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
