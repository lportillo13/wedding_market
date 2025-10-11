// app/login/page.tsx
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import LoginClient from "./LoginClient";

export default async function Page({
  searchParams,
}: {
  // Next 15: await searchParams
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const nextPath = sp?.next && sp.next.startsWith("/") ? sp.next : "/";

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already logged in, go straight to target
  if (user) redirect(nextPath);

  return <LoginClient nextPath={nextPath} />;
}
