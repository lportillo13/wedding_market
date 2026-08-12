import { supabase } from "./supabase";
import { mobileConfig } from "./config";
import { requestJson } from "./http";
import { buildQuoteVendorSelection, matchInboxInvitesToRfqs, parseQuoteAmountCents } from "./quoteUtils";

export type QuoteRequestInput = {
  vendorId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventDate: string;
  flexible: boolean;
  guestCount: string;
  budgetMin: string;
  budgetMax: string;
  city: string;
  state: string;
  country: string;
  language: string;
  theme: string;
  message: string;
};

export type MobileInboxMessage = {
  id: string;
  quoteId: string;
  senderRole: "client" | "vendor";
  body: string;
  createdAt: string;
};

export type MobileInboxQuote = {
  id: string;
  rfqId: string;
  vendorId: string;
  version: number;
  amountCents: number | null;
  currency: string;
  message: string | null;
  createdAt: string;
};

export type MobileInboxThread = {
  id: string;
  rfqId: string;
  vendorId: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  expiresAt: string | null;
  acceptedQuoteId: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  quotes: MobileInboxQuote[];
  latestQuote: MobileInboxQuote | null;
  messages: MobileInboxMessage[];
};

type Role = "client" | "vendor" | "admin" | "guest";

function requiredClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check mobile/.env.");
  }
  return supabase;
}

function parseIntOrNull(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number.parseInt(normalized.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function clean(value: string) {
  return value.trim() || null;
}

function isMissingQuoteMessagesTable(message: string | undefined) {
  return /quote_messages/i.test(message ?? "") && /does not exist|could not find/i.test(message ?? "");
}

function formatThreadDate(value: string | null | undefined, language: "en" | "es" = "en") {
  if (!value) return "No date yet";
  return new Date(value).toLocaleDateString(language === "es" ? "es" : "en-US");
}

function timestamp(value: string | null | undefined) {
  const parsed = value ? new Date(value).getTime() : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMobileQuote(row: {
  id: unknown;
  rfq_id: unknown;
  vendor_id: unknown;
  version?: unknown;
  amount_cents?: unknown;
  currency?: unknown;
  message?: unknown;
  created_at: unknown;
}): MobileInboxQuote {
  return {
    id: String(row.id),
    rfqId: String(row.rfq_id),
    vendorId: String(row.vendor_id),
    version: typeof row.version === "number" ? row.version : 1,
    amountCents: typeof row.amount_cents === "number" ? row.amount_cents : null,
    currency: String(row.currency ?? "USD"),
    message: typeof row.message === "string" ? row.message : null,
    createdAt: String(row.created_at),
  };
}

export async function createQuoteRequests(input: QuoteRequestInput, vendorIds: string[] = [input.vendorId]) {
  const client = requiredClient();
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Please log in to send a request.");
  }

  const guestCount = parseIntOrNull(input.guestCount);
  if (!guestCount) {
    throw new Error("Guest count is required.");
  }

  if (!input.message.trim()) {
    throw new Error("Please enter a message for the vendor.");
  }

  const vendorSelection = buildQuoteVendorSelection(vendorIds);

  if (!mobileConfig.webApiUrl) {
    throw new Error("EXPO_PUBLIC_WEB_API_URL is not configured.");
  }

  const payload = await requestJson<{ ok?: boolean; message?: string; rfq_id?: string; updated?: boolean; vendor_count?: number }>(
    `${mobileConfig.webApiUrl}/api/rfqs/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vendor_id: vendorSelection.vendorId,
      vendor_ids: vendorSelection.vendorIds,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      email: input.email.trim(),
      phone: clean(input.phone),
      event_date: input.eventDate.trim() || null,
      flexible: input.flexible,
      guest_count: guestCount,
      guest_count_range: input.guestCount.trim(),
      budget_min: parseIntOrNull(input.budgetMin),
      budget_max: parseIntOrNull(input.budgetMax),
      city: clean(input.city),
      state: clean(input.state),
      country: clean(input.country),
      language: clean(input.language),
      theme: clean(input.theme),
      message: input.message.trim(),
    }),
  });

  if (!payload.ok || !payload.rfq_id) {
    throw new Error(payload.message ?? "Unable to create request.");
  }

  return {
    rfqId: String(payload.rfq_id),
    updated: Boolean(payload.updated),
    vendorCount: payload.vendor_count ?? vendorSelection.vendorCount,
  };
}

export async function createQuoteRequest(input: QuoteRequestInput) {
  return createQuoteRequests(input, [input.vendorId]);
}

async function loadMessages(quoteIds: string[]) {
  const client = requiredClient();
  if (!quoteIds.length) return new Map<string, MobileInboxMessage[]>();

  const { data, error } = await client
    .from("quote_messages")
    .select("id, quote_id, sender_role, body, created_at")
    .in("quote_id", quoteIds)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingQuoteMessagesTable(error.message)) {
      return new Map<string, MobileInboxMessage[]>();
    }
    throw new Error(error.message);
  }

  const byQuote = new Map<string, MobileInboxMessage[]>();
  for (const row of data ?? []) {
    const quoteId = String(row.quote_id);
    const current = byQuote.get(quoteId) ?? [];
    current.push({
      id: String(row.id),
      quoteId,
      senderRole: row.sender_role === "vendor" ? "vendor" : "client",
      body: String(row.body ?? ""),
      createdAt: String(row.created_at),
    });
    byQuote.set(quoteId, current);
  }
  return byQuote;
}

export async function loadMobileInbox(role: Role, language: "en" | "es" = "en"): Promise<MobileInboxThread[]> {
  const client = requiredClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error("Sign in required.");
  }

  if (role === "vendor" || role === "admin") {
    const { data: vendors, error: vendorError } = await client
      .from("vendors")
      .select("id, business_name")
      .eq("owner_id", user.id)
      .limit(1);

    if (vendorError) throw new Error(vendorError.message);
    const vendor = vendors?.[0];
    if (!vendor?.id) return [];

    const { data: invites, error: invitesError } = await client
      .from("rfq_invites")
      .select("rfq_id, vendor_id, status, expires_at, created_at, updated_at, reveal_email, reveal_phone")
      .eq("vendor_id", vendor.id)
      .order("updated_at", { ascending: false })
      .limit(30);

    if (invitesError) throw new Error(invitesError.message);
    const rfqIds = [...new Set((invites ?? []).map((invite) => String(invite.rfq_id)))];
    if (!rfqIds.length) return [];

    const [{ data: rfqs, error: rfqError }, { data: quotes, error: quoteError }] = await Promise.all([
      client
        .from("rfqs")
        .select("id, event_date, guest_count, city, state, country, theme, notes, contact_email, contact_phone, accepted_quote_id, created_at, updated_at")
        .in("id", rfqIds),
      client
        .from("quotes")
        .select("id, rfq_id, vendor_id, version, amount_cents, currency, message, created_at")
        .eq("vendor_id", vendor.id)
        .in("rfq_id", rfqIds)
        .order("created_at", { ascending: false }),
    ]);

    if (rfqError) throw new Error(rfqError.message);
    if (quoteError) throw new Error(quoteError.message);

    const messagesByQuote = await loadMessages((quotes ?? []).map((quote) => String(quote.id)));
    const rfqById = new Map((rfqs ?? []).map((rfq) => [String(rfq.id), rfq]));

    return (invites ?? []).map((invite) => {
      const rfq = rfqById.get(String(invite.rfq_id));
      const threadQuotes = (quotes ?? [])
        .filter((quote) => quote.rfq_id === invite.rfq_id)
        .map(toMobileQuote)
        .sort((a, b) => b.version - a.version || timestamp(b.createdAt) - timestamp(a.createdAt));
      const latest = threadQuotes[0] ?? null;
      const quoteMessages = threadQuotes.flatMap((quote) => messagesByQuote.get(String(quote.id)) ?? []);
      const acceptedQuoteId = typeof rfq?.accepted_quote_id === "string" ? rfq.accepted_quote_id : null;
      const lastActivity = Math.max(
        timestamp(String(invite.updated_at ?? invite.created_at)),
        timestamp(String(rfq?.updated_at ?? rfq?.created_at ?? "")),
        ...threadQuotes.map((quote) => timestamp(quote.createdAt)),
        ...quoteMessages.map((message) => timestamp(message.createdAt))
      );
      return {
        lastActivity,
        thread: {
          id: `${invite.rfq_id}:${invite.vendor_id}`,
          rfqId: String(invite.rfq_id),
          vendorId: String(invite.vendor_id),
          // Keep client identity private until the quote is accepted, matching the web inbox.
          title: `${language === "es" ? "Solicitud de boda" : "Wedding request"} ${String(invite.rfq_id).slice(0, 8)}`,
          subtitle: [rfq?.city, rfq?.state, rfq?.country].filter(Boolean).join(", ") || rfq?.notes || (language === "es" ? "Detalles de la solicitud" : "Request details"),
          meta: rfq?.event_date
            ? formatThreadDate(String(rfq.event_date), language)
            : formatThreadDate(String(invite.created_at), language),
          status: acceptedQuoteId && threadQuotes.some((quote) => quote.id === acceptedQuoteId)
            ? "accepted"
            : String(invite.status ?? "invited"),
          expiresAt: typeof invite.expires_at === "string" ? invite.expires_at : null,
          acceptedQuoteId,
          contactEmail: acceptedQuoteId && threadQuotes.some((quote) => quote.id === acceptedQuoteId)
            && invite.reveal_email !== false ? String(rfq?.contact_email ?? "") || null : null,
          contactPhone: acceptedQuoteId && threadQuotes.some((quote) => quote.id === acceptedQuoteId)
            && invite.reveal_phone !== false ? String(rfq?.contact_phone ?? "") || null : null,
          quotes: threadQuotes,
          latestQuote: latest,
          messages: quoteMessages.sort((a, b) => timestamp(a.createdAt) - timestamp(b.createdAt)),
        } satisfies MobileInboxThread,
      };
    }).sort((a, b) => b.lastActivity - a.lastActivity).map((item) => item.thread);
  }

  const { data: rfqs, error: rfqError } = await client
    .from("rfqs")
    .select("id, event_date, guest_count, city, state, country, theme, notes, accepted_quote_id, created_at, updated_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (rfqError) throw new Error(rfqError.message);
  const rfqRows = rfqs ?? [];
  if (!rfqRows.length) return [];

  const rfqIds = rfqRows.map((rfq) => String(rfq.id));
  const [{ data: invites, error: invitesError }, { data: quotes, error: quoteError }] = await Promise.all([
    client.from("rfq_invites").select("rfq_id, vendor_id, status, expires_at, created_at, updated_at").in("rfq_id", rfqIds),
    client
      .from("quotes")
      .select("id, rfq_id, vendor_id, version, amount_cents, currency, message, created_at")
      .in("rfq_id", rfqIds)
      .order("created_at", { ascending: false }),
  ]);

  if (invitesError) throw new Error(invitesError.message);
  if (quoteError) throw new Error(quoteError.message);

  // A desktop RFQ can invite several vendors, so threads must be built from
  // rfq_invites rather than the legacy rfqs.vendor_id shortcut.
  const vendorIds = [...new Set((invites ?? []).map((invite) => String(invite.vendor_id)).filter(Boolean))];
  const { data: vendors, error: vendorsError } = vendorIds.length
    ? await client.from("vendors").select("id, business_name").in("id", vendorIds)
    : { data: [], error: null };
  if (vendorsError) throw new Error(vendorsError.message);

  const messagesByQuote = await loadMessages((quotes ?? []).map((quote) => String(quote.id)));
  const vendorById = new Map((vendors ?? []).map((vendor) => [String(vendor.id), vendor]));
  return matchInboxInvitesToRfqs(rfqRows, invites ?? []).map(({ invite, rfq }) => {
    const vendor = vendorById.get(String(invite.vendor_id));
    const threadQuotes = (quotes ?? [])
      .filter((quote) => quote.rfq_id === invite.rfq_id && quote.vendor_id === invite.vendor_id)
      .map(toMobileQuote)
      .sort((a, b) => b.version - a.version || timestamp(b.createdAt) - timestamp(a.createdAt));
    const latest = threadQuotes[0] ?? null;
    const quoteMessages = threadQuotes.flatMap((quote) => messagesByQuote.get(String(quote.id)) ?? []);
    const acceptedQuoteId = typeof rfq.accepted_quote_id === "string" ? rfq.accepted_quote_id : null;
    const lastActivity = Math.max(
      timestamp(String(invite.updated_at ?? invite.created_at)),
      timestamp(String(rfq.updated_at ?? rfq.created_at ?? "")),
      ...threadQuotes.map((quote) => timestamp(quote.createdAt)),
      ...quoteMessages.map((message) => timestamp(message.createdAt))
    );
    return {
      lastActivity,
      thread: {
        id: `${invite.rfq_id}:${invite.vendor_id}`,
        rfqId: String(invite.rfq_id),
        vendorId: String(invite.vendor_id),
        title: String(vendor?.business_name ?? (language === "es" ? "Proveedor" : "Vendor")),
        subtitle: [rfq.city, rfq.state, rfq.country].filter(Boolean).join(", ") || rfq.notes || (language === "es" ? "Solicitud de boda" : "Wedding request"),
        meta: rfq.event_date
          ? formatThreadDate(String(rfq.event_date), language)
          : formatThreadDate(String(rfq.created_at ?? invite.created_at), language),
        status: acceptedQuoteId && threadQuotes.some((quote) => quote.id === acceptedQuoteId)
          ? "accepted"
          : String(invite.status ?? "requested"),
        expiresAt: typeof invite.expires_at === "string" ? invite.expires_at : null,
        acceptedQuoteId,
        contactEmail: null,
        contactPhone: null,
        quotes: threadQuotes,
        latestQuote: latest,
        messages: quoteMessages.sort((a, b) => timestamp(a.createdAt) - timestamp(b.createdAt)),
      } satisfies MobileInboxThread,
    };
  }).sort((a, b) => b.lastActivity - a.lastActivity).map((item) => item.thread);
}

async function authenticatedMobileRequest<T>(path: string, body: unknown) {
  const client = requiredClient();
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session?.access_token) throw new Error("Sign in required.");
  if (!mobileConfig.webApiUrl) throw new Error("EXPO_PUBLIC_WEB_API_URL is not configured.");

  return requestJson<T>(`${mobileConfig.webApiUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function sendVendorQuote(thread: MobileInboxThread, amount: string, message: string) {
  const amountCents = parseQuoteAmountCents(amount);
  if (!amountCents) throw new Error("Enter a valid quote amount.");
  if (message.trim().length > 2000) throw new Error("Quote details must be 2,000 characters or fewer.");

  const payload = await authenticatedMobileRequest<{ ok?: boolean; message?: string }>("/api/mobile/quotes", {
    rfqId: thread.rfqId,
    vendorId: thread.vendorId,
    amountCents,
    message: message.trim() || null,
  });
  if (!payload.ok) throw new Error(payload.message ?? "Unable to send quote.");
}

export async function acceptMobileQuote(
  thread: MobileInboxThread,
  options: { revealEmail: boolean; revealPhone: boolean }
) {
  if (!thread.latestQuote) throw new Error("No quote is available to accept.");
  const payload = await authenticatedMobileRequest<{ ok?: boolean; message?: string }>("/api/mobile/quotes/accept", {
    rfqId: thread.rfqId,
    vendorId: thread.vendorId,
    quoteId: thread.latestQuote.id,
    ...options,
  });
  if (!payload.ok) throw new Error(payload.message ?? "Unable to accept quote.");
}

export async function sendQuoteThreadReply(thread: MobileInboxThread, body: string, role: Role) {
  const client = requiredClient();
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Sign in required.");
  }

  if (!thread.latestQuote?.id) {
    throw new Error("The vendor has not sent a quote yet.");
  }

  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Please enter a reply.");
  }
  if (trimmed.length > 2000) {
    throw new Error("Replies must be 2,000 characters or fewer.");
  }

  if (!mobileConfig.webApiUrl) {
    throw new Error("EXPO_PUBLIC_WEB_API_URL is not configured.");
  }

  const senderRole = role === "vendor" || role === "admin" ? "vendor" : "client";
  const payload = await requestJson<{ ok?: boolean; message?: string }>(
    `${mobileConfig.webApiUrl}/api/mobile/quote-replies`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quoteId: thread.latestQuote.id,
      rfqId: thread.rfqId,
      vendorId: thread.vendorId,
      senderRole,
      body: trimmed,
    }),
  });

  if (!payload.ok) {
    throw new Error(payload.message ?? "Unable to send reply.");
  }
}
