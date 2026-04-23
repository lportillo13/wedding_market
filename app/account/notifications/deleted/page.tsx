import { redirect } from "next/navigation";
import {
  permanentlyDeleteAllNotifications,
  permanentlyDeleteSelectedNotifications,
  restoreSelectedNotifications,
} from "../actions";
import Link from "next/link";
import AutocompleteInput from "@/components/search/AutocompleteInput";
import { getLanguageLocale } from "@/lib/i18n";
import { getRequestI18n } from "@/lib/i18n/server";
import { isMissingNotificationTableError, loadNotifications } from "@/lib/notification-center";
import { buildAutocompleteSuggestions } from "@/lib/search/autocomplete";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatNotificationDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AccountDeletedNotificationsPage({
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
    redirect(`/login?next=${encodeURIComponent("/account/notifications/deleted")}`);
  }

  const { data: items, error } = await loadNotifications(user.id, "account");

  if (isMissingNotificationTableError(error?.message)) {
    return (
      <main className="container py-4">
        <h1 className="mb-3">{labels.deletedTitle}</h1>
        <div className="alert alert-warning mb-0">
          {labels.missingTablePrefix} <code>sql/notifications.sql</code> {labels.missingTableSuffix}
        </div>
      </main>
    );
  }

  if (error) {
    throw new Error(error.message);
  }

  const deletedItems = items
    .filter((item) => Boolean(item.deleted_at))
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
  const activeCount = items.filter((item) => !item.deleted_at).length;
  const searchSuggestions = buildAutocompleteSuggestions(
    items.filter((item) => Boolean(item.deleted_at)).flatMap((item) => [item.title, item.body]),
  );

  return (
    <main className="wm-notification-page container py-4">
      <div className="wm-notification-page__header">
        <div>
          <h1 className="mb-1">{labels.deletedTitle}</h1>
          <p className="wm-notification-page__subhead mb-0">{labels.deletedDescription}</p>
        </div>
        {!!deletedItems.length && (
          <form action={permanentlyDeleteAllNotifications}>
            <input type="hidden" name="scope" value="account" />
            <button className="btn btn-outline-danger btn-sm" type="submit">
              {labels.deleteDeletedForever}
            </button>
          </form>
        )}
      </div>

      <div className="wm-notification-tabs">
        <Link className="wm-notification-tabs__link" href={search?.q ? `/account/notifications?q=${encodeURIComponent(search.q)}` : "/account/notifications"}>
          Inbox
          {activeCount ? <span className="wm-notification-tabs__count">{activeCount}</span> : null}
        </Link>
        <span className="wm-notification-tabs__link wm-notification-tabs__link--active">
          {labels.deletedTitle}
          {deletedItems.length ? <span className="wm-notification-tabs__count">{deletedItems.length}</span> : null}
        </span>
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
            <Link className="btn btn-outline-secondary btn-sm" href="/account/notifications/deleted">
              {language === "es" ? "Limpiar" : "Clear"}
            </Link>
          ) : null}
        </div>
      </form>

      {!deletedItems.length ? (
        <div className="alert alert-light border mb-0">{labels.deletedEmpty}</div>
      ) : (
        <form action={restoreSelectedNotifications} className="wm-collection-form">
          <div className="wm-collection-toolbar wm-collection-toolbar--actions">
            <button className="btn btn-outline-secondary btn-sm" type="submit">
              {language === "es" ? "Restaurar seleccionadas" : "Restore selected"}
            </button>
            <button className="btn btn-outline-danger btn-sm" type="submit" formAction={permanentlyDeleteSelectedNotifications}>
              {language === "es" ? "Borrar seleccionadas" : "Delete selected"}
            </button>
          </div>

            <div className="wm-notification-list">
              {deletedItems.map((notification) => (
                <article key={notification.id} className="wm-notification-card wm-notification-card--deleted">
                  <div className="wm-notification-card__topline">
                    <label className="wm-collection-check">
                      <input
                        type="checkbox"
                        name="ids"
                        value={notification.id}
                        aria-label={language === "es" ? "Seleccionar notificación" : "Select notification"}
                      />
                    </label>
                    <span className="wm-notification-card__badge wm-notification-card__badge--deleted">
                      {labels.types.deleted}
                    </span>
                    <span className="wm-notification-card__time">
                      {formatNotificationDate(notification.created_at, locale)}
                    </span>
                  </div>

                  <div className="wm-notification-card__content">
                    <h2 className="wm-notification-card__title">{notification.title}</h2>
                    <p className="wm-notification-card__body">{notification.body || labels.messages.deleted}</p>
                  </div>

                  <div className="wm-notification-card__actions">
                    <button className="wm-notification-card__action" type="submit" name="onlyId" value={notification.id}>
                      {labels.actions.restore}
                    </button>
                    <button
                      className="wm-notification-card__muted-action"
                      type="submit"
                      formAction={permanentlyDeleteSelectedNotifications}
                      name="onlyId"
                      value={notification.id}
                    >
                      {labels.actions.deleteForever}
                    </button>
                  </div>
                </article>
              ))}
            </div>
        </form>
      )}
    </main>
  );
}
