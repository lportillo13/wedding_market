export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getRoles } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import VendorProfileTabs from "./VendorProfileTabs";
import type { VendorImage } from "@/types/vendor";

const PRICING_KEYS = ["reception", "ceremony", "bar", "catering"] as const;

type VendorRow = {
  id: string;
  slug: string | null;
  business_name: string | null;
  bio: Record<string, unknown> | null;
  extra_info: Record<string, unknown> | null;
  logo_url: string | null;
  hero_image: VendorImage | null;
  thumbnail_image: VendorImage | null;
  gallery_images: VendorImage[] | null;
  phone: string | null;
  website_url: string | null;
  map_url: string | null;
  address_label: string | null;
  starting_price_cents: number | null;
  starting_price_currency: string | null;
  capacity_max: number | null;
  event_types: string[] | null;
  years_in_business: number | null;
  languages: string[] | null;
  team_size_range: string | null;
  pricing_typical_spend_cents: number | null;
  pricing_typical_spend_currency: string | null;
  pricing_peak_seasons: string[] | null;
  review_ai_summary: string | null;
};

type PricingRow = {
  item_key: string;
  price_cents: number | null;
  currency: string | null;
  contact_for_price: boolean | null;
  notes: Record<string, unknown> | null;
};

type AmenityOption = {
  key: string;
  group_key: string;
  label: Record<string, unknown> | null;
};

type TeamRow = {
  id: string;
  name: string | null;
  title: Record<string, unknown> | string | null;
  bio: Record<string, unknown> | string | null;
  headshot_url: string | null;
  responds_within_hours: number | null;
  sort_order: number | null;
  created_at: string | null;
};

type AvailabilityRow = {
  id: string;
  available_on: string;
  availability_status: "available" | "busy";
};

type LocalizedPair = { en: string; es: string };

function resolveLocalizedInput(value: unknown, locale: "en" | "es"): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const localized = record[locale];
    if (typeof localized === "string") return localized;
    const english = record.en;
    if (typeof english === "string") return english;
  }
  return "";
}

function parseLocalizedPair(value: unknown): LocalizedPair {
  return {
    en: resolveLocalizedInput(value, "en"),
    es: resolveLocalizedInput(value, "es"),
  };
}

function toCsv(value: string[] | null | undefined): string {
  if (!Array.isArray(value)) return "";
  return value.join(", ");
}

export default async function ProfilePage() {
  const { user, isVendor } = await getRoles();
  if (!user || !isVendor) redirect("/signup/vendor");

  const supabase = await createSupabaseServerClient();

  const { data: vendorData, error: vendorError } = await supabase
    .from("vendors")
    .select(
      [
        "id",
        "slug",
        "business_name",
        "bio",
        "extra_info",
        "logo_url",
        "hero_image",
        "thumbnail_image",
        "gallery_images",
        "phone",
        "website_url",
        "map_url",
        "address_label",
        "starting_price_cents",
        "starting_price_currency",
        "capacity_max",
        "event_types",
        "years_in_business",
        "languages",
        "team_size_range",
        "pricing_typical_spend_cents",
        "pricing_typical_spend_currency",
        "pricing_peak_seasons",
        "review_ai_summary",
      ].join(",")
    )
    .eq("owner_id", user.id)
    .maybeSingle();

  if (vendorError) {
    throw new Error(vendorError.message);
  }

  if (typeof vendorData === "string") {
    throw new Error(vendorData);
  }

  let vendor: VendorRow | null = vendorData;

  if (!vendor) {
    const {
      data: insertedData,
      error: insertedError,
    } = await supabase
      .from("vendors")
      .insert({
        owner_id: user.id,
        slug: `vendor-${user.id.slice(0, 8)}`,
        business_name: "Untitled Vendor",
        bio: { en: "", es: "" },
        extra_info: { en: "", es: "" },
        is_published: false,
      })
      .select(
        [
          "id",
          "slug",
          "business_name",
          "bio",
          "extra_info",
          "logo_url",
          "hero_image",
          "thumbnail_image",
          "gallery_images",
          "phone",
          "website_url",
          "map_url",
          "address_label",
          "starting_price_cents",
          "starting_price_currency",
          "capacity_max",
          "event_types",
          "years_in_business",
          "languages",
          "team_size_range",
          "pricing_typical_spend_cents",
          "pricing_typical_spend_currency",
          "pricing_peak_seasons",
          "review_ai_summary",
        ].join(",")
      )
      .single();

    if (insertedError) {
      throw new Error(insertedError.message);
    }

    if (typeof insertedData === "string") {
      throw new Error(insertedData);
    }

    vendor = insertedData ?? null;
  }

  if (!vendor) {
    throw new Error("Vendor profile not found.");
  }

  const v: VendorRow = vendor;
  const bio = parseLocalizedPair(v.bio);
  const extraInfo = (v.extra_info ?? {}) as Record<string, unknown>;
  const extraPair = parseLocalizedPair(v.extra_info);

  const initial = {
    slug: v.slug ?? "",
    business_name: v.business_name ?? "",
    bio_en: bio.en,
    bio_es: bio.es,
    extra_info_en: extraPair.en,
    extra_info_es: extraPair.es,
  };

  const contactInitial = {
    logo_url: v.logo_url ?? "",
    phone: v.phone ?? "",
    website_url: v.website_url ?? "",
    map_url: v.map_url ?? "",
    address_label: v.address_label ?? "",
    starting_price: v.starting_price_cents ? (v.starting_price_cents / 100).toString() : "",
    starting_price_currency: v.starting_price_currency ?? "USD",
    event_types: toCsv(v.event_types),
    years_in_business: v.years_in_business ? String(v.years_in_business) : "",
    languages: toCsv(v.languages),
    team_size_range: v.team_size_range ?? "",
  };

  const { data: pricingData } = await supabase
    .from("vendor_pricing")
    .select("item_key, price_cents, currency, contact_for_price, notes")
    .eq("vendor_id", v.id);

  const pricingRows = (pricingData ?? []) as PricingRow[];

  const pricingInitial = {
    items: PRICING_KEYS.map((key) => {
      const row = pricingRows.find((item) => item.item_key === key) ?? null;
      const notes = parseLocalizedPair(row?.notes ?? null);
      return {
        itemKey: key,
        price: row?.price_cents ? (row.price_cents / 100).toString() : "",
        contactForPrice: Boolean(row?.contact_for_price),
        notesEn: notes.en,
        notesEs: notes.es,
      };
    }),
    typicalSpend: v.pricing_typical_spend_cents
      ? (v.pricing_typical_spend_cents / 100).toString()
      : "",
    typicalSpendCurrency: v.pricing_typical_spend_currency ?? v.starting_price_currency ?? "USD",
    peakSeasons: toCsv(v.pricing_peak_seasons),
  };

  const { data: amenityData } = await supabase
    .from("amenity_lookup")
    .select("key, group_key, label")
    .order("group_key", { ascending: true })
    .order("key", { ascending: true });

  const amenityOptions = (amenityData ?? []) as AmenityOption[];

  const { data: vendorAmenityData } = await supabase
    .from("vendor_amenities")
    .select("amenity_key")
    .eq("vendor_id", v.id);

  const amenitiesInitial = {
    selectedKeys: (vendorAmenityData ?? []).map((row) => row.amenity_key as string),
    capacityMax: v.capacity_max ? String(v.capacity_max) : "",
    eventTypes: toCsv(v.event_types),
  };

  const { data: teamData } = await supabase
    .from("vendor_team")
    .select("id, name, title, bio, headshot_url, responds_within_hours, sort_order, created_at")
    .eq("vendor_id", v.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const teamRows = (teamData ?? []) as TeamRow[];

  const teamInitial = teamRows.map((member) => ({
    id: member.id,
    name: member.name ?? "",
    title: resolveLocalizedInput(member.title, "en"),
    bio: resolveLocalizedInput(member.bio, "en"),
    headshotUrl: member.headshot_url ?? "",
    respondsWithinHours: member.responds_within_hours
      ? String(member.responds_within_hours)
      : "",
  }));

  const { data: availabilityData } = await supabase
    .from("vendor_availability")
    .select("id, available_on, availability_status")
    .eq("vendor_id", v.id)
    .order("available_on", { ascending: true });

  const availabilityRows = (availabilityData ?? []) as AvailabilityRow[];

  const googleBusinessProfileUrl =
    typeof extraInfo["google_business_profile_url"] === "string"
      ? String(extraInfo["google_business_profile_url"]).trim()
      : "";

  const reviewsInitial = {
    summary: v.review_ai_summary ?? "",
    googleBusinessProfileUrl,
  };

  const heroImage = v.hero_image?.url ? v.hero_image : null;
  const thumbnailImage = v.thumbnail_image?.url ? v.thumbnail_image : null;
  const galleryImages = Array.isArray(v.gallery_images)
    ? (v.gallery_images as VendorImage[]).filter((asset) =>
        Boolean(asset && typeof asset.url === "string" && asset.url.length > 0)
      )
    : [];

  const safeGallery = galleryImages.map((img) => ({ ...img }));

  return (
    <VendorProfileTabs
      profileInitial={initial}
      vendorName={initial.business_name}
      heroImage={heroImage}
      thumbnailImage={thumbnailImage}
      galleryImages={safeGallery}
      contactInitial={contactInitial}
      pricingInitial={pricingInitial}
      amenitiesInitial={amenitiesInitial}
      amenityOptions={amenityOptions}
      teamInitial={teamInitial}
      availabilityInitial={{
        dates: availabilityRows.map((row) => ({
          date: row.available_on,
          status: row.availability_status,
        })),
      }}
      reviewsInitial={reviewsInitial}
    />
  );
}
