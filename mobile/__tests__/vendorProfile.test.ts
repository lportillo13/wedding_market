import {
  profilePricingDrafts,
  prepareProfilePricing,
  profilePriceToCents,
} from "../../shared/vendors/pricing";
import { getVendorPricingOrder } from "../../shared/vendors/service-profile";

test("native editor preserves saved custom and legacy packages rather than replacing them with venue defaults", () => {
  const drafts = profilePricingDrafts([
    {
      item_key: "photo_coverage",
      price_cents: 240000,
      currency: "USD",
      notes: { en: "Eight hours", es: "Ocho horas" },
    },
    {
      item_key: "Intimate wedding",
      price_cents: 0,
      currency: "CRC",
      notes: {},
    },
    { item_key: "catering", price_cents: null, contact_for_price: true },
  ]);
  expect(drafts.map((row) => row.itemKey)).toEqual([
    "photo_coverage",
    "Intimate wedding",
    "catering",
  ]);
  expect(drafts[1].price).toBe("0");
  expect(prepareProfilePricing(drafts, "USD")[0].notes).toEqual({
    en: "Eight hours",
    es: "Ocho horas",
  });
  expect(prepareProfilePricing(drafts, "USD")[1].currency).toBe("CRC");
  expect(getVendorPricingOrder(["photography"])).not.toContain("catering");
});

test("CRC profile packages can exceed the integer limit used by quote fields", () => {
  expect(profilePriceToCents("50000000")).toBe(5000000000);
});
