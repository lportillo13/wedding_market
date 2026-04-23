export type RfqRow = {
  id: string;
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
  created_at: string;
  contact_email: string | null;
  contact_phone: string | null;
  accepted_quote_id: string | null;
};

export type InviteRow = {
  rfq_id: string;
  vendor_id: string;
  status: string | null;
  expires_at: string | null;
  created_at: string;
  contact_revealed?: boolean | null;
  reveal_email?: boolean | null;
  reveal_phone?: boolean | null;
};

export type QuoteRow = {
  id: string;
  rfq_id: string;
  vendor_id: string;
  amount_cents: number | null;
  currency: string | null;
  message: string | null;
  created_at: string;
};

export type QuoteMessageRow = {
  id: string;
  quote_id: string;
  sender_id: string;
  sender_role: "client" | "vendor";
  body: string;
  created_at: string;
};

export type VendorRfqsItem = {
  invite: InviteRow;
  rfq: RfqRow | null;
  latestQuote: QuoteRow | null;
  quotesForRfq: QuoteRow[];
  latestQuoteMessages: QuoteMessageRow[];
};
