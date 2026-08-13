// app/login/page.tsx
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import LoginClient from "./LoginClient";

export default async function Page({
  searchParams,
}: {
  // Next 15: await searchParams
  searchParams: Promise<{ next?: string; password_updated?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nextPath = sp?.next && sp.next.startsWith("/") ? sp.next : "/account/profile";

  if (user && !sp?.next) {
    const { data: isVendor } = await supabase.rpc("is_vendor", { _uid: user.id });
    nextPath = isVendor ? "/vendor/profile" : "/account/profile";
  }

  // If already logged in, go straight to target
  if (user) redirect(nextPath);

  return <LoginClient nextPath={nextPath} passwordUpdated={sp.password_updated === "1"} />;
}
