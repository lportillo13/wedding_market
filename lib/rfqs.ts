import { fillTemplate, getLanguageLocale, type CommonDictionary, type SupportedLanguage } from "@/lib/i18n";
import { formatCalendarDate } from "@/lib/calendar-date";

type RfqDisplayInput = {
  city?: string | null;
  state?: string | null;
  country?: string | null;
  eventDate?: string | null;
};

type RfqPageLabels = CommonDictionary["account"]["rfqsPage"];

function joinLocation(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

function formatRfqDate(eventDate: string, language: SupportedLanguage) {
  return formatCalendarDate(eventDate, getLanguageLocale(language));
}

export function formatRfqTitle(
  { city, state, country, eventDate }: RfqDisplayInput,
  labels: RfqPageLabels,
  language: SupportedLanguage
) {
  const primaryLocation =
    joinLocation([city, state]) ||
    joinLocation([city, country]) ||
    state?.trim() ||
    country?.trim() ||
    null;

  if (primaryLocation) {
    return fillTemplate(labels.formatting.titleInLocation, { location: primaryLocation });
  }

  const formattedDate = eventDate ? formatRfqDate(eventDate, language) : null;
  if (formattedDate) {
    return fillTemplate(labels.formatting.titleForDate, { date: formattedDate });
  }

  return labels.formatting.titleFallback;
}

export function formatRfqMeta(
  { city, state, country, eventDate }: RfqDisplayInput,
  labels: RfqPageLabels,
  language: SupportedLanguage
) {
  const location = joinLocation([city, state, country]) || labels.formatting.locationTbd;
  const date = (eventDate ? formatRfqDate(eventDate, language) : null) ?? labels.dateTbd;
  return `${location} · ${date}`;
}
