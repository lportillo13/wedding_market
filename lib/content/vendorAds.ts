import type { SupportedLanguage } from "@/lib/i18n";

// Temporary site-wide kill switch for public ad/sponsor surfaces.
// Set this back to true when sponsored placements should be shown again.
export const VENDOR_ADS_PUBLICLY_VISIBLE = false;

export type VendorAdsCopy = Record<SupportedLanguage, string>;

export type VendorAdTargeting = {
  categories: string[];
  themes: string[];
  countries: string[];
  keywords: string[];
  minBudget: number | null;
  maxBudget: number | null;
  minGuestCount: number | null;
  maxGuestCount: number | null;
};

export type VendorAdsBanner = {
  enabled: boolean;
  badge: VendorAdsCopy;
  title: VendorAdsCopy;
  description: VendorAdsCopy;
  ctaLabel: VendorAdsCopy;
  ctaHref: string;
  imageUrl: string;
  imageAlt: VendorAdsCopy;
};

export type VendorSponsoredPlacement = {
  id: string;
  vendorId: string;
  active: boolean;
  badge: VendorAdsCopy;
  note: VendorAdsCopy;
  ctaLabel: VendorAdsCopy;
  targeting: VendorAdTargeting;
};

export type VendorAdsConfig = {
  directoryBanner: VendorAdsBanner;
  profileBanner: VendorAdsBanner;
  sponsoredSection: {
    enabled: boolean;
    title: VendorAdsCopy;
    description: VendorAdsCopy;
    placements: VendorSponsoredPlacement[];
  };
};

export type VendorAdsVendorSummary = {
  id: string;
  slug: string;
  businessName: string;
  categories: string[];
  bioEn: string;
  bioEs: string;
  thumbnailUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
};

export type VendorAdsVendorOption = {
  id: string;
  businessName: string;
  slug: string;
  categories: string[];
  thumbnailUrl: string | null;
};

export type SponsoredVendorAd = {
  placement: VendorSponsoredPlacement;
  vendor: VendorAdsVendorSummary;
};

export type VendorAdIntentContext = {
  searchQuery: string;
  category: string;
  keywords: string[];
  themes: string[];
  countries: string[];
  budget: number | null;
  guestCount: number | null;
};

export type VendorAdContextSignals = {
  searchQuery?: string | null;
  category?: string | null;
  keywords?: Array<string | null | undefined>;
  themes?: Array<string | null | undefined>;
  countries?: Array<string | null | undefined>;
  budget?: number | null;
  guestCount?: number | null;
};

function createCopy(en: string, es: string): VendorAdsCopy {
  return { en, es };
}

function createTargeting(): VendorAdTargeting {
  return {
    categories: [],
    themes: [],
    countries: [],
    keywords: [],
    minBudget: null,
    maxBudget: null,
    minGuestCount: null,
    maxGuestCount: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readNullableNumber(value: unknown, fallback: number | null): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function normalizeMatchValue(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function normalizeMatchList(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeMatchValue(value))
        .filter((value) => value.length > 0),
    ),
  );
}

export function tokenizeAdText(value: string | null | undefined): string[] {
  const normalized = normalizeMatchValue(value);
  if (!normalized) {
    return [];
  }

  return Array.from(
    new Set(
      normalized
        .split(/[^a-z0-9]+/i)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2),
    ),
  );
}

function readStringList(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return normalizeMatchList(value.filter((entry): entry is string => typeof entry === "string"));
}

function readIntentNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function buildVendorAdIntentContext(signals?: VendorAdContextSignals): VendorAdIntentContext {
  const searchQuery = (signals?.searchQuery ?? "").trim();

  return {
    searchQuery,
    category: normalizeMatchValue(signals?.category),
    keywords: normalizeMatchList([...(signals?.keywords ?? []), ...tokenizeAdText(searchQuery)]),
    themes: normalizeMatchList(signals?.themes ?? []),
    countries: normalizeMatchList(signals?.countries ?? []),
    budget: readIntentNumber(signals?.budget),
    guestCount: readIntentNumber(signals?.guestCount),
  };
}

function readCopy(value: unknown, fallback: VendorAdsCopy): VendorAdsCopy {
  if (typeof value === "string") {
    return {
      en: value,
      es: value,
    };
  }

  if (!isRecord(value)) {
    return fallback;
  }

  return {
    en: readString(value.en, fallback.en),
    es: readString(value.es, fallback.es),
  };
}

function readBanner(value: unknown, fallback: VendorAdsBanner): VendorAdsBanner {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: readBoolean(value.enabled, fallback.enabled),
    badge: readCopy(value.badge, fallback.badge),
    title: readCopy(value.title, fallback.title),
    description: readCopy(value.description, fallback.description),
    ctaLabel: readCopy(value.ctaLabel, fallback.ctaLabel),
    ctaHref: readString(value.ctaHref, fallback.ctaHref),
    imageUrl: readString(value.imageUrl, fallback.imageUrl),
    imageAlt: readCopy(value.imageAlt, fallback.imageAlt),
  };
}

function readTargeting(value: unknown, fallback: VendorAdTargeting): VendorAdTargeting {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    categories: readStringList(value.categories, fallback.categories),
    themes: readStringList(value.themes, fallback.themes),
    countries: readStringList(value.countries, fallback.countries),
    keywords: readStringList(value.keywords, fallback.keywords),
    minBudget: readNullableNumber(value.minBudget, fallback.minBudget),
    maxBudget: readNullableNumber(value.maxBudget, fallback.maxBudget),
    minGuestCount: readNullableNumber(value.minGuestCount, fallback.minGuestCount),
    maxGuestCount: readNullableNumber(value.maxGuestCount, fallback.maxGuestCount),
  };
}

function readPlacements(value: unknown, fallback: VendorSponsoredPlacement[]): VendorSponsoredPlacement[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      return [];
    }

    const defaultPlacement = createEmptySponsoredPlacement(index + 1);

    return [
      {
        id: readString(entry.id, defaultPlacement.id),
        vendorId: readString(entry.vendorId, defaultPlacement.vendorId),
        active: readBoolean(entry.active, defaultPlacement.active),
        badge: readCopy(entry.badge, defaultPlacement.badge),
        note: readCopy(entry.note, defaultPlacement.note),
        ctaLabel: readCopy(entry.ctaLabel, defaultPlacement.ctaLabel),
        targeting: readTargeting(entry.targeting, defaultPlacement.targeting),
      },
    ];
  });
}

export function createEmptySponsoredPlacement(index = 1): VendorSponsoredPlacement {
  const generatedId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `placement-${Date.now()}-${index}`;

  return {
    id: generatedId,
    vendorId: "",
    active: true,
    badge: createCopy("Sponsored", "Patrocinado"),
    note: createCopy(
      "Premium placement for vendors investing in additional visibility.",
      "Espacio premium para proveedores que invierten en visibilidad adicional.",
    ),
    ctaLabel: createCopy("View profile", "Ver perfil"),
    targeting: createTargeting(),
  };
}

export function getDefaultVendorAdsConfig(): VendorAdsConfig {
  return {
    directoryBanner: {
      enabled: true,
      badge: createCopy("Sponsored Discovery", "Descubrimiento patrocinado"),
      title: createCopy(
        "Featured partners can lead the conversation before couples scroll the full directory.",
        "Los socios destacados pueden liderar la conversacion antes de que las parejas recorran todo el directorio.",
      ),
      description: createCopy(
        "Use this banner for premium promotions, seasonal campaigns, or a house ad that points couples toward your next high-converting step.",
        "Usa este banner para promociones premium, campanas de temporada o un anuncio propio que lleve a las parejas al siguiente paso con mejor conversion.",
      ),
      ctaLabel: createCopy("Start with a quote", "Empezar con una cotizacion"),
      ctaHref: "/rfq/new",
      imageUrl: "",
      imageAlt: createCopy(
        "Decorative banner art for the vendor directory",
        "Arte decorativo del banner del directorio de proveedores",
      ),
    },
    profileBanner: {
      enabled: true,
      badge: createCopy("Planning Shortcut", "Atajo de planeacion"),
      title: createCopy(
        "Keep comparing standout vendors before you commit.",
        "Sigue comparando proveedores destacados antes de decidir.",
      ),
      description: createCopy(
        "A polished banner on profile pages gives you room for cross-sell campaigns, premium partners, or a high-intent CTA back into the RFQ flow.",
        "Un banner cuidado en las paginas de perfil te da espacio para campanas cruzadas, socios premium o una llamada a la accion de alta intencion hacia el flujo de cotizacion.",
      ),
      ctaLabel: createCopy("Browse more vendors", "Explorar mas proveedores"),
      ctaHref: "/vendors",
      imageUrl: "",
      imageAlt: createCopy(
        "Decorative banner art for vendor profile pages",
        "Arte decorativo del banner para paginas de perfil de proveedores",
      ),
    },
    sponsoredSection: {
      enabled: true,
      title: createCopy("Sponsored vendor spotlight", "Vitrina de proveedores patrocinados"),
      description: createCopy(
        "These placements now rank against search intent and saved wedding preferences so sponsors feel more relevant to each couple.",
        "Estas posiciones ahora se ordenan segun la busqueda y las preferencias guardadas de la boda para que los patrocinadores se sientan mas relevantes para cada pareja.",
      ),
      placements: [],
    },
  };
}

export function normalizeVendorAdsConfig(rawValue: unknown): VendorAdsConfig {
  const fallback = getDefaultVendorAdsConfig();

  if (!isRecord(rawValue)) {
    return fallback;
  }

  const sponsoredSection = isRecord(rawValue.sponsoredSection) ? rawValue.sponsoredSection : null;

  return {
    directoryBanner: readBanner(rawValue.directoryBanner, fallback.directoryBanner),
    profileBanner: readBanner(rawValue.profileBanner, fallback.profileBanner),
    sponsoredSection: {
      enabled: readBoolean(sponsoredSection?.enabled, fallback.sponsoredSection.enabled),
      title: readCopy(sponsoredSection?.title, fallback.sponsoredSection.title),
      description: readCopy(sponsoredSection?.description, fallback.sponsoredSection.description),
      placements: readPlacements(sponsoredSection?.placements, fallback.sponsoredSection.placements),
    },
  };
}

export function resolveVendorAdsCopy(copy: VendorAdsCopy, language: SupportedLanguage): string {
  const preferred = copy[language];
  if (typeof preferred === "string" && preferred.length > 0) {
    return preferred;
  }

  return language === "es" ? copy.en : copy.es;
}

export function hasTargetingRules(targeting: VendorAdTargeting): boolean {
  return (
    targeting.categories.length > 0 ||
    targeting.themes.length > 0 ||
    targeting.countries.length > 0 ||
    targeting.keywords.length > 0 ||
    targeting.minBudget !== null ||
    targeting.maxBudget !== null ||
    targeting.minGuestCount !== null ||
    targeting.maxGuestCount !== null
  );
}

function matchesTerm(source: string, target: string): boolean {
  return source === target || source.includes(target) || target.includes(source);
}

function countKeywordMatches(contextKeywords: string[], targets: string[]): number {
  let count = 0;

  for (const keyword of contextKeywords) {
    if (targets.some((target) => matchesTerm(keyword, target))) {
      count += 1;
    }
  }

  return count;
}

function valueInRange(value: number | null, min: number | null, max: number | null): boolean | null {
  if (value === null || (min === null && max === null)) {
    return null;
  }

  if (min !== null && value < min) {
    return false;
  }

  if (max !== null && value > max) {
    return false;
  }

  return true;
}

export function scoreSponsoredPlacement(
  placement: VendorSponsoredPlacement,
  vendor: VendorAdsVendorSummary,
  context: VendorAdIntentContext,
): number {
  const targeting = placement.targeting;
  let score = 0;

  if (context.category) {
    const vendorCategories = normalizeMatchList(vendor.categories);
    if (targeting.categories.some((category) => matchesTerm(context.category, category))) {
      score += 18;
    } else if (vendorCategories.some((category) => matchesTerm(context.category, category))) {
      score += 10;
    }
  }

  if (context.themes.some((theme) => targeting.themes.some((targetTheme) => matchesTerm(theme, targetTheme)))) {
    score += 8;
  }

  if (context.countries.some((country) => targeting.countries.some((targetCountry) => matchesTerm(country, targetCountry)))) {
    score += 6;
  }

  const budgetMatch = valueInRange(context.budget, targeting.minBudget, targeting.maxBudget);
  if (budgetMatch === true) {
    score += 5;
  } else if (budgetMatch === false) {
    score -= 3;
  }

  const guestMatch = valueInRange(context.guestCount, targeting.minGuestCount, targeting.maxGuestCount);
  if (guestMatch === true) {
    score += 4;
  } else if (guestMatch === false) {
    score -= 2;
  }

  const keywordMatches = countKeywordMatches(context.keywords, targeting.keywords);
  score += Math.min(keywordMatches, 4) * 3;

  const vendorSearchText = normalizeMatchValue(
    [vendor.businessName, vendor.categories.join(" "), vendor.bioEn, vendor.bioEs].join(" "),
  );

  for (const keyword of context.keywords) {
    if (vendorSearchText.includes(keyword)) {
      score += 1;
    }
  }

  if (!hasTargetingRules(targeting)) {
    score += 1;
  }

  return score;
}

export function cloneVendorAdsConfig(config: VendorAdsConfig): VendorAdsConfig {
  return JSON.parse(JSON.stringify(config)) as VendorAdsConfig;
}
