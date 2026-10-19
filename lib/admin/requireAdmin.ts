import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAdminAccess() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user:null, mfaVerified:false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { user:null, mfaVerified:false };
  }

  const { data: assurance,error }=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return { user, mfaVerified:!error && assurance?.currentLevel==='aal2' };
}

export async function requireAdminUser() {
  const access=await getAdminAccess();
  return access.mfaVerified ? access.user : null;
}
