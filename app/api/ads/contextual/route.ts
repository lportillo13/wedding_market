import { NextRequest, NextResponse } from "next/server";
import { VENDOR_ADS_PUBLICLY_VISIBLE } from "@/lib/content/vendorAds";
import { loadSponsoredVendorAds, loadVendorAdsConfig } from "@/lib/content/vendorAdsServer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ContextualAdsPayload = {
  searchQuery?: string | null;
  category?: string | null;
  keywords?: string[];
  themes?: string[];
  countries?: string[];
  budget?: number | null;
  guestCount?: number | null;
  excludeVendorId?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function readNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parsePayload(body: unknown): ContextualAdsPayload {
  if (!isRecord(body)) {
    return {};
  }

  const context = isRecord(body.context) ? body.context : body;

  return {
    searchQuery: readString(context.searchQuery),
    category: readString(context.category),
    keywords: readStringList(context.keywords),
    themes: readStringList(context.themes),
    countries: readStringList(context.countries),
    budget: readNullableNumber(context.budget),
    guestCount: readNullableNumber(context.guestCount),
    excludeVendorId: readString(context.excludeVendorId),
  };
}

async function getContextualAdsUserId() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!VENDOR_ADS_PUBLICLY_VISIBLE) {
      return NextResponse.json({ sponsoredVendors: [] });
    }

    const body = await request.json().catch(() => null);
    const context = parsePayload(body);
    const [userId, adsConfig] = await Promise.all([getContextualAdsUserId(), loadVendorAdsConfig()]);

    const sponsoredVendors = adsConfig.sponsoredSection.enabled
      ? await loadSponsoredVendorAds(adsConfig, {
          userId,
          searchQuery: context.searchQuery,
          category: context.category,
          keywords: context.keywords,
          themes: context.themes,
          countries: context.countries,
          budget: context.budget,
          guestCount: context.guestCount,
          excludeVendorId: context.excludeVendorId,
        })
      : [];

    return NextResponse.json({
      sponsoredVendors: sponsoredVendors.slice(0, 3),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load contextual ads.";
    return NextResponse.json({ error: message, sponsoredVendors: [] }, { status: 500 });
  }
}
