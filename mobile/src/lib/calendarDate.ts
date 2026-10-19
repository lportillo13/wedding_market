/** Date-only database fields must not shift when displayed in another time zone. */
export function formatCalendarDate(value: string, locale: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date.toLocaleDateString(locale, { timeZone: "UTC" });
}
