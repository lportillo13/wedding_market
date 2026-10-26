BEGIN;
-- Restrictions must not take away the account holder's ability to initiate deletion.
-- Existing permissive policies still limit SELECT/UPDATE to self and DELETE to admins.
-- The restrictive WITH CHECK continues to reject all writes by a suspended account.
ALTER POLICY wm_existing_account_required ON public.profiles
 USING (id=(SELECT auth.uid()) OR (SELECT public.wm_account_exists()))
 WITH CHECK ((SELECT public.wm_account_exists()));
NOTIFY pgrst,'reload schema';
COMMIT;
