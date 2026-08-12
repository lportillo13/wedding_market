import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseMediaAsset } from "@/lib/images";

// Public (anon) Supabase client – no cookies needed for public search
function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(
    url,
    anonKey,
  );
}

function positiveInteger(value: string | null, fallback: number, maximum: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

function postgrestQuoted(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().slice(0, 100);
    const category = searchParams.get("category")?.trim().slice(0, 100);
    const page = positiveInteger(searchParams.get("page"), 1, 10_000);
    const pageSize = positiveInteger(searchParams.get("pageSize"), 12, 50);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = supabasePublic();
    if (!supabase) {
      return NextResponse.json({ items: [], total: 0, error: "Vendor search is not configured." }, { status: 503 });
    }
    let query = supabase.from("vendor_public_search").select("*", { count: "exact" });

    if (q) {
      const pattern = postgrestQuoted(`%${q}%`);
      query = query.or(
        `slug.ilike.${pattern},business_name.ilike.${pattern},bio_en.ilike.${pattern},bio_es.ilike.${pattern},extra_info_en.ilike.${pattern},extra_info_es.ilike.${pattern}`,
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
    let logoByVendorId = new Map<string, { logoUrl: string | null }>();

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

          return [[
            id,
            {
              logoUrl: typeof row.logo_url === "string" && row.logo_url.trim() ? row.logo_url : null,
            },
          ]];
        }),
      );
    }

    const items = vendorRows.map((row) => {
      const logoAssets = typeof row.id === "string" ? logoByVendorId.get(row.id) ?? null : null;
      const logoUrl = logoAssets?.logoUrl ?? null;
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
        hero_image: parseMediaAsset(row.hero_image),
        thumbnail_image: parseMediaAsset(row.thumbnail_image),
      };
    });

    return NextResponse.json({ items, total: count ?? 0, page, pageSize });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ items: [], total: 0, error: message }, { status: 500 });
  }
}
