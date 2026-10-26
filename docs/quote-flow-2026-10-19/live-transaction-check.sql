-- No real accounts or vendors are used. All fixture records are created inside
-- an exception subtransaction that is always rolled back. No email/push code runs.
DO $audit$
DECLARE
 client_id uuid:='dcfe2660-7222-4000-8000-000000000001';
 owner_a uuid:='dcfe2660-7222-4000-8000-000000000003';
 owner_b uuid:='dcfe2660-7222-4000-8000-000000000004';
 vendor_a uuid:='dcfe2660-7222-4000-8000-000000000011';
 vendor_b uuid:='dcfe2660-7222-4000-8000-000000000012';
 inquiry_id uuid:='dcfe2660-7222-4000-8000-000000000021';
 single_id uuid:='dcfe2660-7222-4000-8000-000000000022';
 quote_a uuid:='dcfe2660-7222-4000-8000-000000000031';
 quote_b uuid:='dcfe2660-7222-4000-8000-000000000032';
 payload jsonb:='{"guest_count":60,"budget":0,"notes":"Rollback-only workflow fixture","email":"audit@example.invalid","phone":"","event_date":"2027-05-12"}';
 proof jsonb:='{}'; saved jsonb; n integer; rejected boolean; hidden_email text;
BEGIN
 BEGIN
  INSERT INTO auth.users(id,raw_user_meta_data) VALUES(client_id,'{}'),(owner_a,'{}'),(owner_b,'{}');
  INSERT INTO public.profiles(id,role,language) VALUES(client_id,'user','en'),(owner_a,'vendor','en'),(owner_b,'vendor','es')
    ON CONFLICT(id) DO UPDATE SET role=excluded.role,language=excluded.language;
  -- Synthetic actors explicitly accept the current posting rules.
  UPDATE public.profiles SET community_terms_version='2026-10-26',community_terms_accepted_at=now() WHERE id IN (client_id,owner_a,owner_b);
  INSERT INTO public.vendors(id,owner_id,slug,business_name,is_published) VALUES
    (vendor_a,owner_a,'rollback-only-audit-vendor-a','Rollback fixture A',true),
    (vendor_b,owner_b,'rollback-only-audit-vendor-b','Rollback fixture B',true);
  PERFORM set_config('request.jwt.claim.sub',client_id::text,true),set_config('request.jwt.claim.role','authenticated',true),
    set_config('request.jwt.claims',jsonb_build_object('sub',client_id,'role','authenticated')::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  saved:=public.create_inquiry(ARRAY[vendor_a,vendor_b],payload,inquiry_id);
  SELECT count(*) INTO n FROM public.rfq_invites WHERE rfq_id=inquiry_id;
  IF n<>2 OR saved->>'rfq_id'<>inquiry_id::text THEN RAISE EXCEPTION 'Group creation failed'; END IF;
  saved:=public.create_inquiry(ARRAY[vendor_b,vendor_a],payload,inquiry_id);
  IF NOT (saved->>'replayed')::boolean THEN RAISE EXCEPTION 'Retry was not idempotent'; END IF;
  saved:=public.create_inquiry(ARRAY[vendor_a],payload,single_id);
  IF NOT EXISTS(SELECT 1 FROM public.rfqs WHERE id=single_id AND vendor_id=vendor_a AND budget_min=0 AND budget_max=0) THEN
    RAISE EXCEPTION 'Individual inquiry fields failed'; END IF;
  proof:=proof||'{"singleCreation":true,"groupCreation":true,"idempotentRetry":true}';
  INSERT INTO public.quote_messages(rfq_id,vendor_id,sender_id,sender_role,body) VALUES(inquiry_id,vendor_a,client_id,'client','Question before pricing');
  SELECT active_count INTO n FROM public.list_inbox_threads_v2('client',1,true,'',inquiry_id);
  IF n<>2 THEN RAISE EXCEPTION 'Empty folder counts failed'; END IF;
  PERFORM set_config('request.jwt.claim.sub',owner_a::text,true),set_config('request.jwt.claims',jsonb_build_object('sub',owner_a,'role','authenticated')::text,true);
  SELECT contact_email INTO hidden_email FROM public.rfqs_visible WHERE id=inquiry_id;
  IF hidden_email IS NOT NULL THEN RAISE EXCEPTION 'Contact privacy failed'; END IF;
  INSERT INTO public.quote_messages(rfq_id,vendor_id,sender_id,sender_role,body) VALUES(inquiry_id,vendor_a,owner_a,'vendor','Vendor question before pricing');
  INSERT INTO public.quotes(id,rfq_id,vendor_id,amount_cents,message) VALUES(quote_a,inquiry_id,vendor_a,125000,'First offer'),(quote_b,inquiry_id,vendor_a,125050,'Revised offer');
  PERFORM set_config('request.jwt.claim.sub',owner_b::text,true),set_config('request.jwt.claims',jsonb_build_object('sub',owner_b,'role','authenticated')::text,true);
  SELECT count(*) INTO n FROM public.quote_messages WHERE rfq_id=inquiry_id AND vendor_id=vendor_a;
  IF n<>0 THEN RAISE EXCEPTION 'Vendor message isolation failed'; END IF;
  rejected:=false;
  BEGIN
   INSERT INTO public.quote_messages(rfq_id,vendor_id,sender_id,sender_role,body) VALUES(inquiry_id,vendor_a,owner_b,'vendor','Unauthorized send');
  EXCEPTION WHEN insufficient_privilege THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Unauthorized send succeeded'; END IF;
  proof:=proof||'{"preProposalMessages":true,"vendorIsolation":true,"unauthorizedSendDenied":true,"contactPrivacy":true,"emptyFolderCounts":true}';
  PERFORM set_config('request.jwt.claim.sub',client_id::text,true),set_config('request.jwt.claims',jsonb_build_object('sub',client_id,'role','authenticated')::text,true);
  rejected:=false;
  BEGIN
   PERFORM public.accept_vendor_quote(inquiry_id,quote_a,false,false);
  EXCEPTION WHEN invalid_parameter_value THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Stale offer accepted'; END IF;
  PERFORM public.accept_vendor_quote(inquiry_id,quote_b,false,false);
  saved:=public.accept_vendor_quote(inquiry_id,quote_b,false,false);
  IF NOT (saved->>'alreadyAccepted')::boolean THEN RAISE EXCEPTION 'Acceptance retry failed'; END IF;
  proof:=proof||'{"versionedProposals":true,"staleAcceptanceDenied":true,"acceptanceRetry":true}';
  EXECUTE 'RESET ROLE';
  UPDATE public.rfq_invites SET expires_at=now()-interval '1 day' WHERE rfq_id=inquiry_id;
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM set_config('request.jwt.claim.sub',owner_a::text,true),set_config('request.jwt.claims',jsonb_build_object('sub',owner_a,'role','authenticated')::text,true);
  INSERT INTO public.quote_messages(rfq_id,vendor_id,sender_id,sender_role,body) VALUES(inquiry_id,vendor_a,owner_a,'vendor','Booked follow-up after invitation expiry');
  proof:=proof||'{"acceptedFollowUp":true}';
  RAISE EXCEPTION 'Roll back successful fixture' USING ERRCODE='WM001';
 EXCEPTION WHEN SQLSTATE 'WM001' THEN NULL;
 END;
 IF EXISTS(SELECT 1 FROM auth.users WHERE id IN(client_id,owner_a,owner_b)) OR EXISTS(SELECT 1 FROM public.rfqs WHERE id IN(inquiry_id,single_id)) THEN
  RAISE EXCEPTION 'Fixture rollback failed'; END IF;
 PERFORM set_config('wedding_market.workflow_audit',(proof||jsonb_build_object('fixturesRolledBack',true,'verifiedAt',now()))::text,false);
END $audit$;
SELECT current_setting('wedding_market.workflow_audit')::jsonb AS workflow_verification;
