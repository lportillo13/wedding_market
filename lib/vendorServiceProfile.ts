export type VendorAmenityGroupKey = "amenities" | "ceremonyTypes" | "settings" | "services";

export type VendorServiceProfile = {
  key: string;
  pricingItemOrder: string[];
  supportsGuestCapacity: boolean;
};

const CATEGORY_ALIASES: Record<string, string> = {
  decor: "flowers",
  destination: "destination_planning",
  destination_planner: "destination_planning",
  destination_planning: "destination_planning",
  planner: "planners",
  planning: "planners",
  transportation: "transport",
  transport: "transport",
};

const CATEGORY_PROFILES: Record<string, VendorServiceProfile> = {
  venues: {
    key: "venues",
    pricingItemOrder: ["venue_rental", "ceremony_site", "reception_package", "bar_package", "catering_package"],
    supportsGuestCapacity: true,
  },
  planners: {
    key: "planners",
    pricingItemOrder: ["full_planning", "partial_planning", "month_of_coordination", "destination_weekend"],
    supportsGuestCapacity: false,
  },
  photography: {
    key: "photography",
    pricingItemOrder: ["photo_coverage", "engagement_session", "second_shooter", "wedding_album"],
    supportsGuestCapacity: false,
  },
  videography: {
    key: "videography",
    pricingItemOrder: ["highlight_film", "documentary_film", "raw_footage", "drone_addon"],
    supportsGuestCapacity: false,
  },
  catering: {
    key: "catering",
    pricingItemOrder: ["plated_dinner", "buffet_service", "cocktail_hour", "late_night_snacks"],
    supportsGuestCapacity: true,
  },
  cakes: {
    key: "cakes",
    pricingItemOrder: ["wedding_cake", "dessert_bar", "tasting", "delivery_setup"],
    supportsGuestCapacity: false,
  },
  bar: {
    key: "bar",
    pricingItemOrder: ["hosted_bar", "signature_cocktails", "bartenders", "non_alcoholic"],
    supportsGuestCapacity: true,
  },
  music: {
    key: "music",
    pricingItemOrder: ["dj_reception", "ceremony_audio", "live_music", "lighting_addon"],
    supportsGuestCapacity: false,
  },
  flowers: {
    key: "flowers",
    pricingItemOrder: ["bridal_party_flowers", "ceremony_installation", "reception_centerpieces", "delivery_setup"],
    supportsGuestCapacity: false,
  },
  lighting: {
    key: "lighting",
    pricingItemOrder: ["uplighting", "ceremony_audio", "av_package", "dance_floor_lighting"],
    supportsGuestCapacity: false,
  },
  rentals: {
    key: "rentals",
    pricingItemOrder: ["tabletop_rentals", "lounge_furniture", "tenting", "delivery_setup"],
    supportsGuestCapacity: true,
  },
  beauty: {
    key: "beauty",
    pricingItemOrder: ["bridal_hair_makeup", "trial_session", "bridal_party_member", "touch_up_service"],
    supportsGuestCapacity: false,
  },
  attire: {
    key: "attire",
    pricingItemOrder: ["bridal_gown", "alterations", "accessories", "suit_tux"],
    supportsGuestCapacity: false,
  },
  officiants: {
    key: "officiants",
    pricingItemOrder: ["ceremony_officiating", "premarital_session", "rehearsal", "custom_ceremony"],
    supportsGuestCapacity: false,
  },
  stationery: {
    key: "stationery",
    pricingItemOrder: ["invitation_suite", "save_the_dates", "day_of_paper", "signage"],
    supportsGuestCapacity: false,
  },
  photobooth: {
    key: "photobooth",
    pricingItemOrder: ["booth_package", "prints_props", "digital_gallery", "attendant"],
    supportsGuestCapacity: false,
  },
  transport: {
    key: "transport",
    pricingItemOrder: ["getaway_car", "guest_shuttle", "party_bus", "airport_transfer"],
    supportsGuestCapacity: true,
  },
  accommodations: {
    key: "accommodations",
    pricingItemOrder: ["room_block", "welcome_bags", "hospitality_suite", "shuttle_coordination"],
    supportsGuestCapacity: true,
  },
  destination_planning: {
    key: "destination_planning",
    pricingItemOrder: ["travel_planning", "guest_itinerary", "vendor_sourcing", "weekend_coordination"],
    supportsGuestCapacity: false,
  },
};

const DEFAULT_PROFILE: VendorServiceProfile = {
  key: "default",
  pricingItemOrder: ["signature", "premium", "full_service"],
  supportsGuestCapacity: false,
};

const KNOWN_PROFILE_PRICING_KEYS = new Set(
  Object.values(CATEGORY_PROFILES).flatMap((profile) => profile.pricingItemOrder),
);

const LEGACY_GENERIC_PRICING_KEYS = new Set(["reception", "ceremony", "bar", "catering"]);

export function normalizeVendorCategoryKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const normalized = key.trim().toLowerCase().replace(/-/g, "_");
  return CATEGORY_ALIASES[normalized] ?? normalized;
}

export function getVendorServiceProfile(categoryKeys: readonly (string | null | undefined)[]): VendorServiceProfile {
  for (const key of categoryKeys) {
    const normalized = normalizeVendorCategoryKey(key);
    if (normalized && CATEGORY_PROFILES[normalized]) {
      return CATEGORY_PROFILES[normalized];
    }
  }

  return DEFAULT_PROFILE;
}

export function getVendorPricingOrder(categoryKeys: readonly (string | null | undefined)[]): string[] {
  const ordered = new Set<string>();

  for (const key of categoryKeys) {
    const normalized = normalizeVendorCategoryKey(key);
    const profile = normalized ? CATEGORY_PROFILES[normalized] : null;
    for (const itemKey of profile?.pricingItemOrder ?? []) {
      ordered.add(itemKey);
    }
  }

  if (ordered.size === 0) {
    for (const itemKey of DEFAULT_PROFILE.pricingItemOrder) {
      ordered.add(itemKey);
    }
  }

  return Array.from(ordered);
}

export function shouldShowPricingItem(itemKey: string, categoryKeys: readonly (string | null | undefined)[]): boolean {
  const normalized = itemKey.toLowerCase();
  const categoryOrder = getVendorPricingOrder(categoryKeys);

  if (categoryOrder.includes(normalized)) {
    return true;
  }

  if (LEGACY_GENERIC_PRICING_KEYS.has(normalized)) {
    const primary = getVendorServiceProfile(categoryKeys);
    if (primary.key === "venues") return true;
    if (primary.key === "catering") return normalized === "catering";
    if (primary.key === "bar") return normalized === "bar";
    return false;
  }

  return !KNOWN_PROFILE_PRICING_KEYS.has(normalized);
}

export function sortPricingItemKeys(
  itemKeys: readonly string[],
  categoryKeys: readonly (string | null | undefined)[],
): string[] {
  const order = getVendorPricingOrder(categoryKeys);
  return [...itemKeys].sort((a, b) => {
    const normalizedA = a.toLowerCase();
    const normalizedB = b.toLowerCase();
    const indexA = order.indexOf(normalizedA);
    const indexB = order.indexOf(normalizedB);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return normalizedA.localeCompare(normalizedB);
  });
}

export function humanizeVendorFieldKey(key: string): string {
  const specialCases: Record<string, string> = {
    av: "AV",
    dj: "DJ",
    mc: "MC",
  };

  return key
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => specialCases[part.toLowerCase()] ?? part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
