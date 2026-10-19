/** Preserve fractional prices; do not round an agreed offer to whole dollars. */
export function formatQuoteAmount(
  cents: number | null | undefined,
  currency: string | null | undefined,
  locale?: string,
) {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: cents % 100 ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${currency || "USD"} ${(cents / 100).toFixed(2)}`;
  }
}
