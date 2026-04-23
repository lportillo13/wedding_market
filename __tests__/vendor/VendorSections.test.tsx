import { test } from "node:test";
import assert from "node:assert/strict";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import VendorAbout from "@/components/vendor/VendorAbout";
import VendorAmenities from "@/components/vendor/VendorAmenities";
import VendorPricing from "@/components/vendor/VendorPricing";
import { LanguageProvider } from "@/contexts/LanguageContext";
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

function renderWithLanguage(element: ReactElement) {
  return renderToStaticMarkup(<LanguageProvider initialLanguage="en">{element}</LanguageProvider>);
}

test("renders vendor summary and spaces", () => {
  const html = renderWithLanguage(
    <VendorAbout
      vendor={vendor}
      categoryKeys={["venues"]}
      spaces={[
        { id: "space-1", name: "Great Room", description: "Ideal for receptions", capacityMin: 50, capacityMax: 180 },
      ]}
    />
  );

  assert.ok(html.includes("Harborview Ballroom"));
  assert.ok(html.includes("Great Room"));
});

test("renders pricing rows", () => {
  const html = renderWithLanguage(
    <VendorPricing
      vendor={vendor}
      pricing={[
        { itemKey: "venue_rental", priceCents: 450000, currency: "USD", contactForPrice: false, notes: "Includes tables" },
        { itemKey: "ceremony_site", priceCents: null, currency: "USD", contactForPrice: true, notes: null },
        { itemKey: "bar_package", priceCents: 85000, currency: "USD", contactForPrice: false, notes: "Open bar" },
      ]}
      isLoggedIn
      loginHref="/login?next=%2Fvendors%2Fvendor-1"
      categoryKeys={["venues"]}
    />
  );

  assert.ok(html.includes("Venue Rental"));
  assert.ok(html.includes("Couples usually spend"));
  assert.ok(html.includes("Contact for price"));
});

test("filters legacy catering rows from photographer pricing", () => {
  const html = renderWithLanguage(
    <VendorPricing
      vendor={{ ...vendor, capacityMax: null }}
      pricing={[
        { itemKey: "photo_coverage", priceCents: 320000, currency: "USD", contactForPrice: false, notes: "8 hours" },
        { itemKey: "engagement_session", priceCents: 60000, currency: "USD", contactForPrice: false, notes: null },
        { itemKey: "catering", priceCents: 150000, currency: "USD", contactForPrice: false, notes: "Legacy wrong row" },
      ]}
      isLoggedIn
      loginHref="/login?next=%2Fvendors%2Fvendor-1"
      categoryKeys={["photography"]}
    />
  );

  assert.ok(html.includes("Wedding Photo Coverage"));
  assert.ok(!html.includes("Catering"));
});

test("renders amenity groups", () => {
  const html = renderWithLanguage(
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
      categoryKeys={["venues"]}
    />
  );

  assert.ok(html.includes("Parking"));
  assert.ok(html.includes("Guest count supported: up to 180"));
});

test("does not show capacity for photo details", () => {
  const html = renderWithLanguage(
    <VendorAmenities
      amenities={{
        amenities: [{ key: "digital_files", label: "Digital files" }],
        ceremonyTypes: [{ key: "engagement", label: "Engagement sessions" }],
        settings: [{ key: "documentary", label: "Documentary" }],
        services: [{ key: "second_photographer", label: "Second photographer" }],
      }}
      capacityMax={180}
      categoryKeys={["photography"]}
    />
  );

  assert.ok(html.includes("Photo Details"));
  assert.ok(html.includes("Deliverables"));
  assert.ok(!html.includes("Guest count supported"));
});
