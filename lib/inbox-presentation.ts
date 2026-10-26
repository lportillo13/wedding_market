import { formatQuoteAmount } from "../shared/proposals/format";
import { formatCalendarDate } from "../shared/calendar/date";
import {
  dictionaries,
  getLanguageLocale,
  type SupportedLanguage,
} from "./i18n";
import type {
  InboxThreadListItem,
  ClientInboxStatus,
  VendorInboxStatus,
} from "../features/conversations/server/inbox";

export type InboxScope = "client" | "vendor";
export type InboxFilters = {
  rfq?: string;
  q?: string;
  view?: string;
  page?: string;
};
export type InboxConversation = {
  threadKey: string;
  unread: boolean;
  title: string;
  initials: string;
  preview: string;
  status: string;
  tone: "waiting" | "proposal" | "accepted" | "muted";
  eventDate: string;
  location: string;
  proposal: string;
  guests: string | null;
  requestReference: string;
  activity: string;
  activityDateTime: string | null;
};

export function getInboxHref(
  scope: InboxScope,
  filters: InboxFilters,
  overrides: Partial<Record<keyof InboxFilters, string | null>> = {},
) {
  const values = {
    rfq: scope === "client" ? filters.rfq : null,
    q: filters.q?.trim(),
    view: filters.view === "deleted" ? "deleted" : null,
    page: null,
    ...overrides,
  };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value && (scope === "client" || key !== "rfq")) params.set(key, value);
  }
  const base = scope === "client" ? "/account/inbox" : "/vendor/inbox";
  return params.size ? `${base}?${params}` : base;
}

function previewText(...values: (string | null | undefined)[]) {
  return (
    values
      .map((value) => value?.replace(/\s+/g, " ").trim())
      .find(Boolean)
      ?.slice(0, 160) ?? ""
  );
}

export function presentInboxConversation(
  item: InboxThreadListItem & {
    statusKey: ClientInboxStatus | VendorInboxStatus;
  },
  scope: InboxScope,
  language: SupportedLanguage,
  now = new Date(),
): InboxConversation {
  const labels = dictionaries[language].inbox;
  const locale = getLanguageLocale(language);
  const location =
    [item.rfq?.city, item.rfq?.state, item.rfq?.country]
      .filter(Boolean)
      .join(", ") || labels.locationTbd;
  const title =
    scope === "client"
      ? item.vendor?.business_name || labels.vendorFallback
      : location;
  const status = labels.status[item.statusKey];
  const tone =
    item.statusKey === "accepted"
      ? "accepted"
      : ["proposal_received", "proposal_sent"].includes(item.statusKey)
        ? "proposal"
        : ["expired", "closed", "declined"].includes(item.statusKey)
          ? "muted"
          : "waiting";
  let proposal: string = labels.noProposal;
  if (item.latestQuote)
    proposal =
      scope === "client"
        ? labels.status.proposal_received
        : labels.status.proposal_sent;
  if (
    item.latestQuote &&
    typeof item.latestQuote.amount_cents === "number" &&
    Number.isFinite(item.latestQuote.amount_cents)
  ) {
    proposal = formatQuoteAmount(item.latestQuote.amount_cents,item.latestQuote.currency,locale);
  }

  const activityDate = new Date(item.lastActivityAt);
  const validActivity = Number.isFinite(activityDate.getTime());
  const sameDay =
    validActivity && activityDate.toDateString() === now.toDateString();
  const activity = validActivity
    ? sameDay
      ? `${labels.today} · ${activityDate.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}`
      : new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
          ...(activityDate.getFullYear() !== now.getFullYear()
            ? { year: "numeric" }
            : {}),
        }).format(activityDate)
    : "—";
  return {
    threadKey: item.threadKey,
    unread: item.isUnread,
    title,
    initials: title
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => Array.from(word)[0])
      .join("")
      .toUpperCase(),
    preview:
      previewText(
        scope === "client" ? item.latestQuote?.message : null,
        item.rfq?.notes,
      ) || labels.previewFallback,
    status,
    tone,
    eventDate:
      formatCalendarDate(item.rfq?.event_date, locale) ?? labels.dateTbd,
    location,
    proposal,
    guests:
      typeof item.rfq?.guest_count === "number"
        ? String(item.rfq.guest_count)
        : item.rfq?.guest_count_range || null,
    requestReference: item.invite.rfq_id.slice(0, 8),
    activity,
    activityDateTime: validActivity ? activityDate.toISOString() : null,
  };
}
