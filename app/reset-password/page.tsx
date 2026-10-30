import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import ResetPasswordClient from "./ResetPasswordClient";
import { safeAuthNextPath } from "@/lib/auth-redirect";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const nextPath = safeAuthNextPath(params.next, "/account/profile");
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/forgot-password?${new URLSearchParams({ error: "recovery", next: nextPath })}`);
  }

  return <ResetPasswordClient nextPath={nextPath} />;
}
