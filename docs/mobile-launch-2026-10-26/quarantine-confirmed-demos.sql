-- Owner approved hiding/restricting the 152 confirmed seed accounts, 2026-10-26.
-- Reversible quarantine only. No account, conversation, review or media is deleted.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
SELECT set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claim.role','service_role',true);
CREATE TEMP TABLE wm_seed_quarantine ON COMMIT DROP AS
 SELECT v.id AS vendor_id,v.owner_id,v.is_published AS was_published,p.suspended_at AS was_suspended
 FROM public.vendors v JOIN public.profiles p ON p.id=v.owner_id JOIN auth.users u ON u.id=v.owner_id
 WHERE v.extra_info->>'seed_batch'='random-provider-seed-v1' AND v.slug LIKE 'demo-%'
  AND u.email LIKE 'vendor.demo.%@wedding-market.local' AND p.role='vendor'
 FOR UPDATE OF v,p;
DO $$ BEGIN
 IF (SELECT count(*) FROM wm_seed_quarantine)<>152 OR (SELECT count(DISTINCT owner_id) FROM wm_seed_quarantine)<>152
  OR EXISTS(SELECT 1 FROM wm_seed_quarantine WHERE NOT was_published OR was_suspended IS NOT NULL) THEN
  RAISE EXCEPTION 'Seed scope changed; review the dataset before quarantining';
 END IF;
END $$;
WITH vendors AS (
 UPDATE public.vendors v SET is_published=false FROM wm_seed_quarantine q WHERE v.id=q.vendor_id RETURNING v.id
), profiles AS (
 UPDATE public.profiles p SET suspended_at=now() FROM wm_seed_quarantine q WHERE p.id=q.owner_id RETURNING p.id
)
SELECT set_config('wedding_market.seed_quarantine_receipt',jsonb_build_object('checkedAt',now(),
 'hiddenVendors',(SELECT count(*) FROM vendors),'restrictedAccounts',(SELECT count(*) FROM profiles),
 'before',(SELECT jsonb_agg(to_jsonb(q) ORDER BY q.vendor_id) FROM wm_seed_quarantine q))::text,false);
COMMIT;
SELECT current_setting('wedding_market.seed_quarantine_receipt')::jsonb || jsonb_build_object(
 'stillPublishedSeeds',(SELECT count(*) FROM public.vendors WHERE is_published AND extra_info->>'seed_batch'='random-provider-seed-v1'),
 'unmarkedPublishedVendors',(SELECT count(*) FROM public.vendors WHERE is_published AND extra_info->>'seed_batch' IS NULL)) AS seed_quarantine_receipt;
