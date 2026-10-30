/** Prices use decimal units, at most two places, and stay exact in JavaScript before storage in bigint columns. */
export function profilePriceToCents(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(text))
    throw new Error(
      "Enter a non-negative amount with up to two decimals, without thousands separators.",
    );
  const [whole, fraction = ""] = text.replace(",", ".").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents))
    throw new Error("This price exceeds the supported amount.");
  return cents;
}

export function profileStartingPrice(price: string, currency: string, existingCurrency = 'USD') {
  const cents = profilePriceToCents(price.trim());
  const code = currency.trim().toUpperCase();
  if (code && !/^[A-Z]{3}$/.test(code)) throw new Error('Use a three-letter currency code, such as USD or CRC.');
  return {starting_price_cents:cents, starting_price_currency:code || cents !== null ? code || existingCurrency || 'USD' : null};
}

export function prepareProfilePricing(input: unknown, defaultCurrency: string) {
  if (!Array.isArray(input) || input.length > 100)
    throw new Error("Add up to 100 pricing packages.");
  const currency = defaultCurrency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency))
    throw new Error("Use a three-letter currency code, such as USD or CRC.");
  const keys = new Set<string>();
  return input.map((value: unknown) => {
    if (!value || typeof value !== "object")
      throw new Error("Invalid pricing package.");
    const item = value as Record<string, unknown>;
    const key = typeof item.itemKey === "string" ? item.itemKey.trim() : "";
    if (!key || key.length > 120 || keys.has(key.toLowerCase()))
      throw new Error(
        "Give each package a unique name of up to 120 characters.",
      );
    keys.add(key.toLowerCase());
    const rowCurrency =
      typeof item.currency === "string" && item.currency.trim()
        ? item.currency.trim().toUpperCase()
        : currency;
    if (!/^[A-Z]{3}$/.test(rowCurrency))
      throw new Error("Use a three-letter currency code for each package.");
    if (
      typeof item.contactForPrice !== "boolean" ||
      typeof item.price !== "string"
    )
      throw new Error("Invalid package price.");
    const notes: Record<string, string> = {};
    if (typeof item.notesEn === "string" && item.notesEn.trim())
      notes.en = item.notesEn.trim();
    if (typeof item.notesEs === "string" && item.notesEs.trim())
      notes.es = item.notesEs.trim();
    const price = item.contactForPrice ? null : profilePriceToCents(item.price);
    if (price === null && !item.contactForPrice)
      throw new Error(
        "Add a price or choose contact for price for each package.",
      );
    return {
      item_key: key,
      price_cents: price,
      currency: rowCurrency,
      contact_for_price: item.contactForPrice,
      notes,
    };
  });
}

/** Hydrate every saved package, including custom names and packages from an earlier category. */
export function profilePricingDrafts(
  rows: readonly {
    item_key: string;
    price_cents: number | null;
    currency?: string | null;
    contact_for_price?: boolean | null;
    notes?: unknown;
  }[],
  defaultCurrency = "USD",
) {
  return rows.map((row) => {
    const notes =
      row.notes && typeof row.notes === "object"
        ? (row.notes as Record<string, unknown>)
        : {};
    const legacy = typeof row.notes === "string" ? row.notes : "";
    return {
      itemKey: row.item_key,
      price: row.price_cents !== null ? String(row.price_cents / 100) : "",
      currency: row.currency || defaultCurrency,
      contactForPrice: Boolean(row.contact_for_price),
      notesEn: typeof notes.en === "string" ? notes.en : legacy,
      notesEs: typeof notes.es === "string" ? notes.es : legacy,
    };
  });
}
