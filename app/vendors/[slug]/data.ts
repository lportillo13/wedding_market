import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  VendorAmenity,
  VendorMediaItem,
  VendorPricingItem,
  VendorProfileDTO,
  VendorReviewItem,
} from "@/types/vendor-profile";

const SUPPORTED_LANGUAGES = ["en", "es", "de", "fr"] as const;
type SupportedLocale = (typeof SUPPORTED_LANGUAGES)[number];

async function resolveLocale(): Promise<SupportedLocale> {
  const headerList = await headers();
  const acceptLanguage = headerList.get("accept-language") ?? "";
  const segments = acceptLanguage.split(",").map((segment) => segment.trim().split(";")[0]?.toLowerCase());
  for (const segment of segments) {
    if (!segment) continue;
    const primary = segment.split("-")[0] ?? segment;
    if (SUPPORTED_LANGUAGES.includes(primary as SupportedLocale)) {
      return primary as SupportedLocale;
    }
  }
  return "en";
}

function resolveLocalizedField(value: unknown, locale: SupportedLocale): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const localized = record[locale];
    if (typeof localized === "string" && localized.trim()) return localized;
    const english = record.en;
    if (typeof english === "string" && english.trim()) return english;
    for (const key of Object.keys(record)) {
      const candidate = record[key];
      if (typeof candidate === "string" && candidate.trim()) return candidate;
    }
  }
  return null;
}

function mapAmenityItems(
  items: { key?: string; group?: string; label?: unknown }[],
  locale: SupportedLocale
): Record<"amenities" | "ceremony_types" | "settings" | "services", VendorAmenity[]> {
  const buckets: Record<string, VendorAmenity[]> = {
    amenities: [],
    ceremony_types: [],
    settings: [],
    services: [],
  };

  for (const item of items) {
    if (!item?.key || !item.group) continue;
    const label = resolveLocalizedField(item.label, locale) ?? item.key;
    if (!buckets[item.group]) {
      buckets[item.group] = [];
    }
    buckets[item.group]!.push({ key: item.key, label });
  }

  return {
    amenities: buckets.amenities ?? [],
    ceremony_types: buckets.ceremony_types ?? [],
    settings: buckets.settings ?? [],
    services: buckets.services ?? [],
  };
}

function sortMedia(items: VendorMediaItem[]): VendorMediaItem[] {
  return [...items].sort((a, b) => {
    const sortA = a.sort ?? 0;
    const sortB = b.sort ?? 0;
    if (sortA !== sortB) return sortA - sortB;
    const idA = typeof a.id === "number" ? a.id : a.id?.toString();
    const idB = typeof b.id === "number" ? b.id : b.id?.toString();
    return idA.localeCompare(idB);
  });
}

function normalizePricing(items: VendorPricingItem[]): VendorPricingItem[] {
  const order = ["reception", "ceremony", "bar", "catering"];
  return [...items].sort((a, b) => {
    const indexA = order.indexOf(a.itemKey.toLowerCase());
    const indexB = order.indexOf(b.itemKey.toLowerCase());
    if (indexA === -1 && indexB === -1) return a.itemKey.localeCompare(b.itemKey);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

function buildDistribution(reviews: VendorReviewItem[]): { rating: number; count: number }[] {
  const buckets = new Map<number, number>();
  for (let i = 1; i <= 5; i += 1) {
    buckets.set(i, 0);
  }
  for (const review of reviews) {
    const bucket = Math.round(review.rating);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return Array.from(buckets.entries())
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => b.rating - a.rating);
}

export async function fetchVendorProfile(slug: string): Promise<VendorProfileDTO> {
  const locale = await resolveLocale();
  const supabase = await createSupabaseServerClient();

  const { data: row, error } = await supabase
    .from("vendor_profile_view")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!row) {
    notFound();
  }

  const media: VendorMediaItem[] = sortMedia(
    (row.media ?? []).map((item: Record<string, unknown>) => ({
      id: (item.id as string | number | undefined) ?? crypto.randomUUID(),
      type: (item.type as string)?.toLowerCase() === "video" ? "video" : "photo",
      url: String(item.url ?? ""),
      caption: resolveLocalizedField(item.caption, locale),
      sort: typeof item.sort === "number" ? item.sort : null,
    }))
  );

  const spaces = (row.spaces ?? []).map((space: Record<string, unknown>) => ({
    id: String(space.id ?? crypto.randomUUID()),
    name: resolveLocalizedField(space.name, locale),
    description: resolveLocalizedField(space.description, locale),
    capacityMin: typeof space.capacity_min === "number" ? space.capacity_min : null,
    capacityMax: typeof space.capacity_max === "number" ? space.capacity_max : null,
  }));

  const pricing = normalizePricing(
    (row.pricing ?? []).map((item: Record<string, unknown>) => ({
      itemKey: String(item.item_key ?? ""),
      priceCents: typeof item.price_cents === "number" ? item.price_cents : null,
      currency: typeof item.currency === "string" && item.currency ? item.currency : row.starting_price_currency ?? "USD",
      contactForPrice: Boolean(item.contact_for_price),
      notes: resolveLocalizedField(item.notes, locale),
    }))
  );

  const amenityGroups = mapAmenityItems(row.amenity_items ?? [], locale);

  const team = (row.team ?? []).map((member: Record<string, unknown>) => ({
    id: String(member.id ?? crypto.randomUUID()),
    name: String(member.name ?? ""),
    title: resolveLocalizedField(member.title, locale),
    bio: resolveLocalizedField(member.bio, locale),
    headshotUrl: typeof member.headshot_url === "string" ? member.headshot_url : null,
    respondsWithinHours:
      typeof member.responds_within_hours === "number" ? member.responds_within_hours : null,
  }));

  const location = {
    city: row.city ?? null,
    region: row.region ?? null,
    country: row.country ?? null,
    state: row.state ?? null,
    address: row.address ?? null,
    addressLabel: row.address_label ?? null,
    mapUrl: row.map_url ?? null,
  };

  const { data: reviewRows, error: reviewError } = await supabase
    .from("reviews_public")
    .select("id, rating, title, body, created_at, rater_user_id")
    .eq("vendor_id", row.id)
    .order("created_at", { ascending: false });

  if (reviewError) {
    throw new Error(reviewError.message);
  }

  const reviews: VendorReviewItem[] = (reviewRows ?? []).map((review) => ({
    id: review.id,
    rating: Number(review.rating ?? 0),
    title: review.title ?? null,
    body: review.body ?? null,
    createdAt: review.created_at,
    authorName: null,
    vendorReply: null,
    photos: [],
  }));

  const distribution = buildDistribution(reviews);

  const categories = (row.categories ?? []).map((category: Record<string, unknown>) => ({
    slug: typeof category.slug === "string" ? category.slug : null,
    label: resolveLocalizedField(category.label, locale) ?? String(category.slug ?? ""),
  }));

  const extraInfo = (row.extra_info ?? {}) as Record<string, unknown>;

  const descriptionSource =
    typeof row.extra_info === "object" && row.extra_info !== null
      ? ((row.extra_info as Record<string, unknown>)["long_description"] ?? row.extra_info)
      : row.extra_info;

  const vendor: VendorProfileDTO["vendor"] = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: resolveLocalizedField(row.bio, locale),
    description: resolveLocalizedField(descriptionSource, locale),
    yearsInBusiness: typeof row.years_in_business === "number" ? row.years_in_business : null,
    languages: Array.isArray(row.languages) ? (row.languages as string[]) : [],
    teamSizeRange: typeof row.team_size_range === "string" ? row.team_size_range : null,
    phone: typeof row.phone === "string" ? row.phone : null,
    websiteUrl: typeof row.website_url === "string" ? row.website_url : null,
    logoUrl: typeof row.logo_url === "string" ? row.logo_url : null,
    startingPriceCents: typeof row.starting_price_cents === "number" ? row.starting_price_cents : null,
    startingPriceCurrency: row.starting_price_currency ?? "USD",
    capacityMax: typeof row.capacity_max === "number" ? row.capacity_max : null,
    eventTypes: Array.isArray(row.event_types) ? (row.event_types as string[]) : [],
    typicalSpendCents:
      typeof row.pricing_typical_spend_cents === "number" ? row.pricing_typical_spend_cents : null,
    typicalSpendCurrency: row.pricing_typical_spend_currency ?? row.starting_price_currency ?? "USD",
    peakSeasons: Array.isArray(row.pricing_peak_seasons)
      ? (row.pricing_peak_seasons as string[])
      : [],
    ratingAvg: row.rating_avg !== null && row.rating_avg !== undefined ? Number(row.rating_avg) : null,
    ratingCount: row.rating_count ?? reviews.length,
    reviewAiSummary: typeof row.review_ai_summary === "string" ? row.review_ai_summary : null,
    location,
  };

  const availabilityNote = (extraInfo?.["availability_note"] ?? null) as unknown;

  const profile: VendorProfileDTO = {
    vendor,
    media,
    spaces,
    pricing,
    amenities: {
      amenities: amenityGroups.amenities,
      ceremonyTypes: amenityGroups.ceremony_types,
      settings: amenityGroups.settings,
      services: amenityGroups.services,
    },
    team,
    availability: {
      note: resolveLocalizedField(availabilityNote, locale),
    },
    reviews: {
      summary: {
        ratingAvg: vendor.ratingAvg,
        ratingCount: vendor.ratingCount,
        aiSummary: vendor.reviewAiSummary,
        distribution,
      },
      items: reviews,
    },
    breadcrumbs: {
      categories,
      region: location.region,
      city: location.city,
      country: location.country,
    },
  };

  return profile;
}
