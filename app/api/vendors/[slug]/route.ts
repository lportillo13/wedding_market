import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseMediaAsset } from "@/lib/images";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

type LocalizedValue = string | Record<string, unknown> | null | undefined;

function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(
    url,
    anonKey,
  );
}

function localized(value: LocalizedValue, locale = "en") {
  if (!value) return null;
  if (typeof value === "string") return value.trim() || null;
  const current = value[locale];
  if (typeof current === "string" && current.trim()) return current;
  const english = value.en;
  if (typeof english === "string" && english.trim()) return english;
  const first = Object.values(value).find((entry) => typeof entry === "string" && entry.trim());
  return typeof first === "string" ? first : null;
}

function normalizeImage(value: unknown, fallbackSort: number | null = null) {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const parsed = parseMediaAsset(item);
  const url = parsed?.url ?? (typeof item.url === "string" ? item.url : null);
  if (!url) return null;

  const type =
    parsed?.type === "video" ||
    item.type === "video" ||
    url.toLowerCase().endsWith(".mp4")
      ? "video"
      : "image";

  return {
    url,
    public_id: parsed?.public_id ?? String(item.id ?? url),
    width: parsed?.width ?? null,
    height: parsed?.height ?? null,
    format: parsed?.format ?? (type === "video" ? "mp4" : "image"),
    type,
    caption: localized(item.caption as LocalizedValue),
    sort: typeof item.sort === "number" ? item.sort : fallbackSort,
  };
}

function normalizeMedia(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => normalizeImage(item, index))
    .filter((item): item is NonNullable<ReturnType<typeof normalizeImage>> => Boolean(item))
    .sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0));
}

type NormalizedMediaItem = NonNullable<ReturnType<typeof normalizeImage>>;

function mergeMedia(...groups: NormalizedMediaItem[][]) {
  const byUrl = new Map<string, NormalizedMediaItem>();

  for (const item of groups.flat()) {
    if (!byUrl.has(item.url)) {
      byUrl.set(item.url, item);
    }
  }

  return Array.from(byUrl.values()).sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0));
}

function normalizeSpaces(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      id: String(row.id ?? crypto.randomUUID()),
      name: localized(row.name as LocalizedValue),
      description: localized(row.description as LocalizedValue),
      capacity_min: typeof row.capacity_min === "number" ? row.capacity_min : null,
      capacity_max: typeof row.capacity_max === "number" ? row.capacity_max : null,
    };
  });
}

function normalizePricing(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      item_key: String(row.item_key ?? ""),
      price_cents: typeof row.price_cents === "number" ? row.price_cents : null,
      currency: typeof row.currency === "string" ? row.currency : "USD",
      contact_for_price: Boolean(row.contact_for_price),
      notes: localized(row.notes as LocalizedValue),
    };
  });
}

function normalizeAmenities(value: unknown) {
  const groups = {
    amenities: [] as { key: string; label: string }[],
    ceremony_types: [] as { key: string; label: string }[],
    settings: [] as { key: string; label: string }[],
    services: [] as { key: string; label: string }[],
  };

  if (!Array.isArray(value)) return groups;

  for (const item of value) {
    const row = item as Record<string, unknown>;
    const group = typeof row.group === "string" ? row.group : "";
    const key = typeof row.key === "string" ? row.key : "";
    const label = localized(row.label as LocalizedValue) ?? key;
    if (!key) continue;
    if (group === "ceremony_types") groups.ceremony_types.push({ key, label });
    else if (group === "settings") groups.settings.push({ key, label });
    else if (group === "services") groups.services.push({ key, label });
    else groups.amenities.push({ key, label });
  }

  return groups;
}

function normalizeTeam(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      id: String(row.id ?? crypto.randomUUID()),
      name: String(row.name ?? ""),
      title: localized(row.title as LocalizedValue),
      bio: localized(row.bio as LocalizedValue),
      headshot_url: typeof row.headshot_url === "string" ? row.headshot_url : null,
      responds_within_hours:
        typeof row.responds_within_hours === "number" ? row.responds_within_hours : null,
    };
  });
}

function normalizeAvailability(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = item as Record<string, unknown>;
    const date = typeof row.available_on === "string" ? row.available_on : null;
    if (!date) return [];
    return [{
      id: String(row.id ?? date),
      date,
      status: row.availability_status === "busy" ? "busy" : "available",
    }];
  });
}

function buildDistribution(reviews: { rating: number | null }[]) {
  return [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => Math.round(Number(review.rating ?? 0)) === rating).length,
  }));
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    return NextResponse.json({ vendor: null, error: "Missing vendor slug." }, { status: 400 });
  }

  const supabase = supabasePublic();
  if (!supabase) {
    return NextResponse.json({ vendor: null, error: "Vendor profiles are not configured." }, { status: 503 });
  }
  const { data: row, error } = await supabase
    .from("vendor_profile_view")
    .select("*")
    .eq("slug", normalizedSlug)
    .maybeSingle<Record<string, unknown>>();

  if (error) {
    return NextResponse.json({ vendor: null, error: error.message }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ vendor: null, error: "Vendor not found." }, { status: 404 });
  }

  const { data: vendorMedia, error: vendorMediaError } = await supabase
    .from("vendors")
    .select("hero_image, thumbnail_image, gallery_images")
    .eq("id", row.id)
    .maybeSingle<{
      hero_image: unknown;
      thumbnail_image: unknown;
      gallery_images: unknown;
    }>();

  if (vendorMediaError) {
    return NextResponse.json({ vendor: null, error: vendorMediaError.message }, { status: 500 });
  }

  const { data: reviewRows, error: reviewError } = await supabase
    .from("reviews_public")
    .select("id, rating, title, body, created_at")
    .eq("vendor_id", row.id)
    .order("created_at", { ascending: false });

  if (reviewError) {
    return NextResponse.json({ vendor: null, error: reviewError.message }, { status: 500 });
  }

  const baseHeroImage = normalizeImage(vendorMedia?.hero_image, -200);
  const baseThumbnailImage = normalizeImage(vendorMedia?.thumbnail_image, -100);
  const baseMedia = [
    baseHeroImage,
    baseThumbnailImage,
    ...normalizeMedia(vendorMedia?.gallery_images),
  ].filter((item): item is NormalizedMediaItem => Boolean(item));
  const media = mergeMedia(baseMedia, normalizeMedia(row.media));
  const reviews = (reviewRows ?? []).map((review) => ({
    id: review.id,
    rating: typeof review.rating === "number" ? review.rating : Number(review.rating ?? 0),
    title: review.title ?? null,
    body: review.body ?? null,
    created_at: review.created_at,
  }));

  const categories = Array.isArray(row.categories)
    ? row.categories.map((category) => {
        const entry = category as Record<string, unknown>;
        return {
          key: typeof entry.slug === "string" ? entry.slug : String(entry.id ?? ""),
          slug: typeof entry.slug === "string" ? entry.slug : null,
          label: localized(entry.label as LocalizedValue) ?? String(entry.slug ?? ""),
        };
      })
    : [];

  const heroImage = baseHeroImage ?? media[0] ?? null;
  const thumbnailImage = baseThumbnailImage ?? media.find((item) => item.url !== heroImage?.url) ?? heroImage;
  const extraInfo = row.extra_info && typeof row.extra_info === "object"
    ? row.extra_info as Record<string, unknown>
    : {};
  const description = localized(extraInfo.long_description as LocalizedValue) ?? localized(row.extra_info as LocalizedValue);
  const ratingAvg = typeof row.rating_avg === "number" ? row.rating_avg : Number(row.rating_avg ?? 0);
  const ratingCount = typeof row.rating_count === "number" ? row.rating_count : Number(row.rating_count ?? reviews.length);

  return NextResponse.json({
    vendor: {
      id: row.id,
      slug: row.slug,
      business_name: row.name,
      bio_en: localized(row.bio as LocalizedValue, "en"),
      bio_es: localized(row.bio as LocalizedValue, "es"),
      extra_info_en: description,
      extra_info_es: description,
      categories: categories.map((category) => category.label),
      category_details: categories,
      logo_url: row.logo_url ?? null,
      hero_image: heroImage,
      thumbnail_image: thumbnailImage,
      gallery_images: media,
      media,
      rating_avg: ratingAvg,
      rating_count: ratingCount,
      review_ai_summary: typeof row.review_ai_summary === "string" ? row.review_ai_summary : null,
      location: {
        city: row.city ?? null,
        region: row.state ?? row.region ?? null,
        country: row.country ?? null,
        address_label: row.address ?? row.address_label ?? null,
        map_url: row.map_url ?? null,
      },
      starting_price_cents: row.starting_price_cents ?? null,
      starting_price_currency: row.starting_price_currency ?? "USD",
      typical_spend_cents: row.pricing_typical_spend_cents ?? null,
      typical_spend_currency:
        row.pricing_typical_spend_currency ?? row.starting_price_currency ?? "USD",
      peak_seasons: Array.isArray(row.pricing_peak_seasons) ? row.pricing_peak_seasons : [],
      years_in_business: row.years_in_business ?? null,
      languages: Array.isArray(row.languages) ? row.languages : [],
      team_size_range: row.team_size_range ?? null,
      event_types: Array.isArray(row.event_types) ? row.event_types : [],
      phone: row.phone ?? null,
      website_url: row.website_url ?? null,
      capacity_max: row.capacity_max ?? null,
      spaces: normalizeSpaces(row.spaces),
      pricing: normalizePricing(row.pricing),
      amenities: normalizeAmenities(row.amenity_items),
      team: normalizeTeam(row.team),
      availability: normalizeAvailability(row.availability_dates),
      reviews,
      review_distribution: buildDistribution(reviews),
    },
  });
}
