import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseMediaAsset } from "@/lib/images";

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
        `business_name.ilike.%${q}%,bio_en.ilike.%${q}%,bio_es.ilike.%${q}%,extra_info_en.ilike.%${q}%,extra_info_es.ilike.%${q}%`
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

    const vendorRows = data ?? [];
    const vendorIds = vendorRows.flatMap((row) => (typeof row.id === "string" ? [row.id] : []));
    let logoByVendorId = new Map<string, string | null>();

    if (vendorIds.length > 0) {
      const { data: logoRows } = await supabase
        .from("vendors")
        .select("id, logo_url")
        .in("id", vendorIds);

      logoByVendorId = new Map(
        (logoRows ?? []).flatMap((row) => {
          const id = typeof row.id === "string" ? row.id : null;
          if (!id) {
            return [];
          }

          return [[id, typeof row.logo_url === "string" && row.logo_url.trim() ? row.logo_url : null]];
        }),
      );
    }

    const items = vendorRows.map((row) => {
      const logoUrl = typeof row.id === "string" ? logoByVendorId.get(row.id) ?? null : null;
      return {
        ...row,
        logo_url: logoUrl,
        logo_image: logoUrl
          ? {
              url: logoUrl,
              public_id: logoUrl,
              width: 160,
              height: 160,
              format: logoUrl.toLowerCase().split(/[?#]/, 1)[0]?.endsWith(".svg") ? "svg" : "image",
            }
          : null,
        thumbnail_image: parseMediaAsset(row.thumbnail_image),
      };
    });

    return NextResponse.json({ items, total: count ?? 0, page, pageSize });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ items: [], total: 0, error: message }, { status: 500 });
  }
}
