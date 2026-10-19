import { createSupabaseServerClient } from "@/lib/supabase/server";

// Admin APIs enforce the role and MFA; database policies remain in force.
export async function getSupabaseForAdmin() {
  return createSupabaseServerClient();
}
