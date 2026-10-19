import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ACCOUNT_NOTIFICATION_TYPES,
  parseQuoteAnsweredNotificationData,
  parseThreadReplyNotificationData,
  parseVendorNewRequestNotificationData,
  parseVendorQuoteAcceptedNotificationData,
  VENDOR_NOTIFICATION_TYPES,
} from "@/lib/notification-types";
import { type QuoteMessageRow, fetchQuoteMessagesByQuoteIds } from "@/lib/quote-messages";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";

export type InboxInviteRow = {
  rfq_id: string;
  vendor_id: string;
  status: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string | null;
  viewed_at?: string | null;
  last_activity_at?: string | null;
  client_last_read_at?: string | null;
  vendor_last_read_at?: string | null;
  closed_at?: string | null;
  closed_reason?: string | null;
  reveal_email?: boolean | null;
  reveal_phone?: boolean | null;
};

export type InboxRfqRow = {
  id: string;
  owner_id: string;
  event_date: string | null;
  flexible_date: boolean | null;
  guest_count: number | null;
  guest_count_range: string | null;
  budget_min: number | null;
  budget_max: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  language: string | null;
  theme: string | null;
  notes: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  accepted_quote_id: string | null;
  created_at: string;
  updated_at: string | null;
};

export type InboxQuoteRow = {
  id: string;
  rfq_id: string;
  vendor_id: string;
  version: number;
  amount_cents: number | null;
  currency: string | null;
  message: string | null;
  created_at: string;
  updated_at: string | null;
};

export type InboxVendorRow = {
  id: string;
  slug: string | null;
  business_name: string;
};

export type InboxProfileRow = {
  id: string;
  language: string | null;
  full_name?: string | null;
};

export type ClientInboxStatus =
  | "waiting_on_vendor"
  | "proposal_received"
  | "accepted"
  | "expired"
  | "closed";

export type VendorInboxStatus =
  | "new"
  | "awaiting_response"
  | "proposal_sent"
  | "accepted"
  | "declined"
  | "expired";

export type InboxThreadListItem = {
  threadKey: string;
  invite: InboxInviteRow;
  rfq: InboxRfqRow | null;
  vendor: InboxVendorRow | null;
  latestQuote: InboxQuoteRow | null;
  quoteCount: number;
  lastActivityAt: string;
  isUnread: boolean;
};

export type ClientInboxThreadListItem = InboxThreadListItem & {
  statusKey: ClientInboxStatus;
};

export type VendorInboxThreadListItem = InboxThreadListItem & {
  statusKey: VendorInboxStatus;
};

export type InboxThreadDetail = {
  threadKey: string;
  invite: InboxInviteRow;
  rfq: InboxRfqRow;
  vendor: InboxVendorRow | null;
  quotes: InboxQuoteRow[];
  latestQuote: InboxQuoteRow | null;
  messages: QuoteMessageRow[];
};

type ThreadNotificationRow = {
  id: string;
  type: string;
  data: unknown;
};

function normalizeInviteStatus(status: string | null | undefined) {
  return status?.toLowerCase().trim() ?? null;
}

function effectiveInviteStatus(
  invite: InboxInviteRow,
  rfq: InboxRfqRow | null,
  quotes: InboxQuoteRow[],
): InboxInviteRow {
  if (rfq?.accepted_quote_id) {
    const acceptedHere = quotes.some((quote) => quote.id === rfq.accepted_quote_id);
    return {
      ...invite,
      status: acceptedHere ? "accepted" : "declined",
      closed_reason: acceptedHere ? invite.closed_reason : invite.closed_reason ?? "accepted_other_vendor",
    };
  }

  const normalized = normalizeInviteStatus(invite.status);
  if (normalized === "accepted" || normalized === "declined" || normalized === "expired" || !invite.expires_at) {
    return invite;
  }

  const expiresAt = Date.parse(invite.expires_at);
  return Number.isFinite(expiresAt) && expiresAt <= Date.now()
    ? { ...invite, status: "expired" }
    : invite;
}

export function buildThreadKey(rfqId: string, vendorId: string) {
  return `${rfqId}__${vendorId}`;
}

export function parseThreadKey(threadKey: string) {
  const separator = "__";
  const index = threadKey.indexOf(separator);
  if (index === -1) {
    return null;
  }

  const rfqId = threadKey.slice(0, index).trim();
  const vendorId = threadKey.slice(index + separator.length).trim();

  if (!rfqId || !vendorId) {
    return null;
  }

  return { rfqId, vendorId };
}

function quoteSortDescending(a: InboxQuoteRow, b: InboxQuoteRow) {
  if (a.version !== b.version) {
    return b.version - a.version;
  }
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function isUnreadSince(lastActivityAt: string, lastReadAt: string | null | undefined) {
  if (!lastReadAt) {
    return true;
  }

  return new Date(lastActivityAt).getTime() > new Date(lastReadAt).getTime();
}

function notificationMatchesThread(notification: ThreadNotificationRow, rfqId: string, vendorId: string) {
  const quoteAnswered = parseQuoteAnsweredNotificationData(notification.data);
  if (quoteAnswered) {
    return quoteAnswered.rfqId === rfqId && quoteAnswered.vendorId === vendorId;
  }

  const vendorRequest = parseVendorNewRequestNotificationData(notification.data);
  if (vendorRequest) {
    return vendorRequest.rfqId === rfqId && vendorRequest.vendorId === vendorId;
  }

  const acceptedQuote = parseVendorQuoteAcceptedNotificationData(notification.data);
  if (acceptedQuote) {
    return acceptedQuote.rfqId === rfqId && acceptedQuote.vendorId === vendorId;
  }

  const threadReply = parseThreadReplyNotificationData(notification.data);
  if (threadReply) {
    return threadReply.rfqId === rfqId && threadReply.vendorId === vendorId;
  }

  return false;
}

async function markThreadNotificationsRead(
  client: SupabaseClient,
  userId: string,
  scope: "client" | "vendor",
  rfqId: string,
  vendorId: string
) {
  const notificationTypes =
    scope === "vendor" ? [...VENDOR_NOTIFICATION_TYPES] : [...ACCOUNT_NOTIFICATION_TYPES];

  const { data, error } = await client
    .from("notifications")
    .select("id, type, data")
    .eq("recipient_id", userId)
    .in("type", notificationTypes)
    .is("deleted_at", null)
    .is("read_at", null);

  if (error) {
    return { error };
  }

  const ids = ((data ?? []) as ThreadNotificationRow[])
    .filter((notification) => notificationMatchesThread(notification, rfqId, vendorId))
    .map((notification) => notification.id);

  if (!ids.length) {
    return { error: null };
  }

  return await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .in("id", ids)
    .is("deleted_at", null)
    .is("read_at", null)
    .then((result) => ({ error: result.error }));
}

function resolveClientStatus(invite: InboxInviteRow, rfq: InboxRfqRow | null, quotes: InboxQuoteRow[]): ClientInboxStatus {
  const normalized = normalizeInviteStatus(invite.status);
  const accepted = Boolean(rfq?.accepted_quote_id && quotes.some((quote) => quote.id === rfq.accepted_quote_id));

  if (accepted || normalized === "accepted") {
    return "accepted";
  }
  if (normalized === "expired") {
    return "expired";
  }
  if (normalized === "declined") {
    return "closed";
  }
  if (quotes.length > 0) {
    return "proposal_received";
  }
  return "waiting_on_vendor";
}

function resolveVendorStatus(invite: InboxInviteRow, rfq: InboxRfqRow | null, quotes: InboxQuoteRow[]): VendorInboxStatus {
  const normalized = normalizeInviteStatus(invite.status);
  const accepted = Boolean(rfq?.accepted_quote_id && quotes.some((quote) => quote.id === rfq.accepted_quote_id));

  if (accepted || normalized === "accepted") {
    return "accepted";
  }
  if (normalized === "declined") {
    return "declined";
  }
  if (normalized === "expired") {
    return "expired";
  }
  if (quotes.length > 0) {
    return "proposal_sent";
  }
  if (normalized === "viewed") {
    return "awaiting_response";
  }
  return "new";
}

async function loadClientOwnedRfqs(client: SupabaseClient, userId: string, rfqId: string) {
  const selectColumns = {
    owner_id:
      "id, owner_id, event_date, flexible_date, guest_count, guest_count_range, budget_min, budget_max, city, state, country, language, theme, notes, contact_email, contact_phone, accepted_quote_id, created_at, updated_at",
    owner_uuid:
      "id, owner_id:owner_uuid, event_date, flexible_date, guest_count, guest_count_range, budget_min, budget_max, city, state, country, language, theme, notes, contact_email, contact_phone, accepted_quote_id, created_at, updated_at",
  } as const satisfies Record<OwnerColumn, string>;

  const selectRfqs = (supabase: SupabaseClient, ownerColumn: OwnerColumn) =>
    supabase
      .from("rfqs_visible")
      .select(selectColumns[ownerColumn])
      .eq(ownerColumn, userId)
      .eq("id",rfqId)
      .order("created_at", { ascending: false });

  let ownerColumn: OwnerColumn = "owner_id";
  let { data: rfqs, error } = await selectRfqs(client, ownerColumn);

  if (isMissingOwnerColumnError(error, ownerColumn)) {
    ownerColumn = "owner_uuid";
    const retry = await selectRfqs(client, ownerColumn);
    rfqs = retry.data;
    error = retry.error;
  }

  return { data: (rfqs ?? []) as InboxRfqRow[], error };
}

async function loadVendors(client: SupabaseClient, vendorIds: string[]) {
  if (!vendorIds.length) {
    return { data: [] as InboxVendorRow[], error: null };
  }

  const { data, error } = await client
    .from("thread_vendors")
    .select("id, slug, business_name")
    .in("id", vendorIds);

  return { data: (data ?? []) as InboxVendorRow[], error };
}

type InboxPageOptions = { page?: number; query?: string; archived?: boolean };
type InboxSummary = {
  invite: InboxInviteRow; rfq: InboxRfqRow; vendor: InboxVendorRow; latest_quote: InboxQuoteRow | null;
  quote_count: number; last_activity_at: string; unread_at: string | null; accepted_here: boolean;
  total_count: number; active_count: number; archived_count: number;
};
async function loadInboxSummaries(viewer: "client" | "vendor", options: InboxPageOptions, rfqId?: string | null) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("list_inbox_threads", {
    p_viewer: viewer, p_page: options.page ?? 1, p_search: options.query ?? "",
    p_archived: options.archived ?? false, p_rfq: rfqId ?? null,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as InboxSummary[];
  const items = rows.map((row) => {
    let invite = row.invite;
    if (row.rfq.accepted_quote_id) {
      invite = { ...invite, status: row.accepted_here ? "accepted" : "declined" };
    } else {
      invite = effectiveInviteStatus(invite, row.rfq, row.latest_quote ? [row.latest_quote] : []);
    }
    const readAt = viewer === "client" ? invite.client_last_read_at : invite.vendor_last_read_at ?? invite.viewed_at;
    const quotes = row.latest_quote ? [row.latest_quote] : [];
    return {
      threadKey: buildThreadKey(invite.rfq_id, invite.vendor_id), invite, rfq: row.rfq, vendor: row.vendor,
      latestQuote: row.latest_quote, quoteCount: row.quote_count, lastActivityAt: row.last_activity_at,
      isUnread: row.unread_at ? isUnreadSince(row.unread_at, readAt) : false,
      statusKey: viewer === "client" ? resolveClientStatus(invite,row.rfq,quotes) : resolveVendorStatus(invite,row.rfq,quotes),
    };
  });
  return { items, total: Number(rows[0]?.total_count ?? 0), activeCount: Number(rows[0]?.active_count ?? 0), archivedCount: Number(rows[0]?.archived_count ?? 0) };
}
export async function loadClientInboxThreads(_userId: string, filterRfqId?: string | null, options: InboxPageOptions = {}) {
  const result = await loadInboxSummaries("client", options, filterRfqId);
  return { ...result, items: result.items as ClientInboxThreadListItem[] };
}
export async function loadVendorInboxThreads(userId: string, options: InboxPageOptions = {}) {
  const supabase = await createSupabaseServerClient();
  const { data: vendor, error } = await supabase.from("vendors").select("id,slug,business_name").eq("owner_id",userId).maybeSingle<InboxVendorRow>();
  if (error) throw new Error(error.message);
  const result = await loadInboxSummaries("vendor", options);
  return { ...result, vendor, items: result.items as VendorInboxThreadListItem[] };
}

async function loadThreadInvite(client: SupabaseClient, rfqId: string, vendorId: string) {
  return client
    .from("rfq_invites")
    .select("rfq_id, vendor_id, status, expires_at, created_at, updated_at, viewed_at, last_activity_at, client_last_read_at, vendor_last_read_at, closed_at, closed_reason, reveal_email, reveal_phone")
    .eq("rfq_id", rfqId)
    .eq("vendor_id", vendorId)
    .maybeSingle<InboxInviteRow>();
}

async function loadThreadQuotes(client: SupabaseClient, rfqId: string, vendorId: string) {
  const { data, error } = await client
    .from("quotes")
    .select("id, rfq_id, vendor_id, version, amount_cents, currency, message, created_at, updated_at")
    .eq("rfq_id", rfqId)
    .eq("vendor_id", vendorId)
    .order("version", { ascending: false })
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as InboxQuoteRow[], error };
}

export async function loadClientThreadDetail(userId: string, threadKey: string): Promise<InboxThreadDetail | null> {
  const parsed = parseThreadKey(threadKey);
  if (!parsed) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { rfqId, vendorId } = parsed;

  const { data: rfqs, error } = await loadClientOwnedRfqs(supabase, userId, rfqId);

  if (error) {
    throw new Error(error.message);
  }

  const rfq = rfqs.find((item) => item.id === rfqId) ?? null;
  if (!rfq) {
    return null;
  }

  const inviteResult = await loadThreadInvite(supabase, rfqId, vendorId);

  if (inviteResult.error) {
    throw new Error(inviteResult.error.message);
  }
  if (!inviteResult.data) {
    return null;
  }

  const quotesResult = await loadThreadQuotes(supabase, rfqId, vendorId);

  if (quotesResult.error) {
    throw new Error(quotesResult.error.message);
  }

  const vendorResult = await loadVendors(supabase, [vendorId]);

  if (vendorResult.error) {
    throw new Error(vendorResult.error.message);
  }

  const messagesByQuoteId = await fetchQuoteMessagesByQuoteIds(quotesResult.data.map((quote) => quote.id));
  const messages = Array.from(messagesByQuoteId.values())
    .flat()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return {
    threadKey,
    invite: effectiveInviteStatus(inviteResult.data, rfq, quotesResult.data),
    rfq,
    vendor: vendorResult.data[0] ?? null,
    quotes: [...quotesResult.data].sort(quoteSortDescending),
    latestQuote: [...quotesResult.data].sort(quoteSortDescending)[0] ?? null,
    messages,
  };
}

export async function loadVendorThreadDetail(userId: string, threadKey: string): Promise<InboxThreadDetail | null> {
  const parsed = parseThreadKey(threadKey);
  if (!parsed) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { rfqId, vendorId } = parsed;

  const vendorSelect = async (client: SupabaseClient) =>
    client.from("vendors").select("id, slug, business_name").eq("id", vendorId).eq("owner_id", userId).maybeSingle<InboxVendorRow>();

  const { data: vendor, error: vendorError } = await vendorSelect(supabase);

  if (vendorError) {
    throw new Error(vendorError.message);
  }
  if (!vendor) {
    return null;
  }

  const inviteResult = await loadThreadInvite(supabase, rfqId, vendorId);

  if (inviteResult.error) {
    throw new Error(inviteResult.error.message);
  }
  if (!inviteResult.data) {
    return null;
  }

  const { data: rfq, error: rfqError } = await supabase
    .from("rfqs_visible")
    .select("id, owner_id, event_date, flexible_date, guest_count, guest_count_range, budget_min, budget_max, city, state, country, language, theme, notes, contact_email, contact_phone, accepted_quote_id, created_at, updated_at")
    .eq("id", rfqId)
    .maybeSingle<InboxRfqRow>();

  if (rfqError) {
    throw new Error(rfqError.message);
  }
  if (!rfq) {
    return null;
  }

  const quotesResult = await loadThreadQuotes(supabase, rfqId, vendorId);

  if (quotesResult.error) {
    throw new Error(quotesResult.error.message);
  }

  const messagesByQuoteId = await fetchQuoteMessagesByQuoteIds(quotesResult.data.map((quote) => quote.id));
  const messages = Array.from(messagesByQuoteId.values())
    .flat()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return {
    threadKey,
    invite: effectiveInviteStatus(inviteResult.data, rfq, quotesResult.data),
    rfq,
    vendor,
    quotes: [...quotesResult.data].sort(quoteSortDescending),
    latestQuote: [...quotesResult.data].sort(quoteSortDescending)[0] ?? null,
    messages,
  };
}

export async function markVendorThreadViewed(userId: string, threadKey: string) {
  const parsed = parseThreadKey(threadKey);
  if (!parsed) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  const { rfqId, vendorId } = parsed;

  const vendorSelect = async (client: SupabaseClient) =>
    client.from("vendors").select("id").eq("id", vendorId).eq("owner_id", userId).maybeSingle<{ id: string }>();

  const { data: vendor, error } = await vendorSelect(supabase);

  if (error || !vendor) {
    return;
  }

  const inviteResult = await loadThreadInvite(supabase, rfqId, vendorId);

  if (inviteResult.error || !inviteResult.data) {
    return;
  }

  const viewedAt = new Date().toISOString();
  const nextStatus = normalizeInviteStatus(inviteResult.data.status) === "invited" ? "viewed" : inviteResult.data.status;
  const updateError = await supabase
    .from("rfq_invites")
    .update({
      status: nextStatus,
      viewed_at: inviteResult.data.viewed_at ?? viewedAt,
      vendor_last_read_at: viewedAt,
    })
    .eq("rfq_id", rfqId)
    .eq("vendor_id", vendorId)
    .then((result) => result.error);

  if (updateError && /last_activity_at|viewed_at|vendor_last_read_at/i.test(updateError.message ?? "")) {
    await supabase
      .from("rfq_invites")
      .update({ status: nextStatus })
      .eq("rfq_id", rfqId)
      .eq("vendor_id", vendorId);
  }

  await markThreadNotificationsRead(supabase, userId, "vendor", rfqId, vendorId);

}

export async function markClientThreadRead(userId: string, threadKey: string) {
  const parsed = parseThreadKey(threadKey);
  if (!parsed) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  const { rfqId, vendorId } = parsed;

  const { data: rfq, error: rfqError } = await loadClientOwnedRfqs(supabase, userId, rfqId);
  if (rfqError || !rfq.some((item) => item.id === rfqId)) {
    return;
  }

  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from("rfq_invites")
    .update({ client_last_read_at: readAt })
    .eq("rfq_id", rfqId)
    .eq("vendor_id", vendorId);

  if (error && process.env.NODE_ENV !== 'production') console.warn('Thread read marker could not be updated.');

  await markThreadNotificationsRead(supabase, userId, "client", rfqId, vendorId);

}
