import Link from "next/link";
import { redirect } from "next/navigation";
import {
  permanentlyDeleteAllNotifications,
  permanentlyDeleteSelectedNotifications,
  restoreSelectedNotifications,
} from "@/app/account/notifications/actions";
import AutocompleteInput from "@/components/search/AutocompleteInput";
import { isMissingNotificationTableError, loadNotifications } from "@/lib/notification-center";
import { buildAutocompleteSuggestions } from "@/lib/search/autocomplete";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function VendorDeletedNotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const search = searchParams ? await searchParams : undefined;
  const query = search?.q?.trim().toLowerCase() ?? "";
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/vendor/notifications/deleted")}`);
  }

  const { data: items, error } = await loadNotifications(user.id, "vendor");

  if (isMissingNotificationTableError(error?.message)) {
    return (
      <main className="pb-4">
        <h1 className="mb-3">Deleted notifications</h1>
        <div className="alert alert-warning mb-0">
          The notifications table does not exist in the local database yet. Run
          <code> sql/notifications.sql</code> to enable it.
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
    <main className="wm-notification-page pb-4">
      <div className="wm-notification-page__header">
        <div>
          <h1 className="mb-1">Deleted notifications</h1>
          <p className="wm-notification-page__subhead mb-0">
            Restore them or remove them permanently.
          </p>
        </div>
        {!!deletedItems.length && (
          <form action={permanentlyDeleteAllNotifications}>
            <input type="hidden" name="scope" value="vendor" />
            <button className="btn btn-outline-danger btn-sm" type="submit">
              Delete all permanently
            </button>
          </form>
        )}
      </div>

      <div className="wm-notification-tabs">
        <Link className="wm-notification-tabs__link" href={search?.q ? `/vendor/notifications?q=${encodeURIComponent(search.q)}` : "/vendor/notifications"}>
          Inbox
          {activeCount ? <span className="wm-notification-tabs__count">{activeCount}</span> : null}
        </Link>
        <span className="wm-notification-tabs__link wm-notification-tabs__link--active">
          Deleted
          {deletedItems.length ? <span className="wm-notification-tabs__count">{deletedItems.length}</span> : null}
        </span>
      </div>

      <form method="get" className="wm-collection-toolbar">
        <div className="wm-collection-toolbar__search">
          <AutocompleteInput className="form-control" name="q" defaultValue={search?.q ?? ""} placeholder="Search notifications" ariaLabel="Search notifications" suggestions={searchSuggestions} />
          <button className="btn btn-primary btn-sm" type="submit">Search</button>
          {search?.q ? <Link className="btn btn-outline-secondary btn-sm" href="/vendor/notifications/deleted">Clear</Link> : null}
        </div>
      </form>

      {!deletedItems.length ? (
        <div className="alert alert-light border mb-0">You do not have deleted vendor notifications.</div>
      ) : (
        <form action={restoreSelectedNotifications} className="wm-collection-form">
          <div className="wm-collection-toolbar wm-collection-toolbar--actions">
            <button className="btn btn-outline-secondary btn-sm" type="submit">Restore selected</button>
            <button className="btn btn-outline-danger btn-sm" type="submit" formAction={permanentlyDeleteSelectedNotifications}>Delete selected</button>
          </div>

          <div className="wm-notification-list">
            {deletedItems.map((notification) => (
              <article key={notification.id} className="wm-notification-card wm-notification-card--deleted">
                <div className="wm-notification-card__topline">
                  <label className="wm-collection-check">
                    <input type="checkbox" name="ids" value={notification.id} aria-label="Select notification" />
                  </label>
                  <span className="wm-notification-card__badge wm-notification-card__badge--deleted">Deleted</span>
                  <span className="wm-notification-card__time">{formatNotificationDate(notification.created_at)}</span>
                </div>

                <div className="wm-notification-card__content">
                  <h2 className="wm-notification-card__title">{notification.title}</h2>
                  <p className="wm-notification-card__body">
                    {notification.body || "Deleted vendor notification."}
                  </p>
                </div>

                <div className="wm-notification-card__actions">
                  <button className="wm-notification-card__action" type="submit" name="onlyId" value={notification.id}>
                    Restore
                  </button>
                  <button className="wm-notification-card__muted-action" type="submit" formAction={permanentlyDeleteSelectedNotifications} name="onlyId" value={notification.id}>
                    Delete permanently
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
