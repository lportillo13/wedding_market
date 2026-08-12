import Link from "next/link";
import {
  deleteAllNotifications,
  deleteSelectedNotifications,
} from "./actions";
import AutocompleteInput from "@/components/search/AutocompleteInput";
import NotificationInboxPageShell from "./NotificationInboxPageShell";
import { fillTemplate, getLanguageLocale } from "@/lib/i18n";
import { getRequestI18n } from "@/lib/i18n/server";
import {
  isMissingNotificationTableError,
  loadNotifications,
} from "@/lib/notification-center";
import NotificationOpenLink from "@/components/NotificationOpenLink";
import { parseQuoteAnsweredNotificationData, parseThreadReplyNotificationData } from "@/lib/notification-types";
import { buildAutocompleteSuggestions } from "@/lib/search/autocomplete";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function formatAmount(amountCents: number | null, locale: string) {
  if (typeof amountCents !== "number") {
    return null;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function formatNotificationDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function trimLine(text: string | null | undefined, maxLength = 110) {
  if (!text) return null;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export default async function AccountNotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { dictionary, language } = await getRequestI18n();
  const labels = dictionary.account.notificationsPage;
  const locale = getLanguageLocale(language);
  const search = searchParams ? await searchParams : undefined;
  const query = search?.q?.trim().toLowerCase() ?? "";
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/account/notifications")}`);
  }

  const { data: items, error } = await loadNotifications(user.id, "account");

  if (isMissingNotificationTableError(error?.message)) {
    return (
      <main className="container py-4">
        <h1 className="mb-3">{labels.title}</h1>
        <div className="alert alert-warning mb-0">
          {labels.missingTablePrefix} <code>sql/notifications.sql</code> {labels.missingTableSuffix}
        </div>
      </main>
    );
  }

  if (error) throw new Error(error.message);

  const activeItems = items
    .filter((item) => !item.deleted_at)
    .filter((notification) => {
      if (!query) {
        return true;
      }

      const haystack = [notification.title, notification.body, JSON.stringify(notification.data)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  const unreadCount = activeItems.filter((item) => !item.read_at).length;
  const deletedCount = items.filter((item) => Boolean(item.deleted_at)).length;
  const searchSuggestions = buildAutocompleteSuggestions(
    items.filter((item) => !item.deleted_at).flatMap((item) => [item.title, item.body]),
  );

  return (
    <NotificationInboxPageShell scope="account" unreadCount={unreadCount}>
      <main className="wm-notification-page container py-4">
        <div className="wm-notification-page__header">
          <div>
            <h1 className="mb-1">{labels.title}</h1>
            <p className="wm-notification-page__subhead mb-0">
              {language === "es"
                ? "Alertas rapidas que te llevan directo a la conversacion."
                : "Quick alerts that take you straight to the conversation."}
            </p>
          </div>
          {!!activeItems.length && (
            <form action={deleteAllNotifications}>
              <input type="hidden" name="scope" value="account" />
              <button className="btn btn-outline-danger btn-sm" type="submit">
                {labels.moveAllToDeleted}
              </button>
            </form>
          )}
        </div>

        <div className="wm-notification-tabs">
          <span className="wm-notification-tabs__link wm-notification-tabs__link--active">
            Inbox
            {activeItems.length ? <span className="wm-notification-tabs__count">{activeItems.length}</span> : null}
          </span>
          <Link className="wm-notification-tabs__link" href={search?.q ? `/account/notifications/deleted?q=${encodeURIComponent(search.q)}` : "/account/notifications/deleted"}>
            {labels.deletedTitle}
            {deletedCount ? <span className="wm-notification-tabs__count">{deletedCount}</span> : null}
          </Link>
        </div>

        <form method="get" className="wm-collection-toolbar">
          <div className="wm-collection-toolbar__search">
            <AutocompleteInput
              className="form-control"
              name="q"
              defaultValue={search?.q ?? ""}
              placeholder={language === "es" ? "Buscar notificaciones" : "Search notifications"}
              ariaLabel={language === "es" ? "Buscar notificaciones" : "Search notifications"}
              suggestions={searchSuggestions}
            />
            <button className="btn btn-primary btn-sm" type="submit">
              {language === "es" ? "Buscar" : "Search"}
            </button>
            {search?.q ? (
              <Link className="btn btn-outline-secondary btn-sm" href="/account/notifications">
                {language === "es" ? "Limpiar" : "Clear"}
              </Link>
            ) : null}
          </div>
        </form>

        {!activeItems.length ? (
          <div className="alert alert-secondary mb-0">{labels.empty}</div>
        ) : (
          <form action={deleteSelectedNotifications} className="wm-collection-form">
            <div className="wm-collection-toolbar wm-collection-toolbar--actions">
              <button className="btn btn-outline-secondary btn-sm" type="submit">
                {language === "es" ? "Eliminar seleccionadas" : "Delete selected"}
              </button>
            </div>

            <div className="wm-notification-list">
              {activeItems.map((notification) => {
                const data = parseQuoteAnsweredNotificationData(notification.data);
                const replyData = parseThreadReplyNotificationData(notification.data);
                const amountLabel = formatAmount(data?.amountCents ?? null, locale);
                const amountSuffix = amountLabel
                  ? fillTemplate(labels.messages.amountSuffix, { amount: amountLabel })
                  : "";
                const vendorLabel = data?.vendorName?.trim() || labels.vendorFallback;
                const isThreadReply = notification.type === "thread_reply" && Boolean(replyData);
                const isQuoteUpdate = notification.type === "quote_answered" && data?.isUpdate;
                const variantLabel = isThreadReply
                  ? language === "es"
                    ? "Nueva respuesta"
                    : "New reply"
                  : isQuoteUpdate
                    ? labels.types.quoteUpdated
                    : labels.types.newQuote;
                const displayTitle = isThreadReply
                  ? notification.title
                  : isQuoteUpdate
                    ? labels.titles.quoteUpdated
                    : labels.titles.newQuote;
                const displayBody = isThreadReply
                  ? trimLine(replyData?.messagePreview || notification.body) || notification.body || ""
                  : fillTemplate(
                      isQuoteUpdate ? labels.messages.quoteUpdated : labels.messages.newQuote,
                      { vendor: vendorLabel, amountSuffix }
                    );
                const summary = isThreadReply && replyData
                  ? fillTemplate(labels.messages.requestSummary, {
                      rfq: replyData.rfqId.slice(0, 8),
                      quote: replyData.quoteId.slice(0, 8),
                    })
                  : data
                    ? fillTemplate(labels.messages.requestSummary, {
                        rfq: data.rfqId.slice(0, 8),
                        quote: data.quoteId.slice(0, 8),
                      })
                    : null;
                const actionHref = isThreadReply && replyData
                  ? `/account/inbox/${encodeURIComponent(`${replyData.rfqId}__${replyData.vendorId}`)}`
                  : data
                    ? `/account/inbox/${encodeURIComponent(`${data.rfqId}__${data.vendorId}`)}`
                    : "/account/inbox";
                const isUnread = !notification.read_at;

                return (
                  <article
                    key={notification.id}
                    className={`wm-notification-card wm-notification-card--compact ${isUnread ? "wm-notification-card--unread" : ""}`}
                  >
                    <label className="wm-collection-check">
                      <input
                        type="checkbox"
                        name="ids"
                        value={notification.id}
                        aria-label={language === "es" ? "Seleccionar notificación" : "Select notification"}
                      />
                    </label>
                    <NotificationOpenLink
                      href={actionHref}
                      notificationId={notification.id}
                      unread={isUnread}
                      className="wm-notification-card__mainlink"
                    >
                      <span className="wm-notification-card__badge">{variantLabel}</span>

                      <div className="wm-notification-card__content">
                        <div className="wm-notification-card__titleline">
                          <h2 className="wm-notification-card__title">{displayTitle}</h2>
                          {isUnread ? <span className="wm-notification-card__new">{language === "es" ? "Nuevo" : "New"}</span> : null}
                        </div>
                        <p className="wm-notification-card__body">{trimLine(displayBody)}</p>
                        {summary ? <div className="wm-notification-card__summary">{summary}</div> : null}
                      </div>

                      <div className="wm-notification-card__meta">
                        <span className="wm-notification-card__time">
                          {formatNotificationDate(notification.created_at, locale)}
                        </span>
                        <span className="wm-notification-card__action">{labels.actions.replyReview}</span>
                      </div>
                    </NotificationOpenLink>

                    <div className="wm-notification-card__actions">
                      <button
                        className="wm-notification-card__dismiss"
                        type="submit"
                        name="onlyId"
                        value={notification.id}
                        aria-label={labels.actions.moveToDeleted}
                        title={labels.actions.moveToDeleted}
                      >
                        ×
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </form>
        )}
      </main>
    </NotificationInboxPageShell>
  );
}
