// quotes.amount_cents is a PostgreSQL integer, not a bigint.
export const MAX_QUOTE_AMOUNT_CENTS = 2_147_483_647;

/** Shared by web validation and native forms; never coerce malformed prices. */
export function parseQuoteAmountCents(value: string): number | null {
  const normalized = value.trim().replace(/^\$\s*/, "");
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.replaceAll(",", "").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 && cents <= MAX_QUOTE_AMOUNT_CENTS ? cents : null;
}
