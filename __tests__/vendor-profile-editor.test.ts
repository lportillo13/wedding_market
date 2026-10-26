import { runProfileAction } from "../lib/client/profile-actions";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  prepareProfilePricing,
  profilePriceToCents,
} from "../shared/vendors/pricing";
import { getProfileEssentials } from "../shared/vendors/profile-progress";
import { getVendorPricingOrder } from "../shared/vendors/service-profile";

test("photography suggestions fit the service while saved custom and legacy rows survive", () => {
  assert.ok(getVendorPricingOrder(["photography"]).includes("photo_coverage"));
  assert.ok(!getVendorPricingOrder(["photography"]).includes("catering"));
});
test("package saves preserve custom names, row currencies, free prices and bilingual notes", () => {
  const rows = prepareProfilePricing(
    [
      {
        itemKey: "Intimate wedding",
        price: "24,95",
        currency: "CRC",
        contactForPrice: false,
        notesEn: "English",
        notesEs: "Español",
      },
      { itemKey: "Consultation", price: "0", contactForPrice: false },
      { itemKey: "photo_coverage", price: "", contactForPrice: true },
    ],
    "USD",
  );
  assert.equal(rows[0].price_cents, 2495);
  assert.equal(rows[0].currency, "CRC");
  assert.deepEqual(rows[0].notes, { en: "English", es: "Español" });
  assert.equal(rows[1].price_cents, 0);
  assert.equal(rows[2].price_cents, null);
});
test("invalid or ambiguous prices fail before replacing saved packages", () => {
  for (const text of [
    "-5",
    "1,500.00",
    "1.500,00",
    "12abc",
    "1e3",
    "Infinity",
    "1.234",
    "90071992547409.92",
  ])
    assert.throws(() => profilePriceToCents(text));
  assert.equal(
    profilePriceToCents("90071992547409.91"),
    Number.MAX_SAFE_INTEGER,
  );
  assert.equal(profilePriceToCents(""), null);
  assert.equal(profilePriceToCents("50000000.00"), 5000000000);
  assert.throws(() => prepareProfilePricing(null, "USD"));
  assert.throws(() =>
    prepareProfilePricing(
      [{ itemKey: "Blank", price: "", contactForPrice: false }],
      "USD",
    ),
  );
  assert.throws(() =>
    prepareProfilePricing(
      [
        { itemKey: "A", price: "1", contactForPrice: false },
        { itemKey: "a", price: "1", contactForPrice: false },
      ],
      "USD",
    ),
  );
});
test("profile guidance tracks four essentials without making optional team, reviews or dates mandatory", () => {
  const steps = getProfileEssentials({
    name: "Brisa",
    description: "Wedding photography",
    hasPhoto: true,
    hasContact: true,
    hasPricing: true,
  });
  assert.equal(steps.filter((step) => step.complete).length, 4);
  assert.deepEqual(
    steps.map((step) => step.id),
    ["details", "images", "contact", "pricing"],
  );
});

test("network failures return form feedback instead of throwing away the editor", async () => {
  const previous = { ok: true, message: "Saved" };
  const result = await runProfileAction(
    async () => {
      throw new TypeError("Failed to fetch");
    },
    previous,
    new FormData(),
    "Please retry",
  );
  assert.deepEqual(result, { ok: false, message: "Please retry" });
  assert.deepEqual(previous, { ok: true, message: "Saved" });
  assert.deepEqual(
    await runProfileAction(
      async () => ({ ok: true, message: "Saved again" }),
      previous,
      new FormData(),
      "Please retry",
    ),
    { ok: true, message: "Saved again" },
  );
});
