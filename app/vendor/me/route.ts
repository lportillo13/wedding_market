import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ vendor: null }, { status: 401 });

  const { data, error } = await supabase
    .from("vendors")
    .select("id, slug, business_name, bio, bio_en, bio_es")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ vendor: null, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ vendor: null });

  const v: any = data;
  // Normalize to the shape the form expects
  const vendor = {
    slug: v.slug ?? "",
    business_name: v.business_name ?? "",
    bio_en: v.bio_en ?? v?.bio?.en ?? "",
    bio_es: v.bio_es ?? v?.bio?.es ?? "",
  };

  return NextResponse.json({ vendor });
}
