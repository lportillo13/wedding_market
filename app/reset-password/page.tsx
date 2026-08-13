import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import ResetPasswordClient from "./ResetPasswordClient";

export default async function ResetPasswordPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password?error=recovery");
  }

  return <ResetPasswordClient />;
}
