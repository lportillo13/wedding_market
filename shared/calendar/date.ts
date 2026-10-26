/** A wedding date is a calendar day, not an instant in the viewer's time zone. */
export function parseCalendarDate(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function formatCalendarDate(
  value: string | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string | null {
  const date = parseCalendarDate(value);
  return date ? new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(date) : null;
}
