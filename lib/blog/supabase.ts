import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSupabaseForBlog(): Promise<SupabaseClient> {
  const admin = createSupabaseAdminClient();
  if (admin) {
    return admin;
  }

  return createSupabaseServerClient();
}
