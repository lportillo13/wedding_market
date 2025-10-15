import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/requireAdmin";
import { getSupabaseForAdmin } from "@/lib/admin/supabase";

export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseForAdmin();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .order("key", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data ?? [] });
}

export async function PUT(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.settings !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const entries = Object.entries(body.settings as Record<string, unknown>).map(([key, value]) => ({
    key,
    value,
  }));

  if (!entries.length) {
    return NextResponse.json({ error: "No settings provided" }, { status: 400 });
  }

  const supabase = await getSupabaseForAdmin();

  const { error } = await supabase.from("site_settings").upsert(entries, { onConflict: "key" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
