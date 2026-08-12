import Link from "next/link";
import { redirect } from "next/navigation";
import AutocompleteInput from "@/components/search/AutocompleteInput";
import ThreadOpenLink from "@/components/inbox/ThreadOpenLink";
import { closeVendorInboxThreads, markVendorInboxThreadRead, restoreVendorInboxThreads } from "./actions";
import { getRoles } from "@/lib/auth/roles";
import { getLanguageLocale } from "@/lib/i18n";
import { getRequestI18n } from "@/lib/i18n/server";
import { loadVendorInboxThreads } from "@/lib/inbox";
import { buildAutocompleteSuggestions } from "@/lib/search/autocomplete";

function formatAmount(amountCents: number | null, currency: string | null, locale: string) {
  if (typeof amountCents !== "number") {
    return currency ?? "-";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency ?? "USD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function formatActivityLabel(value: string, locale: string, language: "en" | "es") {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return `${language === "es" ? "Hoy" : "Today"} · ${date.toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(date);
}

function statusLabel(language: "en" | "es", status: string) {
  const labels = {
    en: {
      new: "New lead",
      awaiting_response: "Awaiting your response",
      proposal_sent: "Proposal sent",
      accepted: "Accepted",
      declined: "Declined",
      expired: "Expired",
    },
    es: {
      new: "Nueva solicitud",
      awaiting_response: "Pendiente de tu respuesta",
      proposal_sent: "Propuesta enviada",
      accepted: "Aceptada",
      declined: "Rechazada",
      expired: "Expirada",
    },
  } as const;

  return labels[language][status as keyof (typeof labels)["en"]] ?? status;
}

function trimPreview(text: string | null | undefined, maxLength = 96) {
  if (!text) return null;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export default async function VendorInboxPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; view?: string }>;
}) {
  const { user, isVendor } = await getRoles();
  if (!user || !isVendor) redirect("/signup/vendor");

  const { dictionary, language } = await getRequestI18n();
  const locale = getLanguageLocale(language);
  const labels = {
    title: language === "es" ? "Bandeja de entrada" : "Inbox",
    subhead:
      language === "es"
        ? "Solicitudes y respuestas de clientes, organizadas para revisar y limpiar rapido."
        : "Client requests and replies, organized for quick review and cleanup.",
    empty: language === "es" ? "Todavia no tienes conversaciones con clientes." : "You do not have any client conversations yet.",
    emptyDeleted: language === "es" ? "No tienes conversaciones eliminadas." : "You do not have deleted conversations.",
    openThread: language === "es" ? "Abrir hilo" : "Open thread",
    noProposal: language === "es" ? "Sin propuesta" : "No proposal",
    dateTbd: dictionary.vendorRfqs.eventDateTbd,
    untitledLocation: language === "es" ? "Ubicacion por confirmar" : "Location to confirm",
    guests: language === "es" ? "invitados" : "guests",
    requestCode: language === "es" ? "Solicitud" : "Request",
    updated: language === "es" ? "Actualizado" : "Updated",
    notesFallback: language === "es" ? "Sin mensaje inicial." : "No opening note yet.",
    active: language === "es" ? "Conversaciones" : "Conversations",
    deleted: dictionary.account.notificationsPage.deletedTitle,
    searchPlaceholder: language === "es" ? "Buscar solicitud, lugar o mensaje" : "Search request, location, or message",
    searchButton: language === "es" ? "Buscar" : "Search",
    clearSearch: language === "es" ? "Limpiar" : "Clear",
    deleteOne: language === "es" ? "Eliminar" : "Delete",
    restoreOne: language === "es" ? "Restaurar" : "Restore",
  };
  const params = searchParams ? await searchParams : undefined;

  const { vendor, items } = await loadVendorInboxThreads(user.id);
  const deletedView = params?.view === "deleted";
  const query = params?.q?.trim().toLowerCase() ?? "";
  const isArchived = (item: (typeof items)[number]) => item.invite.closed_reason === "archived_by_vendor";
  const activeCount = items.filter((item) => !isArchived(item)).length;
  const deletedCount = items.filter(isArchived).length;
  const scopeItems = items.filter((item) => (deletedView ? isArchived(item) : !isArchived(item)));
  const visibleItems = scopeItems.filter((item) => {
    const location =
      [item.rfq?.city, item.rfq?.state, item.rfq?.country].filter(Boolean).join(", ") || labels.untitledLocation;
    const preview = trimPreview(item.rfq?.notes) ?? labels.notesFallback;
    const haystack = [item.rfq?.id, location, preview, item.rfq?.guest_count_range].filter(Boolean).join(" ").toLowerCase();
    return !query || haystack.includes(query);
  });
  const searchSuggestions = buildAutocompleteSuggestions(
    scopeItems.flatMap((item) => {
      const location =
        [item.rfq?.city, item.rfq?.state, item.rfq?.country].filter(Boolean).join(", ") || labels.untitledLocation;
      const preview = trimPreview(item.rfq?.notes) ?? labels.notesFallback;
      return [item.rfq?.id, location, preview, item.rfq?.guest_count_range];
    }),
  );

  if (!vendor) {
    return (
      <main className="pb-4">
        <h1 className="mb-3">{labels.title}</h1>
        <div className="alert alert-info">
          {dictionary.vendorRfqs.noProfile.message}{" "}
          <Link href="/vendor/profile">{dictionary.vendorRfqs.noProfile.linkLabel}</Link>.
        </div>
      </main>
    );
  }

  const makeInboxHref = (overrides: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams();
    const values = {
      q: params?.q?.trim() ? params.q.trim() : null,
      view: deletedView ? "deleted" : null,
      ...overrides,
    };

    for (const [key, value] of Object.entries(values)) {
      if (value) {
        next.set(key, value);
      }
    }

    const queryString = next.toString();
    return queryString ? `/vendor/inbox?${queryString}` : "/vendor/inbox";
  };

  return (
    <main className="wm-inbox-page pb-4">
      <div className="wm-inbox-page__header">
        <div>
          <h1 className="mb-1">{labels.title}</h1>
          <p className="wm-inbox-page__subhead mb-0">{labels.subhead}</p>
        </div>
        <div className="wm-inbox-page__subhead wm-inbox-page__subhead--accent">{vendor.business_name}</div>
      </div>

      <div className="wm-notification-tabs">
        {!deletedView ? (
          <span className="wm-notification-tabs__link wm-notification-tabs__link--active">
            {labels.active}
            {activeCount ? <span className="wm-notification-tabs__count">{activeCount}</span> : null}
          </span>
        ) : (
          <Link className="wm-notification-tabs__link" href={makeInboxHref({ view: null })}>
            {labels.active}
            {activeCount ? <span className="wm-notification-tabs__count">{activeCount}</span> : null}
          </Link>
        )}
        {deletedView ? (
          <span className="wm-notification-tabs__link wm-notification-tabs__link--active">
            {labels.deleted}
            {deletedCount ? <span className="wm-notification-tabs__count">{deletedCount}</span> : null}
          </span>
        ) : (
          <Link className="wm-notification-tabs__link" href={makeInboxHref({ view: "deleted" })}>
            {labels.deleted}
            {deletedCount ? <span className="wm-notification-tabs__count">{deletedCount}</span> : null}
          </Link>
        )}
      </div>

      <form method="get" className="wm-collection-toolbar">
        {deletedView ? <input type="hidden" name="view" value="deleted" /> : null}
        <div className="wm-collection-toolbar__search">
          <AutocompleteInput
            className="form-control"
            name="q"
            defaultValue={params?.q ?? ""}
            placeholder={labels.searchPlaceholder}
            ariaLabel={labels.searchPlaceholder}
            suggestions={searchSuggestions}
          />
          <button className="btn btn-primary btn-sm" type="submit">
            {labels.searchButton}
          </button>
          {params?.q ? (
            <Link className="btn btn-outline-secondary btn-sm" href={makeInboxHref({ q: null })}>
              {labels.clearSearch}
            </Link>
          ) : null}
        </div>
      </form>

      {!visibleItems.length ? (
        <div className="alert alert-secondary">{deletedView ? labels.emptyDeleted : labels.empty}</div>
      ) : (
        <div className="wm-collection-form">
          <div className="wm-inbox-list">
            {visibleItems.map((item) => {
              const location =
                [item.rfq?.city, item.rfq?.state, item.rfq?.country].filter(Boolean).join(", ") || labels.untitledLocation;
              const eventDate = item.rfq?.event_date
                ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(item.rfq.event_date))
                : labels.dateTbd;
              const guestCount =
                typeof item.rfq?.guest_count === "number"
                  ? `${item.rfq.guest_count} ${labels.guests}`
                  : item.rfq?.guest_count_range;
              const preview = trimPreview(item.rfq?.notes) ?? labels.notesFallback;

              return (
                <article key={item.threadKey} className="wm-inbox-card wm-inbox-card--compact">
                  <ThreadOpenLink
                    href={`/vendor/inbox/${encodeURIComponent(item.threadKey)}`}
                    threadKey={item.threadKey}
                    unread={false}
                    className="wm-inbox-card__mainlink"
                    markThreadRead={markVendorInboxThreadRead}
                  >
                    <span className="wm-inbox-card__status">{statusLabel(language, item.statusKey)}</span>

                    <div className="wm-inbox-card__content">
                      <div className="wm-inbox-card__titleline">
                        <h2 className="wm-inbox-card__title">{location}</h2>
                      </div>
                      <p className="wm-inbox-card__preview">{preview}</p>
                      <div className="wm-inbox-card__meta">
                        <span>
                          {labels.requestCode} {item.invite.rfq_id.slice(0, 8)}
                        </span>
                        <span>{eventDate}</span>
                        {guestCount ? <span>{guestCount}</span> : null}
                        <span>
                          {item.latestQuote
                            ? formatAmount(item.latestQuote.amount_cents, item.latestQuote.currency, locale)
                            : labels.noProposal}
                        </span>
                      </div>
                    </div>

                    <div className="wm-inbox-card__meta wm-inbox-card__meta--side">
                      <span className="wm-inbox-card__activity">
                        {labels.updated} {formatActivityLabel(item.lastActivityAt, locale, language)}
                      </span>
                      <span className="wm-inbox-card__action">{labels.openThread}</span>
                    </div>
                  </ThreadOpenLink>

                  <div className="wm-inbox-card__actions">
                    <form action={deletedView ? restoreVendorInboxThreads : closeVendorInboxThreads}>
                      <input type="hidden" name="onlyThreadKey" value={item.threadKey} />
                      <button
                        className="wm-inbox-card__dismiss"
                        type="submit"
                        aria-label={deletedView ? labels.restoreOne : labels.deleteOne}
                        title={deletedView ? labels.restoreOne : labels.deleteOne}
                      >
                        {deletedView ? "↺" : "×"}
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
