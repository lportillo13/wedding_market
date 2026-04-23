import { parseMediaAsset } from "@/lib/images";
import {
  buildVendorAdIntentContext,
  getDefaultVendorAdsConfig,
  normalizeMatchList,
  normalizeVendorAdsConfig,
  scoreSponsoredPlacement,
  tokenizeAdText,
  type VendorAdContextSignals,
  type SponsoredVendorAd,
  type VendorAdIntentContext,
  type VendorAdsConfig,
  type VendorAdsVendorOption,
  type VendorAdsVendorSummary,
} from "@/lib/content/vendorAds";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type VendorSearchRow = {
  id: string | null;
  slug: string | null;
  business_name: string | null;
  categories: string[] | null;
  bio_en: string | null;
  bio_es: string | null;
  thumbnail_image: unknown;
  rating_avg: number | string | null;
  rating_count: number | null;
};

type ProfileIntentRow = {
  country: string | null;
  guest_count: number | null;
  wedding_budget: number | null;
  wedding_theme: string | null;
};

type RfqIntentRow = {
  country: string | null;
  guest_count: number | null;
  budget_min: number | null;
  budget_max: number | null;
  theme: string | null;
  notes: string | null;
  created_at: string | null;
};

async function getSiteSupabase() {
  return createSupabaseAdminClient() ?? (await createSupabaseServerClient());
}

function toVendorSummary(row: VendorSearchRow): VendorAdsVendorSummary | null {
  if (!row.id || !row.slug || !row.business_name) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    businessName: row.business_name,
    categories: Array.isArray(row.categories) ? row.categories.filter((category) => typeof category === "string") : [],
    bioEn: row.bio_en ?? "",
    bioEs: row.bio_es ?? "",
    thumbnailUrl: parseMediaAsset(row.thumbnail_image)?.url ?? null,
    ratingAvg: Number(row.rating_avg ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
  };
}

async function loadLatestUserRfqIntent(userId: string): Promise<RfqIntentRow | null> {
  const supabase = await getSiteSupabase();
  const ownerColumns: OwnerColumn[] = ["owner_id", "owner_uuid"];

  for (const column of ownerColumns) {
    const { data, error } = await supabase
      .from("rfqs")
      .select("country, guest_count, budget_min, budget_max, theme, notes, created_at")
      .eq(column, userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<RfqIntentRow>();

    if (!error) {
      return data;
    }

    if (!isMissingOwnerColumnError(error, column)) {
      throw new Error(error.message);
    }
  }

  return null;
}

function resolveBudget(profile: ProfileIntentRow | null, rfq: RfqIntentRow | null): number | null {
  if (typeof rfq?.budget_max === "number" && Number.isFinite(rfq.budget_max)) {
    return rfq.budget_max;
  }

  if (typeof rfq?.budget_min === "number" && Number.isFinite(rfq.budget_min)) {
    return rfq.budget_min;
  }

  if (typeof profile?.wedding_budget === "number" && Number.isFinite(profile.wedding_budget)) {
    return profile.wedding_budget;
  }

  return null;
}

export async function loadVendorAdIntentContext(options?: {
  userId?: string | null;
} & VendorAdContextSignals): Promise<VendorAdIntentContext> {
  const baseContext = buildVendorAdIntentContext({
    searchQuery: options?.searchQuery,
    category: options?.category,
    keywords: options?.keywords,
    themes: options?.themes,
    countries: options?.countries,
    budget: options?.budget,
    guestCount: options?.guestCount,
  });

  if (!options?.userId) {
    return baseContext;
  }

  try {
    const supabase = await getSiteSupabase();
    const [{ data: profile }, latestRfq] = await Promise.all([
      supabase
        .from("profiles")
        .select("country, guest_count, wedding_budget, wedding_theme")
        .eq("id", options.userId)
        .maybeSingle<ProfileIntentRow>(),
      loadLatestUserRfqIntent(options.userId),
    ]);

    return {
      searchQuery: baseContext.searchQuery,
      category: baseContext.category,
      keywords: normalizeMatchList([...baseContext.keywords, ...tokenizeAdText(latestRfq?.notes)]),
      themes: normalizeMatchList([...baseContext.themes, latestRfq?.theme, profile?.wedding_theme]),
      countries: normalizeMatchList([...baseContext.countries, latestRfq?.country, profile?.country]),
      budget: baseContext.budget ?? resolveBudget(profile ?? null, latestRfq),
      guestCount:
        baseContext.guestCount ??
        (typeof latestRfq?.guest_count === "number" && Number.isFinite(latestRfq.guest_count)
          ? latestRfq.guest_count
          : typeof profile?.guest_count === "number" && Number.isFinite(profile.guest_count)
            ? profile.guest_count
            : null),
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Unable to load vendor ad intent context", error);
    }

    return baseContext;
  }
}

export async function loadVendorAdsConfig(): Promise<VendorAdsConfig> {
  try {
    const supabase = await getSiteSupabase();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "vendors.ads.config")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return normalizeVendorAdsConfig(data?.value);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Unable to load vendor ads config", error);
    }

    return getDefaultVendorAdsConfig();
  }
}

export async function loadVendorAdsVendorOptions(): Promise<VendorAdsVendorOption[]> {
  try {
    const supabase = await getSiteSupabase();
    const { data, error } = await supabase
      .from("vendor_public_search")
      .select("id, slug, business_name, categories, thumbnail_image")
      .eq("is_published", true)
      .order("business_name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).flatMap((row) => {
      if (!row.id || !row.slug || !row.business_name) {
        return [];
      }

      return [
        {
          id: row.id,
          businessName: row.business_name,
          slug: row.slug,
          categories: Array.isArray(row.categories) ? row.categories.filter((category) => typeof category === "string") : [],
          thumbnailUrl: parseMediaAsset(row.thumbnail_image)?.url ?? null,
        },
      ];
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Unable to load vendor ad options", error);
    }

    return [];
  }
}

export async function loadSponsoredVendorAds(
  config: VendorAdsConfig,
  options?: {
    userId?: string | null;
    searchQuery?: string | null;
    category?: string | null;
    keywords?: string[];
    themes?: string[];
    countries?: string[];
    budget?: number | null;
    guestCount?: number | null;
    excludeVendorId?: string | null;
  },
): Promise<SponsoredVendorAd[]> {
  const placements = config.sponsoredSection.placements.filter(
    (placement) => placement.active && placement.vendorId.trim().length > 0,
  );

  if (placements.length === 0) {
    return [];
  }

  const seenVendorIds = new Set<string>();
  const uniquePlacements = placements.filter((placement) => {
    if (seenVendorIds.has(placement.vendorId)) {
      return false;
    }

    seenVendorIds.add(placement.vendorId);
    return true;
  });

  try {
    const [supabase, context] = await Promise.all([
      getSiteSupabase(),
      loadVendorAdIntentContext({
        userId: options?.userId ?? null,
        searchQuery: options?.searchQuery ?? null,
        category: options?.category ?? null,
        keywords: options?.keywords ?? [],
        themes: options?.themes ?? [],
        countries: options?.countries ?? [],
        budget: options?.budget ?? null,
        guestCount: options?.guestCount ?? null,
      }),
    ]);

    const { data, error } = await supabase
      .from("vendor_public_search")
      .select("id, slug, business_name, categories, bio_en, bio_es, thumbnail_image, rating_avg, rating_count")
      .in(
        "id",
        uniquePlacements.map((placement) => placement.vendorId),
      );

    if (error) {
      throw new Error(error.message);
    }

    const vendorMap = new Map(
      (data as VendorSearchRow[] | null | undefined)
        ?.map((row) => toVendorSummary(row))
        .filter((row): row is VendorAdsVendorSummary => Boolean(row))
        .map((row) => [row.id, row]) ?? [],
    );

    const rankedPlacements = uniquePlacements
      .map((placement, index) => {
        const vendor = vendorMap.get(placement.vendorId);
        if (!vendor || vendor.id === options?.excludeVendorId) {
          return null;
        }

        return {
          placement,
          vendor,
          score: scoreSponsoredPlacement(placement, vendor, context),
          index,
        };
      })
      .filter(
        (
          item,
        ): item is {
          placement: SponsoredVendorAd["placement"];
          vendor: SponsoredVendorAd["vendor"];
          score: number;
          index: number;
        } => Boolean(item),
      )
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.index - right.index;
      });

    const contextMatchedPlacements = rankedPlacements.filter((item) => item.score > 0);
    const visiblePlacements =
      contextMatchedPlacements.length > 0 ? contextMatchedPlacements : rankedPlacements;

    return visiblePlacements.map(({ placement, vendor }) => ({ placement, vendor }));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Unable to load sponsored vendors", error);
    }

    return [];
  }
}
