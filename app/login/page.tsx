// app/login/page.tsx
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import LoginClient from "./LoginClient";
import { safeAuthNextPath } from "@/lib/auth-redirect";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; password_updated?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nextPath = safeAuthNextPath(sp.next ?? null, "/account/profile");

  if (user && !sp?.next) {
    const { data: isVendor } = await supabase.rpc("is_vendor", { _uid: user.id });
    nextPath = isVendor ? "/vendor/profile" : "/account/profile";
  }

  // If already logged in, go straight to target
  if (user) redirect(nextPath);

  return <LoginClient nextPath={nextPath} passwordUpdated={sp.password_updated === "1"} callbackError={sp.error === "auth_callback"} />;
}
