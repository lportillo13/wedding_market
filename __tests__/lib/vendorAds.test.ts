import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildVendorAdIntentContext,
  createEmptySponsoredPlacement,
  getDefaultVendorAdsConfig,
  normalizeVendorAdsConfig,
  resolveVendorAdsCopy,
  scoreSponsoredPlacement,
} from "@/lib/content/vendorAds";

test("normalizes vendor ads config with sensible fallbacks", () => {
  const config = normalizeVendorAdsConfig({
    directoryBanner: {
      enabled: false,
      title: { en: "Custom title" },
      ctaHref: "/vendors",
    },
    sponsoredSection: {
      placements: [
        {
          vendorId: "vendor-1",
          badge: { es: "Socio premium" },
        },
      ],
    },
  });

  assert.equal(config.directoryBanner.enabled, false);
  assert.equal(config.directoryBanner.title.en, "Custom title");
  assert.equal(config.directoryBanner.title.es, getDefaultVendorAdsConfig().directoryBanner.title.es);
  assert.equal(config.sponsoredSection.placements.length, 1);
  assert.equal(config.sponsoredSection.placements[0]?.vendorId, "vendor-1");
  assert.equal(config.sponsoredSection.placements[0]?.badge.es, "Socio premium");
  assert.deepEqual(config.sponsoredSection.placements[0]?.targeting.categories, []);
  assert.equal(
    config.sponsoredSection.placements[0]?.ctaLabel.en,
    getDefaultVendorAdsConfig().sponsoredSection.placements[0]?.ctaLabel.en ?? "View profile",
  );
});

test("resolves localized copy with language fallback", () => {
  const copy = {
    en: "English",
    es: "",
  };

  assert.equal(resolveVendorAdsCopy(copy, "en"), "English");
  assert.equal(resolveVendorAdsCopy(copy, "es"), "English");
});

test("creates empty sponsored placements with shared copy scaffolding", () => {
  const placement = createEmptySponsoredPlacement(3);

  assert.equal(placement.vendorId, "");
  assert.equal(placement.active, true);
  assert.ok(placement.id.length > 0);
  assert.equal(placement.badge.en, "Sponsored");
  assert.deepEqual(placement.targeting.keywords, []);
});

test("builds ad intent context from explicit page signals", () => {
  const context = buildVendorAdIntentContext({
    searchQuery: "Beach Wedding Photo",
    category: "Photography",
    keywords: ["Luxury", "destination"],
    themes: ["Modern"],
    countries: ["Mexico"],
    budget: 8500,
    guestCount: 120,
  });

  assert.equal(context.searchQuery, "Beach Wedding Photo");
  assert.equal(context.category, "photography");
  assert.deepEqual(context.keywords, ["luxury", "destination", "beach", "wedding", "photo"]);
  assert.deepEqual(context.themes, ["modern"]);
  assert.deepEqual(context.countries, ["mexico"]);
  assert.equal(context.budget, 8500);
  assert.equal(context.guestCount, 120);
});

test("scores sponsored placements higher when search and profile intent match", () => {
  const placement = createEmptySponsoredPlacement(1);
  placement.targeting.categories = ["photography"];
  placement.targeting.themes = ["modern"];
  placement.targeting.countries = ["mexico"];
  placement.targeting.keywords = ["beach", "destination"];
  placement.targeting.minBudget = 4000;
  placement.targeting.maxBudget = 9000;
  placement.targeting.minGuestCount = 50;
  placement.targeting.maxGuestCount = 180;

  const vendor = {
    id: "vendor-1",
    slug: "seaside-studio",
    businessName: "Seaside Studio",
    categories: ["photography"],
    bioEn: "Destination wedding photography for modern beach celebrations.",
    bioEs: "",
    thumbnailUrl: null,
    ratingAvg: 4.8,
    ratingCount: 30,
  };

  const matched = scoreSponsoredPlacement(placement, vendor, {
    searchQuery: "beach photography",
    category: "photography",
    keywords: ["beach", "photography", "destination"],
    themes: ["modern"],
    countries: ["mexico"],
    budget: 6000,
    guestCount: 120,
  });

  const mismatched = scoreSponsoredPlacement(placement, vendor, {
    searchQuery: "rustic florist",
    category: "florist",
    keywords: ["rustic", "flowers"],
    themes: ["rustic"],
    countries: ["canada"],
    budget: 1500,
    guestCount: 15,
  });

  assert.ok(matched > mismatched);
});
