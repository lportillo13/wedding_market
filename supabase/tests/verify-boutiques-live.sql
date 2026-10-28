-- Isolated synthetic records. The deliberate exception rolls back the entire
-- inner subtransaction on success; any unexpected error rolls back the DO too.
DO $wm_verify$
DECLARE
 client_a uuid:='b0130000-0000-4000-8000-000000000001';
 client_b uuid:='b0130000-0000-4000-8000-000000000002';
 owner_a uuid:='b0130000-0000-4000-8000-000000000003';
 stranger uuid:='b0130000-0000-4000-8000-000000000004';
 store_a uuid:='b0130000-0000-4000-8000-000000000011';
 outfit uuid; visit_a uuid; visit_b uuid; settings jsonb; garment jsonb; request_data jsonb; policies_at text; n integer;
BEGIN
 BEGIN
  IF EXISTS(SELECT 1 FROM auth.users WHERE id IN(client_a,client_b,owner_a,stranger)) THEN RAISE EXCEPTION 'Reserved test identities already exist'; END IF;
  PERFORM set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claim.role','service_role',true);
  INSERT INTO auth.users(id) VALUES(client_a),(client_b),(owner_a),(stranger);
  INSERT INTO public.profiles(id,role,full_name,community_terms_version,community_terms_accepted_at)
  VALUES(client_a,'user','Synthetic boutique client A','2026-10-26',now()),(client_b,'user','Synthetic boutique client B','2026-10-26',now()),
  (owner_a,'vendor','Synthetic boutique owner','2026-10-26',now()),(stranger,'user','Synthetic stranger','2026-10-26',now())
  ON CONFLICT(id) DO UPDATE SET role=excluded.role,community_terms_version=excluded.community_terms_version,community_terms_accepted_at=excluded.community_terms_accepted_at;
  INSERT INTO public.vendors(id,owner_id,slug,business_name,is_published,gallery_images)
  VALUES(store_a,owner_a,'wm-boutique-rollback-test','Synthetic rollback-only boutique',true,'[{"url":"https://example.invalid/boutique-test.jpg","type":"image"}]');
  settings:='{"enabled":true,"duration_minutes":60,"companions_max":2,"visit_fee_cents":0,"currency":"CRC","policies":{"en":"Synthetic visit policy","es":"Política de prueba"}}';
  garment:='{"kind":"dress","name":{"en":"Synthetic gown","es":"Vestido de prueba"},"description":{"en":"Synthetic","es":"Prueba"},"designer":"Test","reference":"TEST","offer":"purchase","details":{"silhouette":"A-line"},"sample_sizes":"US 12","order_sizes":"US 4–24","lead_time":"Test only","price_cents":10000,"currency":"CRC","media_indexes":[0],"is_published":true}';
  PERFORM set_config('request.jwt.claim.sub',owner_a::text,true),set_config('request.jwt.claim.role','authenticated',true);
  PERFORM public.save_boutique(store_a,settings);
  outfit:=public.save_boutique_item(store_a,NULL,garment);
  SELECT updated_at::text INTO policies_at FROM public.boutiques WHERE vendor_id=store_a;
  PERFORM set_config('request.jwt.claim.sub',client_a::text,true);
  PERFORM public.set_boutique_favorite(outfit,true);
  request_data:=jsonb_build_object('starts_at',(now()+interval '7 days')::text,'wedding_date','','companions',1,'size_note','US 12','budget','','note','Private synthetic visit','items',jsonb_build_array(outfit),'accepted',true,'policies_version',policies_at);
  visit_a:=public.request_boutique_appointment(store_a,'b0130000-0000-4000-8000-000000000021',request_data);
  IF public.request_boutique_appointment(store_a,'b0130000-0000-4000-8000-000000000021',request_data)<>visit_a THEN RAISE EXCEPTION 'Idempotency failure'; END IF;
  BEGIN
   PERFORM public.request_boutique_appointment(store_a,'b0130000-0000-4000-8000-000000000021',request_data||'{"note":"overwrite"}');
   RAISE EXCEPTION 'Changed retry was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  PERFORM public.reply_boutique_appointment(visit_a,'b0130000-0000-4000-8000-000000000031','Private synthetic message');
  BEGIN
   PERFORM public.decide_boutique_appointment(visit_a,'confirmed',1,'');
   RAISE EXCEPTION 'Client confirmed own appointment';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub',client_b::text,true);
  visit_b:=public.request_boutique_appointment(store_a,'b0130000-0000-4000-8000-000000000022',request_data);
  IF jsonb_array_length(public.boutique_appointment_inbox(1,visit_a))<>0 THEN RAISE EXCEPTION 'Appointment privacy failure'; END IF;
  PERFORM set_config('request.jwt.claim.sub',owner_a::text,true);
  PERFORM public.decide_boutique_appointment(visit_a,'confirmed',1,'Sample availability will be confirmed separately.');
  BEGIN
   PERFORM public.decide_boutique_appointment(visit_b,'confirmed',1,'');
   RAISE EXCEPTION 'Overlapping visit was confirmed';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub',stranger::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO n FROM public.boutique_appointments WHERE vendor_id=store_a;
  IF n<>0 THEN RAISE EXCEPTION 'Direct appointment RLS failure'; END IF;
  SELECT count(*) INTO n FROM public.boutique_appointment_messages WHERE appointment_id=visit_a;
  IF n<>0 THEN RAISE EXCEPTION 'Direct message RLS failure'; END IF;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claim.role','anon',true);
  IF public.boutique_storefront('wm-boutique-rollback-test',1,NULL)->'items'->0->'price_cents'<>'null'::jsonb THEN RAISE EXCEPTION 'Guest price leak'; END IF;
  PERFORM set_config('request.jwt.claim.sub',client_a::text,true),set_config('request.jwt.claim.role','authenticated',true);
  PERFORM public.decide_boutique_appointment(visit_a,'cancelled',2,'');
  IF EXISTS(SELECT 1 FROM public.rfq_invites WHERE vendor_id=store_a) THEN RAISE EXCEPTION 'Fitting incorrectly changed booking state'; END IF;
  RAISE SQLSTATE 'ZB013' USING MESSAGE='Successful synthetic verification rollback';
 EXCEPTION WHEN SQLSTATE 'ZB013' THEN NULL;
 END;
END $wm_verify$;
SELECT jsonb_build_object('workflowChecksPassed',true,
 'testAccountsRemaining',(SELECT count(*) FROM auth.users WHERE id IN('b0130000-0000-4000-8000-000000000001','b0130000-0000-4000-8000-000000000002','b0130000-0000-4000-8000-000000000003','b0130000-0000-4000-8000-000000000004')),
 'testVendorsRemaining',(SELECT count(*) FROM public.vendors WHERE id='b0130000-0000-4000-8000-000000000011'),
 'testAppointmentsRemaining',(SELECT count(*) FROM public.boutique_appointments WHERE vendor_id='b0130000-0000-4000-8000-000000000011')) AS boutique_verification;
