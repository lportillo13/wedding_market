import { fillTemplate, getLanguageLocale, type CommonDictionary, type SupportedLanguage } from "@/lib/i18n";

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
  return new Intl.DateTimeFormat(getLanguageLocale(language), {
    dateStyle: "medium",
  }).format(new Date(eventDate));
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

  if (eventDate) {
    return fillTemplate(labels.formatting.titleForDate, { date: formatRfqDate(eventDate, language) });
  }

  return labels.formatting.titleFallback;
}

export function formatRfqMeta(
  { city, state, country, eventDate }: RfqDisplayInput,
  labels: RfqPageLabels,
  language: SupportedLanguage
) {
  const location = joinLocation([city, state, country]) || labels.formatting.locationTbd;
  const date = eventDate ? formatRfqDate(eventDate, language) : labels.dateTbd;
  return `${location} · ${date}`;
}
