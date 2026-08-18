import type { InboxRfqRow } from "@/lib/inbox";

type InquirySummaryProps = {
  rfq: InboxRfqRow;
  language: "en" | "es";
  locale: string;
  eventDateTbd: string;
  guestCountTbd: string;
  locationTbd?: string;
};

function formatOption(value: string, language: "en" | "es") {
  const themeLabels: Record<string, { en: string; es: string }> = {
    classic: { en: "Classic", es: "Clásico" },
    boho: { en: "Boho", es: "Bohemio" },
    rustic: { en: "Rustic", es: "Rústico" },
    beach: { en: "Beach", es: "Playa" },
    garden: { en: "Garden", es: "Jardín" },
    modern: { en: "Modern", es: "Moderno" },
    vintage: { en: "Vintage", es: "Vintage" },
  };
  return themeLabels[value.toLowerCase()]?.[language] ?? value.replace(/[-_]+/g, " ");
}

function formatBudget(rfq: InboxRfqRow, locale: string) {
  if (rfq.budget_min == null && rfq.budget_max == null) return null;
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  if (rfq.budget_min != null && rfq.budget_max != null && rfq.budget_min === rfq.budget_max) {
    return formatter.format(rfq.budget_min);
  }
  const minimum = rfq.budget_min == null ? "?" : formatter.format(rfq.budget_min);
  const maximum = rfq.budget_max == null ? "?" : formatter.format(rfq.budget_max);
  return `${minimum} – ${maximum}`;
}

export default function InquirySummary({
  rfq,
  language,
  locale,
  eventDateTbd,
  guestCountTbd,
  locationTbd = "—",
}: InquirySummaryProps) {
  const labels = language === "es"
    ? {
        date: "Fecha",
        flexible: "Flexible",
        fixed: "Fecha fija",
        location: "Ubicación",
        guests: "Invitados",
        budget: "Presupuesto",
        theme: "Estilo",
        language: "Idioma preferido",
        message: "Mensaje del cliente",
        notProvided: "No indicado",
        english: "Inglés",
        spanish: "Español",
      }
    : {
        date: "Date",
        flexible: "Flexible",
        fixed: "Fixed date",
        location: "Location",
        guests: "Guests",
        budget: "Budget",
        theme: "Theme",
        language: "Preferred language",
        message: "Client message",
        notProvided: "Not provided",
        english: "English",
        spanish: "Spanish",
      };
  const location = [rfq.city, rfq.state, rfq.country].filter(Boolean).join(", ") || locationTbd;
  const date = rfq.event_date
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(`${rfq.event_date}T00:00:00`))
    : eventDateTbd;
  const guests = typeof rfq.guest_count === "number"
    ? String(rfq.guest_count)
    : rfq.guest_count_range || guestCountTbd;
  const budget = formatBudget(rfq, locale);
  const preferredLanguage = rfq.language
    ? rfq.language.toLowerCase().startsWith("es") ? labels.spanish : labels.english
    : null;
  const details = [
    [labels.date, `${date} · ${rfq.flexible_date ? labels.flexible : labels.fixed}`],
    [labels.location, location],
    [labels.guests, guests],
    [labels.budget, budget ?? labels.notProvided],
    [labels.theme, rfq.theme ? formatOption(rfq.theme, language) : labels.notProvided],
    [labels.language, preferredLanguage ?? labels.notProvided],
  ];

  return (
    <dl className="mb-0">
      {details.map(([label, value]) => (
        <div className="d-flex justify-content-between gap-3 border-bottom py-2" key={label}>
          <dt className="small text-secondary fw-semibold">{label}</dt>
          <dd className="small text-end mb-0">{value}</dd>
        </div>
      ))}
      <div className="pt-3">
        <dt className="small text-secondary fw-semibold mb-1">{labels.message}</dt>
        <dd className="mb-0 text-break" style={{ whiteSpace: "pre-wrap" }}>
          {rfq.notes || labels.notProvided}
        </dd>
      </div>
    </dl>
  );
}
