import { formatCalendarDate as formatDate } from "../../../shared/calendar/date";

/** Keep the existing native numeric display while sharing date validation. */
export function formatCalendarDate(value: string, locale: string): string | null {
  return formatDate(value, locale, {});
}
