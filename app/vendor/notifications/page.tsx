import Link from "next/link";
import { redirect } from "next/navigation";
import {
  deleteAllNotifications,
  deleteSelectedNotifications,
} from "@/app/account/notifications/actions";
import AutocompleteInput from "@/components/search/AutocompleteInput";
import NotificationInboxPageShell from "@/app/account/notifications/NotificationInboxPageShell";
import NotificationOpenLink from "@/components/NotificationOpenLink";
import {
  isMissingNotificationTableError,
  loadNotifications,
} from "@/lib/notification-center";
import { buildThreadKey } from "@/lib/inbox";
import {
  parseThreadReplyNotificationData,
  parseVendorNewRequestNotificationData,
  parseVendorQuoteAcceptedNotificationData,
} from "@/lib/notification-types";
import { buildAutocompleteSuggestions } from "@/lib/search/autocomplete";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatLocation(city: string | null, state: string | null, country: string | null) {
  return [city, state, country].filter(Boolean).join(", ");
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
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

export default async function VendorNotificationsPage({
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
    redirect(`/login?next=${encodeURIComponent("/vendor/notifications")}`);
  }

  const { data: items, error } = await loadNotifications(user.id, "vendor");

  if (isMissingNotificationTableError(error?.message)) {
    return (
      <main className="pb-4">
        <h1 className="mb-3">Vendor notifications</h1>
        <div className="alert alert-warning mb-0">
          The notifications table does not exist in the local database yet. Run
          <code> sql/notifications.sql</code> to enable it.
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
    <NotificationInboxPageShell scope="vendor" unreadCount={unreadCount}>
      <main className="wm-notification-page pb-4">
        <div className="wm-notification-page__header">
          <div>
            <h1 className="mb-1">Vendor notifications</h1>
            <p className="wm-notification-page__subhead mb-0">
              Quick updates that take you back to the request or conversation.
            </p>
          </div>
          {!!activeItems.length && (
            <form action={deleteAllNotifications}>
              <input type="hidden" name="scope" value="vendor" />
              <button className="btn btn-outline-danger btn-sm" type="submit">
                Move all to deleted
              </button>
            </form>
          )}
        </div>

        <div className="wm-notification-tabs">
          <span className="wm-notification-tabs__link wm-notification-tabs__link--active">
            Inbox
            {activeItems.length ? <span className="wm-notification-tabs__count">{activeItems.length}</span> : null}
          </span>
          <Link className="wm-notification-tabs__link" href={search?.q ? `/vendor/notifications/deleted?q=${encodeURIComponent(search.q)}` : "/vendor/notifications/deleted"}>
            Deleted
            {deletedCount ? <span className="wm-notification-tabs__count">{deletedCount}</span> : null}
          </Link>
        </div>

        <form method="get" className="wm-collection-toolbar">
          <div className="wm-collection-toolbar__search">
            <AutocompleteInput className="form-control" name="q" defaultValue={search?.q ?? ""} placeholder="Search notifications" ariaLabel="Search notifications" suggestions={searchSuggestions} />
            <button className="btn btn-primary btn-sm" type="submit">Search</button>
            {search?.q ? <Link className="btn btn-outline-secondary btn-sm" href="/vendor/notifications">Clear</Link> : null}
          </div>
        </form>

        {!activeItems.length ? (
          <div className="alert alert-secondary mb-0">You do not have any vendor notifications yet.</div>
        ) : (
          <form action={deleteSelectedNotifications} className="wm-collection-form">
            <div className="wm-collection-toolbar wm-collection-toolbar--actions">
              <button className="btn btn-outline-secondary btn-sm" type="submit">Delete selected</button>
            </div>

            <div className="wm-notification-list">
              {activeItems.map((notification) => {
                const requestData = parseVendorNewRequestNotificationData(notification.data);
                const acceptedData = parseVendorQuoteAcceptedNotificationData(notification.data);
                const replyData = parseThreadReplyNotificationData(notification.data);
                const isAccepted = notification.type === "vendor_quote_accepted";
                const isReply = notification.type === "thread_reply" && Boolean(replyData);
                const threadKey = requestData
                  ? buildThreadKey(requestData.rfqId, requestData.vendorId)
                  : acceptedData
                    ? buildThreadKey(acceptedData.rfqId, acceptedData.vendorId)
                    : replyData
                      ? buildThreadKey(replyData.rfqId, replyData.vendorId)
                      : null;
                const actionHref = threadKey ? `/vendor/inbox/${encodeURIComponent(threadKey)}` : "/vendor/inbox";
                const locationLabel = requestData
                  ? formatLocation(requestData.city, requestData.state, requestData.country)
                  : null;
                const summary = requestData
                  ? [
                      locationLabel,
                      requestData.eventDate
                        ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(requestData.eventDate))
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : replyData
                    ? `Request ${replyData.rfqId.slice(0, 8)} · Quote ${replyData.quoteId.slice(0, 8)}`
                    : acceptedData
                      ? `Request ${acceptedData.rfqId.slice(0, 8)} · Quote ${acceptedData.quoteId.slice(0, 8)}`
                      : null;
                const isUnread = !notification.read_at;

                return (
                  <article
                    key={notification.id}
                    className={`wm-notification-card wm-notification-card--compact ${isUnread ? "wm-notification-card--unread" : ""}`}
                  >
                    <label className="wm-collection-check">
                      <input type="checkbox" name="ids" value={notification.id} aria-label="Select notification" />
                    </label>
                    <NotificationOpenLink
                      href={actionHref}
                      notificationId={notification.id}
                      unread={isUnread}
                      className="wm-notification-card__mainlink"
                    >
                      <span className={`wm-notification-card__badge ${isAccepted ? "wm-notification-card__badge--success" : ""}`}>
                        {isReply ? "New reply" : isAccepted ? "Quote accepted" : "New request"}
                      </span>

                      <div className="wm-notification-card__content">
                        <div className="wm-notification-card__titleline">
                          <h2 className="wm-notification-card__title">{notification.title}</h2>
                          {isUnread ? <span className="wm-notification-card__new">New</span> : null}
                        </div>
                        <p className="wm-notification-card__body">
                          {trimLine(isReply ? replyData?.messagePreview || notification.body : notification.body) || "You have a new vendor notification."}
                        </p>
                        {summary ? <div className="wm-notification-card__summary">{summary}</div> : null}
                      </div>

                      <div className="wm-notification-card__meta">
                        <span className="wm-notification-card__time">{formatNotificationDate(notification.created_at)}</span>
                        <span className="wm-notification-card__action">
                          {isReply || isAccepted ? "Open conversation" : "Review request"}
                        </span>
                      </div>
                    </NotificationOpenLink>

                    <div className="wm-notification-card__actions">
                      <button
                        className="wm-notification-card__dismiss"
                        type="submit"
                        name="onlyId"
                        value={notification.id}
                        aria-label="Move notification to deleted"
                        title="Move to deleted"
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
