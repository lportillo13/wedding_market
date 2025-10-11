import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return NextResponse.json({ user: data.user });
}
