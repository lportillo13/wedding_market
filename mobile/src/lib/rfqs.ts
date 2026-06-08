import { supabase } from "./supabase";
import { mobileConfig } from "./config";

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

function formatThreadDate(value: string | null | undefined) {
  if (!value) return "No date yet";
  return new Date(value).toLocaleDateString();
}

export async function createQuoteRequest(input: QuoteRequestInput) {
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

  if (!mobileConfig.webApiUrl) {
    throw new Error("EXPO_PUBLIC_WEB_API_URL is not configured.");
  }

  const response = await fetch(`${mobileConfig.webApiUrl}/api/rfqs/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vendor_id: input.vendorId,
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

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.message ?? "Unable to create request.");
  }

  return { rfqId: String(payload.rfq_id), updated: Boolean(payload.updated) };
}

async function createQuoteRequestDirect(input: QuoteRequestInput) {
  const client = requiredClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error("Please log in to send a request.");
  }

  const guestCount = parseIntOrNull(input.guestCount);
  if (!guestCount) {
    throw new Error("Guest count is required.");
  }

  const basePayload = {
    owner_id: user.id,
    event_date: input.eventDate.trim() || null,
    flexible_date: input.flexible,
    guest_count: guestCount,
    guest_count_range: input.guestCount.trim(),
    budget_min: parseIntOrNull(input.budgetMin),
    budget_max: parseIntOrNull(input.budgetMax),
    city: clean(input.city),
    state: clean(input.state),
    country: clean(input.country),
    language: clean(input.language),
    theme: clean(input.theme),
    notes: input.message.trim(),
    contact_email: input.email.trim(),
    contact_phone: clean(input.phone),
    guest_first_name: input.firstName.trim(),
    guest_last_name: input.lastName.trim(),
    guest_lead_email: input.email.trim(),
    guest_phone: clean(input.phone),
    vendor_id: input.vendorId,
  };

  const { data: existing, error: existingError } = await client
    .from("rfqs")
    .select("id")
    .eq("owner_id", user.id)
    .eq("vendor_id", input.vendorId)
    .is("accepted_quote_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    const { count, error: quoteCountError } = await client
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .eq("rfq_id", existing.id)
      .eq("vendor_id", input.vendorId);

    if (quoteCountError) {
      throw new Error(quoteCountError.message);
    }

    if ((count ?? 0) === 0) {
      const { error } = await client
        .from("rfqs")
        .update({ ...basePayload, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .eq("owner_id", user.id);

      if (error) throw new Error(error.message);
      return { rfqId: existing.id, updated: true };
    }
  }

  const { data: rfq, error: rfqError } = await client
    .from("rfqs")
    .insert([basePayload])
    .select("id")
    .single<{ id: string }>();

  if (rfqError || !rfq?.id) {
    throw new Error(rfqError?.message ?? "Unable to create request.");
  }

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { error: inviteError } = await client.from("rfq_invites").insert([
    {
      rfq_id: rfq.id,
      vendor_id: input.vendorId,
      expires_at: expiresAt,
    },
  ]);

  if (inviteError) {
    throw new Error(inviteError.message);
  }

  return { rfqId: rfq.id, updated: false };
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

export async function loadMobileInbox(role: Role): Promise<MobileInboxThread[]> {
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
      .select("rfq_id, vendor_id, status, created_at, updated_at")
      .eq("vendor_id", vendor.id)
      .order("updated_at", { ascending: false })
      .limit(30);

    if (invitesError) throw new Error(invitesError.message);
    const rfqIds = [...new Set((invites ?? []).map((invite) => String(invite.rfq_id)))];
    if (!rfqIds.length) return [];

    const [{ data: rfqs, error: rfqError }, { data: quotes, error: quoteError }] = await Promise.all([
      client
        .from("rfqs")
        .select("id, event_date, guest_count, city, state, country, theme, notes, guest_first_name, guest_last_name, contact_email, created_at")
        .in("id", rfqIds),
      client
        .from("quotes")
        .select("id, rfq_id, vendor_id, amount_cents, currency, message, created_at")
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
      const threadQuotes = (quotes ?? []).filter((quote) => quote.rfq_id === invite.rfq_id);
      const latest = threadQuotes[0] ?? null;
      const quoteMessages = threadQuotes.flatMap((quote) => messagesByQuote.get(String(quote.id)) ?? []);
      const name = [rfq?.guest_first_name, rfq?.guest_last_name].filter(Boolean).join(" ");
      return {
        id: `${invite.rfq_id}:${invite.vendor_id}`,
        rfqId: String(invite.rfq_id),
        vendorId: String(invite.vendor_id),
        title: name || String(rfq?.contact_email ?? "Wedding request"),
        subtitle: [rfq?.city, rfq?.state, rfq?.country].filter(Boolean).join(", ") || rfq?.notes || "Request details",
        meta: rfq?.event_date ? formatThreadDate(String(rfq.event_date)) : formatThreadDate(String(invite.created_at)),
        status: String(invite.status ?? "invited"),
        latestQuote: latest ? {
          id: String(latest.id),
          amountCents: typeof latest.amount_cents === "number" ? latest.amount_cents : null,
          currency: String(latest.currency ?? "USD"),
          message: latest.message ?? null,
          createdAt: String(latest.created_at),
        } : null,
        messages: quoteMessages,
      };
    });
  }

  const { data: rfqs, error: rfqError } = await client
    .from("rfqs")
    .select("id, vendor_id, event_date, guest_count, city, state, country, theme, notes, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (rfqError) throw new Error(rfqError.message);
  const rfqRows = rfqs ?? [];
  if (!rfqRows.length) return [];

  const rfqIds = rfqRows.map((rfq) => String(rfq.id));
  const vendorIds = [...new Set(rfqRows.map((rfq) => String(rfq.vendor_id)).filter(Boolean))];
  const [{ data: vendors }, { data: invites }, { data: quotes, error: quoteError }] = await Promise.all([
    vendorIds.length
      ? client.from("vendors").select("id, business_name").in("id", vendorIds)
      : Promise.resolve({ data: [], error: null }),
    client.from("rfq_invites").select("rfq_id, vendor_id, status, created_at, updated_at").in("rfq_id", rfqIds),
    client
      .from("quotes")
      .select("id, rfq_id, vendor_id, amount_cents, currency, message, created_at")
      .in("rfq_id", rfqIds)
      .order("created_at", { ascending: false }),
  ]);

  if (quoteError) throw new Error(quoteError.message);

  const messagesByQuote = await loadMessages((quotes ?? []).map((quote) => String(quote.id)));
  const vendorById = new Map((vendors ?? []).map((vendor) => [String(vendor.id), vendor]));

  return rfqRows.map((rfq) => {
    const invite = (invites ?? []).find((item) => item.rfq_id === rfq.id && item.vendor_id === rfq.vendor_id);
    const vendor = vendorById.get(String(rfq.vendor_id));
    const threadQuotes = (quotes ?? []).filter((quote) => quote.rfq_id === rfq.id && quote.vendor_id === rfq.vendor_id);
    const latest = threadQuotes[0] ?? null;
    const quoteMessages = threadQuotes.flatMap((quote) => messagesByQuote.get(String(quote.id)) ?? []);
    return {
      id: `${rfq.id}:${rfq.vendor_id}`,
      rfqId: String(rfq.id),
      vendorId: String(rfq.vendor_id),
      title: String(vendor?.business_name ?? "Vendor"),
      subtitle: [rfq.city, rfq.state, rfq.country].filter(Boolean).join(", ") || rfq.notes || "Wedding request",
      meta: rfq.event_date ? formatThreadDate(String(rfq.event_date)) : formatThreadDate(String(rfq.created_at)),
      status: String(invite?.status ?? "requested"),
      latestQuote: latest ? {
        id: String(latest.id),
        amountCents: typeof latest.amount_cents === "number" ? latest.amount_cents : null,
        currency: String(latest.currency ?? "USD"),
        message: latest.message ?? null,
        createdAt: String(latest.created_at),
      } : null,
      messages: quoteMessages,
    };
  });
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

  if (!mobileConfig.webApiUrl) {
    throw new Error("EXPO_PUBLIC_WEB_API_URL is not configured.");
  }

  const senderRole = role === "vendor" || role === "admin" ? "vendor" : "client";
  const response = await fetch(`${mobileConfig.webApiUrl}/api/mobile/quote-replies`, {
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

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.message ?? "Unable to send reply.");
  }
}
