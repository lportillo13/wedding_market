import { getSupabaseServer } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type Role = "user" | "vendor" | "admin";

/** Returns { user, role } or { user: null, role: null } */
export async function getUserAndRole(): Promise<
  | { user: null; role: null }
  | { user: User; role: Role }
> {
  const supabase = await getSupabaseServer(); // Next 15: await
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  return {
    user,
    role: role === "vendor" || role === "admin" ? role : "user",
  };
}
