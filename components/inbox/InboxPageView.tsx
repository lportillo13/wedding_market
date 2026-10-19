import Link from "next/link";
import AutocompleteInput from "@/components/search/AutocompleteInput";
import ThreadOpenLink from "./ThreadOpenLink";
import { dictionaries, type SupportedLanguage } from "@/lib/i18n";
import {
  getInboxHref,
  type InboxConversation,
  type InboxFilters,
  type InboxScope,
} from "@/lib/inbox-presentation";

type InboxPageViewProps = {
  scope: InboxScope;
  language: SupportedLanguage;
  items: InboxConversation[];
  total: number;
  activeCount: number;
  deletedCount: number;
  page: number;
  filters: InboxFilters;
  suggestions: string[];
  vendorName?: string;
  markThreadRead: (threadKey: string) => Promise<void>;
  deleteThreads: (data: FormData) => Promise<void>;
  restoreThreads: (data: FormData) => Promise<void>;
};

export function InboxIcon({
  name,
}: {
  name: "search" | "message" | "delete" | "restore";
}) {
  const paths = {
    search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
    message:
      "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z",
    delete: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
    restore: "M3 10V4m0 6h6M3 10a9 9 0 1 1 0 5",
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export default function InboxPageView({
  scope,
  language,
  items,
  total,
  activeCount,
  deletedCount,
  page,
  filters,
  suggestions,
  vendorName,
  markThreadRead,
  deleteThreads,
  restoreThreads,
}: InboxPageViewProps) {
  const labels = dictionaries[language].inbox;
  const deleted = filters.view === "deleted";
  const query = filters.q?.trim() || "";
  const href = (
    overrides: Partial<Record<keyof InboxFilters, string | null>>,
  ) => getInboxHref(scope, filters, overrides);
  const emptyTitle = query
    ? labels.noResultsTitle
    : deleted
      ? labels.emptyDeletedTitle
      : scope === "vendor"
        ? labels.vendorEmptyTitle
        : labels.emptyTitle;
  const emptyBody = query
    ? labels.noResultsBody
    : deleted
      ? labels.emptyDeletedBody
      : scope === "vendor"
        ? labels.vendorEmptyBody
        : labels.emptyBody;
  const pageCount = Math.max(page, Math.ceil(total / 50));

  return (
    <main
      className={`wm-conversations${scope === "client" ? " container" : ""}`}
    >
      <header className="wm-conversations__heading">
        <div>
          <h1>{labels.title}</h1>
          <p>{scope === "client" ? labels.clientIntro : labels.vendorIntro}</p>
        </div>
        {vendorName && (
          <span className="wm-conversations__business">{vendorName}</span>
        )}
      </header>
      <nav className="wm-conversations__folders" aria-label={labels.views}>
        <Link
          href={href({ view: null })}
          aria-current={!deleted ? "page" : undefined}
        >
          {labels.active}
          <span>{activeCount}</span>
        </Link>
        <Link
          href={href({ view: "deleted" })}
          aria-current={deleted ? "page" : undefined}
        >
          {labels.deleted}
          <span>{deletedCount}</span>
        </Link>
      </nav>
      <form
        method="get"
        className="wm-conversation-search"
        role="search"
        aria-label={labels.search}
      >
        {scope === "client" && filters.rfq && (
          <input type="hidden" name="rfq" value={filters.rfq} />
        )}
        {deleted && <input type="hidden" name="view" value="deleted" />}
        <div className="wm-conversation-search__field">
          <InboxIcon name="search" />
          <AutocompleteInput
            name="q"
            className="form-control"
            defaultValue={query}
            placeholder={
              scope === "client" ? labels.searchClient : labels.searchVendor
            }
            ariaLabel={
              scope === "client" ? labels.searchClient : labels.searchVendor
            }
            suggestions={suggestions}
          />
        </div>
        <button type="submit">{labels.search}</button>
      </form>
      <div className="wm-conversations__summary">
        <p>
          {total}{" "}
          {total === 1 ? labels.oneConversation : labels.manyConversations}
          {query ? (
            <>
              {" "}
              · {labels.results} <strong>“{query}”</strong>
            </>
          ) : null}
        </p>
        {query && <Link href={href({ q: null })}>{labels.clear}</Link>}
        {scope === "client" && filters.rfq && (
          <span className="wm-conversations__filter">
            {labels.request} #{filters.rfq.slice(0, 8)}
            <Link href={href({ rfq: null })}>{labels.allRequests}</Link>
          </span>
        )}
      </div>
      {items.length > 0 ? (
        <div className="wm-conversation-list">
          {items.map((item) => {
            const threadHref = `${scope === "client" ? "/account" : "/vendor"}/inbox/${encodeURIComponent(item.threadKey)}`;
            const details = [
              [labels.eventDate, item.eventDate],
              scope === "client"
                ? [labels.location, item.location]
                : [labels.guests, item.guests || "—"],
              [labels.proposal, item.proposal],
            ];
            return (
              <article
                className="wm-conversation-card"
                aria-labelledby={`conversation-${item.threadKey}`}
                key={item.threadKey}
              >
                <header className="wm-conversation-card__header">
                  <span
                    className="wm-conversation-card__avatar"
                    aria-hidden="true"
                  >
                    {item.initials}
                  </span>
                  <div className="wm-conversation-card__identity">
                    <h2 id={`conversation-${item.threadKey}`}>
                      <ThreadOpenLink
                        href={threadHref}
                        threadKey={item.threadKey}
                        markThreadRead={markThreadRead}
                      >
                        {item.title}
                      </ThreadOpenLink>
                    </h2>
                    <span
                      className={`wm-conversation-status wm-conversation-status--${item.tone}`}
                    >
                      {item.status}
                    </span>
                  </div>
                </header>
                <p className="wm-conversation-card__preview">{item.preview}</p>
                <dl className="wm-conversation-card__details">
                  {details.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <footer className="wm-conversation-card__footer">
                  <p className="wm-conversation-card__activity">
                    {labels.updated}{" "}
                    <time dateTime={item.activityDateTime ?? undefined}>
                      {item.activity}
                    </time>
                    <span>
                      {labels.request} #{item.requestReference}
                    </span>
                  </p>
                  <div className="wm-conversation-card__actions">
                    <form action={deleted ? restoreThreads : deleteThreads}>
                      <input
                        type="hidden"
                        name="onlyThreadKey"
                        value={item.threadKey}
                      />
                      <button
                        className="wm-conversation-card__secondary"
                        type="submit"
                        aria-label={`${deleted ? labels.restore : labels.delete}: ${item.title}`}
                      >
                        <InboxIcon name={deleted ? "restore" : "delete"} />
                        {deleted ? labels.restore : labels.delete}
                      </button>
                    </form>
                    <ThreadOpenLink
                      className="wm-conversation-card__open"
                      href={threadHref}
                      threadKey={item.threadKey}
                      markThreadRead={markThreadRead}
                    >
                      {labels.open}
                      <span aria-hidden="true">→</span>
                      <span className="visually-hidden">: {item.title}</span>
                    </ThreadOpenLink>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="wm-conversations__empty">
          <span aria-hidden="true">
            <InboxIcon name="message" />
          </span>
          <h2>{emptyTitle}</h2>
          <p>{emptyBody}</p>
          <Link
            className="wm-conversation-card__open"
            href={
              query
                ? href({ q: null })
                : deleted
                  ? href({ view: null })
                  : scope === "vendor"
                    ? "/vendor/profile"
                    : "/vendors"
            }
          >
            {query
              ? labels.clear
              : deleted
                ? labels.active
                : scope === "vendor"
                  ? labels.reviewProfile
                  : labels.findVendors}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}
      {(page > 1 || page * 50 < total) && (
        <nav className="wm-conversations__pagination" aria-label={labels.pages}>
          {page > 1 ? (
            <Link href={href({ page: String(page - 1) })}>
              {labels.previous}
            </Link>
          ) : (
            <span />
          )}
          <span>
            {page} / {pageCount}
          </span>
          {page * 50 < total ? (
            <Link href={href({ page: String(page + 1) })}>{labels.next}</Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}
