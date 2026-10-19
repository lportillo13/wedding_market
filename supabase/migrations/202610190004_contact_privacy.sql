-- Apply after deploying readers that use rfqs_visible (migration 003).
-- The base table remains writable by the request owner. Invited vendor reads
-- use the security-barrier projection, which masks contact fields until consent.
BEGIN;
DROP POLICY IF EXISTS rfqs_vendor_select ON public.rfqs;
NOTIFY pgrst,'reload schema';
COMMIT;
