import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { MAX_QUOTE_AMOUNT_CENTS, parseQuoteAmountCents, quoteInputSchema } from "@/lib/quotes/input";
import { submitVendorQuote } from "@/lib/quotes/submit";

const rfqId = "00000000-0000-4000-8000-000000000001";
const vendorId = "00000000-0000-4000-8000-000000000002";
const userId = "00000000-0000-4000-8000-000000000003";
const payload = { rfqId, vendorId, amountCents: 125050, message: " Proposal " };

function fixture(options: { ownsVendor?: boolean; closed?: boolean; expired?: boolean; accepted?: boolean; saveDenied?: boolean; metadataFails?: boolean } = {}) {
  const writes: { table: string; body: Record<string, unknown> }[] = [];
  const client = createClient("https://quotes.example.invalid", "synthetic-public-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input, init) => {
      const request = new Request(input, init);
      const table = new URL(request.url).pathname.split("/").pop()!;
      if (request.method === "POST" || request.method === "PATCH") {
        writes.push({ table, body: JSON.parse(await request.text()) });
      }
      let data: unknown;
      let status = 200;
      if (table === "vendors") data = options.ownsVendor === false ? [] : [{ id: vendorId, business_name: "Synthetic vendor" }];
      else if (table === "rfqs_visible") data = [{ owner_id: "synthetic-recipient", accepted_quote_id: options.accepted ? "accepted" : null }];
      else if (table === "rfq_invites" && request.method === "GET") data = [{ status: "invited", closed_at: options.closed ? "2026-01-01" : null,
        expires_at: options.expired ? "2020-01-01T00:00:00Z" : null }];
      else if (table === "quotes") {
        data = options.saveDenied ? { code: "42501", message: "synthetic state changed" } : { id: "saved-quote", version: 3, created_at: "2026-10-19T12:00:00Z" };
        status = options.saveDenied ? 403 : 201;
      } else if (options.metadataFails) { data = { code: "42501", message: "synthetic metadata failure" }; status = 403; }
      return new Response(data === undefined ? null : JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
    } },
  });
  return { client, writes };
}

test("quote prices reject negative, malformed and database-overflow amounts", () => {
  for (const input of ["-10", "1e3", "1,25", "1 0", "12.345", "0", "21474836.48", "Infinity"]) {
    assert.equal(parseQuoteAmountCents(input), null, input);
  }
  assert.equal(parseQuoteAmountCents(" $1,250.50 "), 125050);
  assert.equal(parseQuoteAmountCents("21474836.47"), MAX_QUOTE_AMOUNT_CENTS);
  assert.equal(quoteInputSchema.safeParse({ ...payload, amountCents: MAX_QUOTE_AMOUNT_CENTS + 1 }).success, false);
});

test("shared quote workflow enforces ownership and closed, expired or accepted requests before writing", async () => {
  for (const options of [{ ownsVendor: false }, { closed: true }, { expired: true }, { accepted: true }]) {
    const { client, writes } = fixture(options);
    const result = await submitVendorQuote(client, userId, payload);
    assert.equal(result.ok, false);
    assert.equal(writes.length, 0);
  }
});

test("database denial during save returns a conflict without notifying", async () => {
  const { client, writes } = fixture({ saveDenied: true });
  const result = await submitVendorQuote(client, userId, payload, async () => { throw new Error("Must not notify"); });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 409);
  assert.equal(writes.length, 1);
});

test("a saved quote remains successful if metadata and notification delivery fail", async (t) => {
  t.mock.method(console, "warn", () => {});
  const { client, writes } = fixture({ metadataFails: true });
  let notified = 0;
  const result = await submitVendorQuote(client, userId, payload, async () => { notified++; throw new Error("synthetic delivery failure"); });
  assert.equal(result.ok, true);
  assert.equal(notified, 1);
  assert.equal(writes.filter((write) => write.table === "quotes").length, 1);
  assert.equal(writes[0].body.message, "Proposal");
  assert.equal("version" in writes[0].body, false);
  if (result.ok) assert.equal(result.quote.version, 3);
});
