import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabasePublic() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const limit = Math.min(Number(searchParams.get("limit") || 8), 12);

    if (!q || q.length < 2) {
      return NextResponse.json({ items: [] });
    }

    const supabase = supabasePublic();
    const { data, error } = await supabase
      .from("vendor_public_search")
      .select("slug, business_name, categories")
      .ilike("business_name", `%${q}%`)
      .order("business_name", { ascending: true })
      .limit(limit);

    if (error) {
      return NextResponse.json({ items: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ items: [], error: message }, { status: 500 });
  }
}
