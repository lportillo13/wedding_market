import Link from "next/link";
import AutocompleteInput from "@/components/search/AutocompleteInput";
import ThreadOpenLink from "@/components/inbox/ThreadOpenLink";
import { buildAutocompleteSuggestions } from "@/lib/search/autocomplete";
import { closeAccountInboxThreads, markAccountInboxThreadRead, restoreAccountInboxThreads } from "./actions";
import { getLanguageLocale } from "@/lib/i18n";
import { getRequestI18n } from "@/lib/i18n/server";
import { loadClientInboxThreads } from "@/lib/inbox";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      waiting_on_vendor: "Waiting on vendor",
      proposal_received: "Proposal received",
      accepted: "Accepted",
      expired: "Expired",
      closed: "Closed",
    },
    es: {
      waiting_on_vendor: "Esperando al proveedor",
      proposal_received: "Propuesta recibida",
      accepted: "Aceptada",
      expired: "Expirada",
      closed: "Cerrada",
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

function matchesSearch(
  item: Awaited<ReturnType<typeof loadClientInboxThreads>>[number],
  query: string,
  location: string,
  preview: string
) {
  if (!query) {
    return true;
  }

  const haystack = [
    item.vendor?.business_name,
    item.vendor?.slug,
    item.invite.rfq_id,
    location,
    preview,
    item.rfq?.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export default async function AccountInboxPage({
  searchParams,
}: {
  searchParams?: Promise<{ rfq?: string; q?: string; view?: string }>;
}) {
  const { dictionary, language } = await getRequestI18n();
  const locale = getLanguageLocale(language);
  const labels = {
    title: language === "es" ? "Bandeja de entrada" : "Inbox",
    subhead:
      language === "es"
        ? "Conversaciones con proveedores, organizadas para revisar y limpiar rapido."
        : "Vendor conversations, organized for quick review and cleanup.",
    empty: language === "es" ? "Todavia no tienes conversaciones con proveedores." : "You do not have any vendor conversations yet.",
    emptyDeleted: language === "es" ? "No tienes conversaciones eliminadas." : "You do not have deleted conversations.",
    loginRequired: language === "es" ? "Inicia sesion para ver tu bandeja." : "Log in to view your inbox.",
    loginAction: language === "es" ? "Iniciar sesion" : "Log in",
    filterPrefix: language === "es" ? "Mostrando la solicitud" : "Showing request",
    clearFilter: language === "es" ? "Ver todas" : "View all",
    requestFallback: language === "es" ? "Solicitud" : "Request",
    openThread: language === "es" ? "Abrir hilo" : "Open thread",
    proposalFallback: language === "es" ? "Sin propuesta" : "No proposal",
    dateTbd: dictionary.account.rfqsPage.dateTbd,
    locationTbd: dictionary.account.rfqsPage.formatting.locationTbd,
    updated: language === "es" ? "Actualizado" : "Updated",
    notesFallback: language === "es" ? "Sin mensaje de propuesta." : "No proposal note yet.",
    active: language === "es" ? "Conversaciones" : "Conversations",
    deleted: dictionary.account.notificationsPage.deletedTitle,
    searchPlaceholder: language === "es" ? "Buscar proveedor, solicitud o mensaje" : "Search vendor, request, or message",
    searchButton: language === "es" ? "Buscar" : "Search",
    clearSearch: language === "es" ? "Limpiar" : "Clear",
    deleteOne: language === "es" ? "Eliminar" : "Delete",
    restoreOne: language === "es" ? "Restaurar" : "Restore",
  };

  const params = searchParams ? await searchParams : undefined;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="container py-4">
        <h1 className="mb-3">{labels.title}</h1>
        <div className="alert alert-warning">{labels.loginRequired}</div>
        <Link className="btn btn-primary" href={`/login?next=${encodeURIComponent("/account/inbox")}`}>
          {labels.loginAction}
        </Link>
      </main>
    );
  }

  const items = await loadClientInboxThreads(user.id, params?.rfq ?? null);
  const deletedView = params?.view === "deleted";
  const query = params?.q?.trim().toLowerCase() ?? "";
  const isArchived = (item: (typeof items)[number]) => item.invite.closed_reason === "archived_by_client";
  const activeCount = items.filter((item) => !isArchived(item)).length;
  const deletedCount = items.filter(isArchived).length;
  const scopeItems = items.filter((item) => (deletedView ? isArchived(item) : !isArchived(item)));
  const visibleItems = scopeItems.filter((item) => {
    const location =
      [item.rfq?.city, item.rfq?.state, item.rfq?.country].filter(Boolean).join(", ") || labels.locationTbd;
    const preview = trimPreview(item.latestQuote?.message) ?? labels.notesFallback;
    return matchesSearch(item, query, location, preview);
  });
  const searchSuggestions = buildAutocompleteSuggestions(
    scopeItems.flatMap((item) => {
      const location =
        [item.rfq?.city, item.rfq?.state, item.rfq?.country].filter(Boolean).join(", ") || labels.locationTbd;
      const preview = trimPreview(item.latestQuote?.message) ?? labels.notesFallback;
      return [item.vendor?.business_name, item.vendor?.slug, item.invite.rfq_id, location, preview];
    }),
  );

  const makeInboxHref = (overrides: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams();
    const values = {
      rfq: params?.rfq ?? null,
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
    return queryString ? `/account/inbox?${queryString}` : "/account/inbox";
  };

  return (
    <main className="wm-inbox-page container py-4">
      <div className="wm-inbox-page__header">
        <div>
          <h1 className="mb-1">{labels.title}</h1>
          <p className="wm-inbox-page__subhead mb-0">{labels.subhead}</p>
        </div>
        {params?.rfq ? (
          <Link className="btn btn-outline-secondary btn-sm" href={makeInboxHref({ rfq: null })}>
            {labels.clearFilter}
          </Link>
        ) : null}
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
        {params?.rfq ? <input type="hidden" name="rfq" value={params.rfq} /> : null}
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

      {params?.rfq ? (
        <div className="alert alert-secondary py-2">
          {labels.filterPrefix} <code>{params.rfq.slice(0, 8)}</code>
        </div>
      ) : null}

      {!visibleItems.length ? (
        <div className="alert alert-secondary">{deletedView ? labels.emptyDeleted : labels.empty}</div>
      ) : (
        <div className="wm-collection-form">
          <div className="wm-inbox-list">
            {visibleItems.map((item) => {
              const location =
                [item.rfq?.city, item.rfq?.state, item.rfq?.country].filter(Boolean).join(", ") || labels.locationTbd;
              const eventDate = item.rfq?.event_date
                ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(item.rfq.event_date))
                : labels.dateTbd;
              const preview = trimPreview(item.latestQuote?.message) ?? labels.notesFallback;

              return (
                <article key={item.threadKey} className="wm-inbox-card wm-inbox-card--compact">
                  <ThreadOpenLink
                    href={`/account/inbox/${encodeURIComponent(item.threadKey)}`}
                    threadKey={item.threadKey}
                    unread={false}
                    className="wm-inbox-card__mainlink"
                    markThreadRead={markAccountInboxThreadRead}
                  >
                    <span className="wm-inbox-card__status">{statusLabel(language, item.statusKey)}</span>

                    <div className="wm-inbox-card__content">
                      <div className="wm-inbox-card__titleline">
                        <h2 className="wm-inbox-card__title">
                          {item.vendor?.business_name ?? dictionary.account.quotesPage.vendorFallback}
                        </h2>
                      </div>
                      <p className="wm-inbox-card__preview">{preview}</p>
                      <div className="wm-inbox-card__meta">
                        <span>
                          {labels.requestFallback} {item.invite.rfq_id.slice(0, 8)}
                        </span>
                        <span>{location}</span>
                        <span>{eventDate}</span>
                        <span>
                          {item.latestQuote
                            ? formatAmount(item.latestQuote.amount_cents, item.latestQuote.currency, locale)
                            : labels.proposalFallback}
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
                    <form action={deletedView ? restoreAccountInboxThreads : closeAccountInboxThreads}>
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
