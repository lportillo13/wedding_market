import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabasePublic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ids = [...new Set(url.searchParams.get("ids")?.split(",").map((id) => id.trim()).filter(Boolean) ?? [])];
    if (ids.length > 50 || ids.some((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))) {
      return NextResponse.json({ items: [], error: "Supply at most 50 valid vendor IDs." }, { status: 400 });
    }
    if (!ids?.length) return NextResponse.json({ items: [] });

    const supabase = supabasePublic();
    const { data, error } = await supabase
      .from("vendor_public_search")
      .select("id, slug, business_name, categories")
      .in("id", ids);

    if (error) return NextResponse.json({ items: [], error: error.message }, { status: 500 });
    return NextResponse.json({ items: data ?? [] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ items: [], error: message }, { status: 500 });
  }
}
