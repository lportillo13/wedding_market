import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public (anon) Supabase client – no cookies needed for public search
function supabasePublic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const category = searchParams.get("category")?.trim();
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Math.min(Number(searchParams.get("pageSize") || 12), 50);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = supabasePublic();
    let query = supabase.from("vendor_public_search").select("*", { count: "exact" });

    if (q) {
      query = query.or(
        `business_name.ilike.%${q}%,bio_en.ilike.%${q}%,bio_es.ilike.%${q}%`
      );
    }
    if (category) {
      query = query.contains("categories", [category]); // categories is text[]
    }

    const { data, error, count } = await query
      .range(from, to)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { items: [], total: 0, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: data ?? [], total: count ?? 0, page, pageSize });
  } catch (e: any) {
    return NextResponse.json({ items: [], total: 0, error: String(e) }, { status: 500 });
  }
}
