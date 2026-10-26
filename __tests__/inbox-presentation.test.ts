import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getInboxHref,
  presentInboxConversation,
} from "../lib/inbox-presentation";
import type { ClientInboxThreadListItem } from "../features/conversations/server/inbox";

const conversation: ClientInboxThreadListItem = {
  threadKey: "request-123__vendor-456",
  invite: {
    rfq_id: "request-123",
    vendor_id: "vendor-456",
    status: "expired",
    expires_at: null,
    created_at: "2026-08-18T12:00:00Z",
    updated_at: null,
  },
  vendor: {
    id: "vendor-456",
    slug: "example-photos",
    business_name: "Mariposa Photography",
  },
  rfq: {
    id: "request-123",
    owner_id: "owner-1",
    event_date: "2026-11-22",
    flexible_date: false,
    guest_count: 60,
    guest_count_range: null,
    budget_min: null,
    budget_max: null,
    city: "Heredia",
    state: null,
    country: "Costa Rica",
    language: "es",
    theme: null,
    notes: "  Our\n wedding plans  ",
    contact_email: "private@example.test",
    contact_phone: "private-phone",
    accepted_quote_id: null,
    created_at: "2026-08-18T12:00:00Z",
    updated_at: null,
  },
  latestQuote: null,
  quoteCount: 0,
  lastActivityAt: "2026-08-18T12:00:00Z",
  isUnread: false,
  statusKey: "expired",
};

test("inbox links preserve search, folder and request scope while pagination resets for a new view", () => {
  const filters = {
    rfq: "request-123",
    q: " flowers & music ",
    view: "deleted",
    page: "3",
  };
  const page = new URL(
    getInboxHref("client", filters, { page: "4" }),
    "https://example.test",
  );
  assert.equal(page.pathname, "/account/inbox");
  assert.equal(page.searchParams.get("rfq"), "request-123");
  assert.equal(page.searchParams.get("q"), "flowers & music");
  assert.equal(page.searchParams.get("view"), "deleted");
  assert.equal(page.searchParams.get("page"), "4");
  const active = new URL(
    getInboxHref("client", filters, { view: null }),
    "https://example.test",
  );
  assert.equal(active.searchParams.has("view"), false);
  assert.equal(active.searchParams.has("page"), false);
  const vendor = new URL(
    getInboxHref("vendor", filters),
    "https://example.test",
  );
  assert.equal(vendor.pathname, "/vendor/inbox");
  assert.equal(vendor.searchParams.has("rfq"), false);
});

test("conversation summaries use the inquiry message when no proposal exists without exposing contact fields", () => {
  const result = presentInboxConversation(
    conversation,
    "client",
    "es",
    new Date("2026-10-19T12:00:00Z"),
  );
  assert.equal(result.title, "Mariposa Photography");
  assert.equal(result.initials, "MP");
  assert.equal(result.preview, "Our wedding plans");
  assert.equal(result.status, "Expirada");
  assert.equal(result.tone, "muted");
  assert.equal(result.proposal, "Sin propuesta todavía");
  assert.equal(result.location, "Heredia, Costa Rica");
  assert.match(result.eventDate, /22/);
  assert.ok(!JSON.stringify(result).includes("private@example.test"));
  assert.ok(!JSON.stringify(result).includes("private-phone"));
});

test("zero-value proposals remain real proposals and malformed activity dates do not break the list", () => {
  const item = {
    ...conversation,
    lastActivityAt: "invalid",
    statusKey: "proposal_received" as const,
    latestQuote: {
      id: "q-1",
      rfq_id: "request-123",
      vendor_id: "vendor-456",
      version: 1,
      amount_cents: 0,
      currency: "USD",
      message: "Proposal ready",
      created_at: "2026-08-18T12:00:00Z",
      updated_at: null,
    },
  };
  const result = presentInboxConversation(item, "client", "en");
  assert.equal(result.proposal, "$0");
  assert.equal(result.preview, "Proposal ready");
  assert.equal(result.tone, "proposal");
  assert.equal(result.activityDateTime, null);
  assert.equal(result.activity, "—");
  const unpriced = presentInboxConversation(
    { ...item, latestQuote: { ...item.latestQuote, amount_cents: null } },
    "client",
    "en",
  );
  assert.equal(unpriced.proposal, "Proposal received");
});
