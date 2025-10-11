import { getSupabaseServer } from "@/lib/supabase/server";

export type Role = "user" | "vendor" | "admin";

/** Returns { user, role } or { user: null, role: null } */
export async function getUserAndRole() {
  const supabase = await getSupabaseServer(); // Next 15: await
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null as any };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { user, role: (profile?.role as Role) ?? "user" };
}
