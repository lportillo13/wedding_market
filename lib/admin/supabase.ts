import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSupabaseForAdmin() {
  const admin = createSupabaseAdminClient();
  if (admin) {
    return admin;
  }

  return createSupabaseServerClient();
}
