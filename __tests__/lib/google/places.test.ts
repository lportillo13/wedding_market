import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildFindPlaceQuery } from "@/lib/google/places";

describe("buildFindPlaceQuery", () => {
  it("prefers explicit q parameter", () => {
    const query = buildFindPlaceQuery(
      "https://www.google.com/maps/place/?q=The+Cake+Shop"
    );
    assert.equal(query, "The Cake Shop");
  });

  it("extracts readable text from place path", () => {
    const query = buildFindPlaceQuery(
      "https://www.google.com/maps/place/Flower-Boutique/@12.34,56.78,17z/data=!3m1!4b1"
    );
    assert.equal(query, "Flower Boutique");
  });

  it("falls back to raw input when no better candidate is available", () => {
    const query = buildFindPlaceQuery("Custom Business Name");
    assert.equal(query, "Custom Business Name");
  });
});
