import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  ACCOUNT_NOTIFICATION_TYPES,
  parseQuoteAnsweredNotificationData,
  parseThreadReplyNotificationData,
  parseVendorNewRequestNotificationData,
  parseVendorQuoteAcceptedNotificationData,
  VENDOR_NOTIFICATION_TYPES,
} from "@/lib/notifications";
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

function shouldUseAdminFallback(message: string | undefined) {
  return /policy|permission|row-level security|infinite recursion detected/i.test(message ?? "");
}

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

function threadLastActivity(invite: InboxInviteRow, quotes: InboxQuoteRow[]) {
  const timestamps = [
    invite.last_activity_at ?? null,
    invite.created_at,
    invite.updated_at ?? null,
    invite.viewed_at ?? null,
    invite.closed_at ?? null,
    ...quotes.flatMap((quote) => [quote.created_at, quote.updated_at ?? null]),
  ].filter((value): value is string => Boolean(value));

  if (!timestamps.length) {
    return invite.created_at;
  }

  return timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

function threadUnreadActivityAt(
  viewerRole: "client" | "vendor",
  invite: InboxInviteRow,
  quotes: InboxQuoteRow[],
  messages: QuoteMessageRow[]
) {
  const normalized = normalizeInviteStatus(invite.status);
  const timestamps: string[] = [];

  if (viewerRole === "vendor") {
    timestamps.push(invite.created_at);
  }

  if (viewerRole === "client") {
    for (const quote of quotes) {
      timestamps.push(quote.created_at);
      if (quote.updated_at) {
        timestamps.push(quote.updated_at);
      }
    }
  }

  for (const message of messages) {
    if (message.sender_role !== viewerRole) {
      timestamps.push(message.created_at);
    }
  }

  const statusActivityAt = invite.last_activity_at ?? invite.updated_at ?? invite.created_at;
  if (viewerRole === "vendor" && ["accepted", "declined", "expired"].includes(normalized ?? "")) {
    timestamps.push(statusActivityAt);
  }
  if (viewerRole === "client" && ["declined", "expired"].includes(normalized ?? "")) {
    timestamps.push(statusActivityAt);
  }

  if (!timestamps.length) {
    return null;
  }

  return timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
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

async function loadClientOwnedRfqs(client: SupabaseClient, userId: string) {
  const selectColumns = {
    owner_id:
      "id, owner_id, event_date, guest_count, guest_count_range, budget_min, budget_max, city, state, country, language, theme, notes, contact_email, contact_phone, accepted_quote_id, created_at, updated_at",
    owner_uuid:
      "id, owner_id:owner_uuid, event_date, guest_count, guest_count_range, budget_min, budget_max, city, state, country, language, theme, notes, contact_email, contact_phone, accepted_quote_id, created_at, updated_at",
  } as const satisfies Record<OwnerColumn, string>;

  const selectRfqs = (supabase: SupabaseClient, ownerColumn: OwnerColumn) =>
    supabase
      .from("rfqs")
      .select(selectColumns[ownerColumn])
      .eq(ownerColumn, userId)
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

async function loadInvitesForRfqs(client: SupabaseClient, rfqIds: string[]) {
  if (!rfqIds.length) {
    return { data: [] as InboxInviteRow[], error: null };
  }

  const fields =
    "rfq_id, vendor_id, status, expires_at, created_at, updated_at, viewed_at, last_activity_at, client_last_read_at, vendor_last_read_at, closed_at, closed_reason, reveal_email, reveal_phone";

  const { data, error } = await client
    .from("rfq_invites")
    .select(fields)
    .in("rfq_id", rfqIds)
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as InboxInviteRow[], error };
}

async function loadQuotesForThreads(client: SupabaseClient, rfqIds: string[], vendorIds?: string[]) {
  if (!rfqIds.length) {
    return { data: [] as InboxQuoteRow[], error: null };
  }

  let query = client
    .from("quotes")
    .select("id, rfq_id, vendor_id, version, amount_cents, currency, message, created_at, updated_at")
    .in("rfq_id", rfqIds)
    .order("version", { ascending: false })
    .order("created_at", { ascending: false });

  if (vendorIds?.length) {
    query = query.in("vendor_id", vendorIds);
  }

  const { data, error } = await query;
  return { data: (data ?? []) as InboxQuoteRow[], error };
}

async function loadVendors(client: SupabaseClient, vendorIds: string[]) {
  if (!vendorIds.length) {
    return { data: [] as InboxVendorRow[], error: null };
  }

  const { data, error } = await client
    .from("vendors")
    .select("id, slug, business_name")
    .in("id", vendorIds);

  return { data: (data ?? []) as InboxVendorRow[], error };
}

function groupQuotesByThread(quotes: InboxQuoteRow[]) {
  const byThread = new Map<string, InboxQuoteRow[]>();

  for (const quote of quotes) {
    const key = buildThreadKey(quote.rfq_id, quote.vendor_id);
    if (!byThread.has(key)) {
      byThread.set(key, []);
    }
    byThread.get(key)?.push(quote);
  }

  for (const list of byThread.values()) {
    list.sort(quoteSortDescending);
  }

  return byThread;
}

export async function loadClientInboxThreads(userId: string, filterRfqId?: string | null) {
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  let { data: rfqs, error } = await loadClientOwnedRfqs(supabase, userId);

  if (error && supabaseAdmin && shouldUseAdminFallback(error.message)) {
    const retry = await loadClientOwnedRfqs(supabaseAdmin, userId);
    rfqs = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  const filteredRfqs = filterRfqId ? rfqs.filter((rfq) => rfq.id === filterRfqId) : rfqs;
  const rfqIds = filteredRfqs.map((rfq) => rfq.id);

  let invitesResult = await loadInvitesForRfqs(supabase, rfqIds);
  if (invitesResult.error && supabaseAdmin && shouldUseAdminFallback(invitesResult.error.message)) {
    invitesResult = await loadInvitesForRfqs(supabaseAdmin, rfqIds);
  }
  if (invitesResult.error) {
    throw new Error(invitesResult.error.message);
  }

  const vendorIds = Array.from(new Set(invitesResult.data.map((invite) => invite.vendor_id)));

  let vendorsResult = await loadVendors(supabase, vendorIds);
  if (vendorsResult.error && supabaseAdmin && shouldUseAdminFallback(vendorsResult.error.message)) {
    vendorsResult = await loadVendors(supabaseAdmin, vendorIds);
  }
  if (vendorsResult.error) {
    throw new Error(vendorsResult.error.message);
  }

  let quotesResult = await loadQuotesForThreads(supabase, rfqIds, vendorIds);
  if (quotesResult.error && supabaseAdmin && shouldUseAdminFallback(quotesResult.error.message)) {
    quotesResult = await loadQuotesForThreads(supabaseAdmin, rfqIds, vendorIds);
  }
  if (quotesResult.error) {
    throw new Error(quotesResult.error.message);
  }

  const rfqsById = new Map(filteredRfqs.map((rfq) => [rfq.id, rfq] as const));
  const vendorsById = new Map(vendorsResult.data.map((vendor) => [vendor.id, vendor] as const));
  const quotesByThread = groupQuotesByThread(quotesResult.data);
  const messagesByQuoteId = await fetchQuoteMessagesByQuoteIds(quotesResult.data.map((quote) => quote.id));

  return invitesResult.data.map((invite) => {
    const threadKey = buildThreadKey(invite.rfq_id, invite.vendor_id);
    const quotes = quotesByThread.get(threadKey) ?? [];
    const rfq = rfqsById.get(invite.rfq_id) ?? null;
    const effectiveInvite = effectiveInviteStatus(invite, rfq, quotes);
    const lastActivityAt = threadLastActivity(effectiveInvite, quotes);
    const messages = quotes.flatMap((quote) => messagesByQuoteId.get(quote.id) ?? []);
    const unreadActivityAt = threadUnreadActivityAt("client", effectiveInvite, quotes, messages);

    return {
      threadKey,
      invite: effectiveInvite,
      rfq,
      vendor: vendorsById.get(invite.vendor_id) ?? null,
      latestQuote: quotes[0] ?? null,
      quoteCount: quotes.length,
      lastActivityAt,
      isUnread: unreadActivityAt ? isUnreadSince(unreadActivityAt, effectiveInvite.client_last_read_at) : false,
      statusKey: resolveClientStatus(effectiveInvite, rfq, quotes),
    } satisfies ClientInboxThreadListItem;
  });
}

export async function loadVendorInboxThreads(userId: string) {
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  const vendorSelect = async (client: SupabaseClient) =>
    client.from("vendors").select("id, slug, business_name").eq("owner_id", userId).maybeSingle<InboxVendorRow>();

  let { data: vendor, error: vendorError } = await vendorSelect(supabase);
  if (vendorError && supabaseAdmin && shouldUseAdminFallback(vendorError.message)) {
    const retry = await vendorSelect(supabaseAdmin);
    vendor = retry.data;
    vendorError = retry.error;
  }
  if (vendorError) {
    throw new Error(vendorError.message);
  }

  if (!vendor) {
    return { vendor: null, items: [] as VendorInboxThreadListItem[] };
  }

  const initialInvitesResult = await supabase
    .from("rfq_invites")
    .select("rfq_id, vendor_id, status, expires_at, created_at, updated_at, viewed_at, last_activity_at, client_last_read_at, vendor_last_read_at, closed_at, closed_reason, reveal_email, reveal_phone")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  let invites = (initialInvitesResult.data ?? []) as InboxInviteRow[];
  let inviteError = initialInvitesResult.error;

  if (inviteError && supabaseAdmin && shouldUseAdminFallback(inviteError.message)) {
    const retry = await supabaseAdmin
      .from("rfq_invites")
      .select("rfq_id, vendor_id, status, expires_at, created_at, updated_at, viewed_at, last_activity_at, client_last_read_at, vendor_last_read_at, closed_at, closed_reason, reveal_email, reveal_phone")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false });
    invites = (retry.data ?? []) as InboxInviteRow[];
    inviteError = retry.error;
  }

  if (inviteError) {
    throw new Error(inviteError.message);
  }

  const rfqIds = Array.from(new Set(invites.map((invite) => invite.rfq_id)));

  let { data: rfqs, error: rfqError } = await supabase
    .from("rfqs")
    .select("id, owner_id, event_date, guest_count, guest_count_range, budget_min, budget_max, city, state, country, language, theme, notes, contact_email, contact_phone, accepted_quote_id, created_at, updated_at")
    .in("id", rfqIds);

  if (rfqError && supabaseAdmin && shouldUseAdminFallback(rfqError.message)) {
    const retry = await supabaseAdmin
      .from("rfqs")
      .select("id, owner_id, event_date, guest_count, guest_count_range, budget_min, budget_max, city, state, country, language, theme, notes, contact_email, contact_phone, accepted_quote_id, created_at, updated_at")
      .in("id", rfqIds);
    rfqs = retry.data as InboxRfqRow[] | null;
    rfqError = retry.error;
  }

  if (rfqError) {
    throw new Error(rfqError.message);
  }

  let quotesResult = await loadQuotesForThreads(supabase, rfqIds, [vendor.id]);
  if (quotesResult.error && supabaseAdmin && shouldUseAdminFallback(quotesResult.error.message)) {
    quotesResult = await loadQuotesForThreads(supabaseAdmin, rfqIds, [vendor.id]);
  }
  if (quotesResult.error) {
    throw new Error(quotesResult.error.message);
  }

  const rfqsById = new Map(((rfqs ?? []) as InboxRfqRow[]).map((rfq) => [rfq.id, rfq] as const));
  const quotesByThread = groupQuotesByThread(quotesResult.data);
  const messagesByQuoteId = await fetchQuoteMessagesByQuoteIds(quotesResult.data.map((quote) => quote.id));

  const items = invites.map((invite) => {
    const threadKey = buildThreadKey(invite.rfq_id, invite.vendor_id);
    const quotes = quotesByThread.get(threadKey) ?? [];
    const rfq = rfqsById.get(invite.rfq_id) ?? null;
    const effectiveInvite = effectiveInviteStatus(invite, rfq, quotes);
    const lastActivityAt = threadLastActivity(effectiveInvite, quotes);
    const messages = quotes.flatMap((quote) => messagesByQuoteId.get(quote.id) ?? []);
    const unreadActivityAt = threadUnreadActivityAt("vendor", effectiveInvite, quotes, messages);

    return {
      threadKey,
      invite: effectiveInvite,
      rfq,
      vendor,
      latestQuote: quotes[0] ?? null,
      quoteCount: quotes.length,
      lastActivityAt,
      isUnread: unreadActivityAt ? isUnreadSince(unreadActivityAt, effectiveInvite.vendor_last_read_at ?? effectiveInvite.viewed_at) : false,
      statusKey: resolveVendorStatus(effectiveInvite, rfq, quotes),
    } satisfies VendorInboxThreadListItem;
  });

  return { vendor, items };
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
  const supabaseAdmin = createSupabaseAdminClient();
  const { rfqId, vendorId } = parsed;

  let { data: rfqs, error } = await loadClientOwnedRfqs(supabase, userId);
  if (error && supabaseAdmin && shouldUseAdminFallback(error.message)) {
    const retry = await loadClientOwnedRfqs(supabaseAdmin, userId);
    rfqs = retry.data;
    error = retry.error;
  }
  if (error) {
    throw new Error(error.message);
  }

  const rfq = rfqs.find((item) => item.id === rfqId) ?? null;
  if (!rfq) {
    return null;
  }

  let inviteResult = await loadThreadInvite(supabase, rfqId, vendorId);
  if (inviteResult.error && supabaseAdmin && shouldUseAdminFallback(inviteResult.error.message)) {
    inviteResult = await loadThreadInvite(supabaseAdmin, rfqId, vendorId);
  }
  if (inviteResult.error) {
    throw new Error(inviteResult.error.message);
  }
  if (!inviteResult.data) {
    return null;
  }

  let quotesResult = await loadThreadQuotes(supabase, rfqId, vendorId);
  if (quotesResult.error && supabaseAdmin && shouldUseAdminFallback(quotesResult.error.message)) {
    quotesResult = await loadThreadQuotes(supabaseAdmin, rfqId, vendorId);
  }
  if (quotesResult.error) {
    throw new Error(quotesResult.error.message);
  }

  let vendorResult = await loadVendors(supabase, [vendorId]);
  if (vendorResult.error && supabaseAdmin && shouldUseAdminFallback(vendorResult.error.message)) {
    vendorResult = await loadVendors(supabaseAdmin, [vendorId]);
  }
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
  const supabaseAdmin = createSupabaseAdminClient();
  const { rfqId, vendorId } = parsed;

  const vendorSelect = async (client: SupabaseClient) =>
    client.from("vendors").select("id, slug, business_name").eq("id", vendorId).eq("owner_id", userId).maybeSingle<InboxVendorRow>();

  let { data: vendor, error: vendorError } = await vendorSelect(supabase);
  if (vendorError && supabaseAdmin && shouldUseAdminFallback(vendorError.message)) {
    const retry = await vendorSelect(supabaseAdmin);
    vendor = retry.data;
    vendorError = retry.error;
  }
  if (vendorError) {
    throw new Error(vendorError.message);
  }
  if (!vendor) {
    return null;
  }

  let inviteResult = await loadThreadInvite(supabase, rfqId, vendorId);
  if (inviteResult.error && supabaseAdmin && shouldUseAdminFallback(inviteResult.error.message)) {
    inviteResult = await loadThreadInvite(supabaseAdmin, rfqId, vendorId);
  }
  if (inviteResult.error) {
    throw new Error(inviteResult.error.message);
  }
  if (!inviteResult.data) {
    return null;
  }

  let { data: rfq, error: rfqError } = await supabase
    .from("rfqs")
    .select("id, owner_id, event_date, guest_count, guest_count_range, budget_min, budget_max, city, state, country, language, theme, notes, contact_email, contact_phone, accepted_quote_id, created_at, updated_at")
    .eq("id", rfqId)
    .maybeSingle<InboxRfqRow>();

  if (rfqError && supabaseAdmin && shouldUseAdminFallback(rfqError.message)) {
    const retry = await supabaseAdmin
      .from("rfqs")
      .select("id, owner_id, event_date, guest_count, guest_count_range, budget_min, budget_max, city, state, country, language, theme, notes, contact_email, contact_phone, accepted_quote_id, created_at, updated_at")
      .eq("id", rfqId)
      .maybeSingle<InboxRfqRow>();
    rfq = retry.data;
    rfqError = retry.error;
  }
  if (rfqError) {
    throw new Error(rfqError.message);
  }
  if (!rfq) {
    return null;
  }

  let quotesResult = await loadThreadQuotes(supabase, rfqId, vendorId);
  if (quotesResult.error && supabaseAdmin && shouldUseAdminFallback(quotesResult.error.message)) {
    quotesResult = await loadThreadQuotes(supabaseAdmin, rfqId, vendorId);
  }
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
  const supabaseAdmin = createSupabaseAdminClient();
  const { rfqId, vendorId } = parsed;

  const vendorSelect = async (client: SupabaseClient) =>
    client.from("vendors").select("id").eq("id", vendorId).eq("owner_id", userId).maybeSingle<{ id: string }>();

  let { data: vendor, error } = await vendorSelect(supabase);
  if (error && supabaseAdmin && shouldUseAdminFallback(error.message)) {
    const retry = await vendorSelect(supabaseAdmin);
    vendor = retry.data;
    error = retry.error;
  }
  if (error || !vendor) {
    return;
  }

  let inviteResult = await loadThreadInvite(supabase, rfqId, vendorId);
  if (inviteResult.error && supabaseAdmin && shouldUseAdminFallback(inviteResult.error.message)) {
    inviteResult = await loadThreadInvite(supabaseAdmin, rfqId, vendorId);
  }
  if (inviteResult.error || !inviteResult.data) {
    return;
  }

  const viewedAt = new Date().toISOString();
  const nextStatus = normalizeInviteStatus(inviteResult.data.status) === "invited" ? "viewed" : inviteResult.data.status;
  let updateError = await supabase
    .from("rfq_invites")
    .update({
      status: nextStatus,
      viewed_at: inviteResult.data.viewed_at ?? viewedAt,
      vendor_last_read_at: viewedAt,
    })
    .eq("rfq_id", rfqId)
    .eq("vendor_id", vendorId)
    .then((result) => result.error);

  if (updateError && supabaseAdmin && shouldUseAdminFallback(updateError.message)) {
    const retry = await supabaseAdmin
      .from("rfq_invites")
      .update({
        status: nextStatus,
        viewed_at: inviteResult.data.viewed_at ?? viewedAt,
        vendor_last_read_at: viewedAt,
      })
      .eq("rfq_id", rfqId)
      .eq("vendor_id", vendorId);
    updateError = retry.error;
  }

  if (updateError && /last_activity_at|viewed_at|vendor_last_read_at/i.test(updateError.message ?? "")) {
    await supabase
      .from("rfq_invites")
      .update({ status: nextStatus })
      .eq("rfq_id", rfqId)
      .eq("vendor_id", vendorId);
  }

  let notificationResult = await markThreadNotificationsRead(supabase, userId, "vendor", rfqId, vendorId);
  if (notificationResult.error && supabaseAdmin && shouldUseAdminFallback(notificationResult.error.message)) {
    notificationResult = await markThreadNotificationsRead(supabaseAdmin, userId, "vendor", rfqId, vendorId);
  }
}

export async function markClientThreadRead(userId: string, threadKey: string) {
  const parsed = parseThreadKey(threadKey);
  if (!parsed) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();
  const { rfqId, vendorId } = parsed;

  const { data: rfq, error: rfqError } = await loadClientOwnedRfqs(supabase, userId);
  if (rfqError || !rfq.some((item) => item.id === rfqId)) {
    return;
  }

  const readAt = new Date().toISOString();
  let { error } = await supabase
    .from("rfq_invites")
    .update({ client_last_read_at: readAt })
    .eq("rfq_id", rfqId)
    .eq("vendor_id", vendorId);

  if (error && supabaseAdmin && shouldUseAdminFallback(error.message)) {
    const retry = await supabaseAdmin
      .from("rfq_invites")
      .update({ client_last_read_at: readAt })
      .eq("rfq_id", rfqId)
      .eq("vendor_id", vendorId);
    error = retry.error;
  }

  let notificationResult = await markThreadNotificationsRead(supabase, userId, "client", rfqId, vendorId);
  if (notificationResult.error && supabaseAdmin && shouldUseAdminFallback(notificationResult.error.message)) {
    notificationResult = await markThreadNotificationsRead(supabaseAdmin, userId, "client", rfqId, vendorId);
  }
}
