import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import VendorAbout from "@/components/vendor/VendorAbout";
import VendorAmenities from "@/components/vendor/VendorAmenities";
import VendorPricing from "@/components/vendor/VendorPricing";
import type { VendorProfileDTO } from "@/types/vendor-profile";

const vendor: VendorProfileDTO["vendor"] = {
    id: "vendor-1",
    slug: "vendor-1",
    name: "Harborview Ballroom",
    summary: "A coastal venue with sweeping harbor views.",
    description: "Plan your ceremony and reception in style.",
    yearsInBusiness: 12,
    languages: ["English", "Spanish"],
    teamSizeRange: "5-10",
    phone: "123-456-7890",
    websiteUrl: "https://example.com",
    logoUrl: null,
    startingPriceCents: 350000,
    startingPriceCurrency: "USD",
    capacityMax: 180,
    eventTypes: ["Ceremony", "Reception"],
    typicalSpendCents: 520000,
    typicalSpendCurrency: "USD",
    peakSeasons: ["Spring", "Fall"],
    ratingAvg: 4.8,
    ratingCount: 37,
    reviewAiSummary: "Couples rave about the service and views.",
    location: {
      city: "Boston",
      region: "MA",
      country: "USA",
      state: "MA",
      address: "123 Harbor Way",
      addressLabel: "123 Harbor Way, Boston, MA",
      mapUrl: "https://maps.example.com",
    },
};

test("renders vendor summary and spaces", () => {
  const html = renderToStaticMarkup(
    <VendorAbout
      vendor={vendor}
      spaces={[
        { id: "space-1", name: "Great Room", description: "Ideal for receptions", capacityMin: 50, capacityMax: 180 },
      ]}
    />
  );

  assert.ok(html.includes("Harborview Ballroom"));
  assert.ok(html.includes("Great Room"));
});

test("renders pricing rows", () => {
  const html = renderToStaticMarkup(
    <VendorPricing
      vendor={vendor}
      pricing={[
        { itemKey: "reception", priceCents: 450000, currency: "USD", contactForPrice: false, notes: "Includes tables" },
        { itemKey: "ceremony", priceCents: null, currency: "USD", contactForPrice: true, notes: null },
        { itemKey: "bar", priceCents: 85000, currency: "USD", contactForPrice: false, notes: "Open bar" },
        { itemKey: "catering", priceCents: 150000, currency: "USD", contactForPrice: false, notes: "Plated dinner" },
      ]}
    />
  );

  assert.ok(html.includes("Reception"));
  assert.ok(html.includes("Couples usually spend"));
  assert.ok(html.includes("Contact for price"));
});

test("renders amenity groups", () => {
  const html = renderToStaticMarkup(
    <VendorAmenities
      amenities={{
        amenities: [
          { key: "parking", label: "Parking" },
          { key: "bridal_suite", label: "Bridal Suite" },
        ],
        ceremonyTypes: [{ key: "indoor", label: "Indoor" }],
        settings: [{ key: "waterfront", label: "Waterfront" }],
        services: [{ key: "cleanup", label: "Cleanup" }],
      }}
      capacityMax={vendor.capacityMax}
    />
  );

  assert.ok(html.includes("Parking"));
  assert.ok(html.includes("Maximum capacity: 180 guests"));
});
