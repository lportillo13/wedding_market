import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ user: null, vendor: null, note: "not logged in" });

  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  return NextResponse.json({ user: user.id, vendor: data, error });
}
