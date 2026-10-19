import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createInquiry, inquiryInputSchema } from "@/lib/inquiries";
import { sendThreadMessage } from "@/lib/thread-messages";
import { acceptVendorQuote } from "@/lib/quotes/accept";
import { getConversationState } from "@/lib/conversation-state";
import { formatQuoteAmount } from "@/lib/quotes/format";
import { fetchThreadMessages } from "@/lib/quote-messages";
import { parseThreadReplyNotificationData } from "@/lib/notification-types";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const inquiry = {
  request_id: id(20),
  vendor_ids: [id(10), id(11)],
  email: "test@example.invalid",
  guest_count: 60,
  budget: 0,
  message: " Our garden wedding ",
  event_date: "2027-05-12",
};
const message = {
  rfqId: id(20),
  vendorId: id(10),
  quoteId: null,
  clientMessageId: id(30),
  senderRole: "client",
  body: " A question before pricing ",
};
type Call = {
  path: string;
  method: string;
  body: Record<string, unknown> | null;
  url: URL;
};
function fixture(handler: (call: Call) => unknown | Response) {
  const calls: Call[] = [];
  const client = createClient(
    "https://workflow.example.invalid",
    "synthetic-public-key",
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: async (input, init) => {
          const request = new Request(input, init);
          const url = new URL(request.url);
          const call = {
            path: url.pathname,
            method: request.method,
            body: request.body ? await request.json() : null,
            url,
          };
          calls.push(call);
          const result = handler(call);
          return result instanceof Response
            ? result
            : new Response(JSON.stringify(result ?? []), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
        },
      },
    },
  );
  return { client, calls };
}
const deny = () =>
  new Response(
    JSON.stringify({ code: "42501", message: "Synthetic database denial" }),
    { status: 403, headers: { "Content-Type": "application/json" } },
  );

test("single and group inquiries validate all required fields, calendar days, limits and integer bounds", () => {
  assert.equal(inquiryInputSchema.safeParse(inquiry).success, true);
  assert.equal(
    inquiryInputSchema.safeParse({
      ...inquiry,
      vendor_ids: undefined,
      vendor_id: id(10),
    }).success,
    true,
  );
  for (const override of [
    { vendor_ids: [] },
    { vendor_ids: Array.from({ length: 11 }, (_, n) => id(n + 50)) },
    { guest_count: null },
    { guest_count: -2 },
    { guest_count: 1.5 },
    { budget: -1 },
    { budget: 2147483648 },
    { event_date: "2027-02-30" },
    { message: "  " },
  ])
    assert.equal(
      inquiryInputSchema.safeParse({ ...inquiry, ...override }).success,
      false,
      JSON.stringify(override),
    );
});
test("single and group creation use one transaction and a stable retry ID; notification failure cannot lose a saved inquiry", async (t) => {
  t.mock.method(console, "warn", () => {});
  const { client, calls } = fixture((call) =>
    call.path.endsWith("create_inquiry")
      ? { rfq_id: id(20), vendor_count: 2, updated: false, replayed: false }
      : [{ id: id(10), owner_id: id(3) }],
  );
  const result = await createInquiry(client, id(1), inquiry, async () => {
    throw Error("delivery offline");
  });
  assert.equal(result.ok, true);
  const rpc = calls.find((c) => c.path.endsWith("create_inquiry"))!;
  assert.equal(rpc.body?.p_request_id, id(20));
  assert.equal((rpc.body?.p_payload as Record<string, unknown>).budget, 0);
  assert.equal(
    (rpc.body?.p_payload as Record<string, unknown>).notes,
    "Our garden wedding",
  );
  assert.equal(
    calls.some(
      (c) => c.path.endsWith("/rfqs") || c.path.endsWith("/rfq_invites"),
    ),
    false,
  );
});
test("replayed requests skip notifications and transaction errors never report success", async () => {
  const replay = fixture(() => ({
    rfq_id: id(20),
    vendor_count: 2,
    replayed: true,
    updated: false,
  }));
  assert.equal(
    (
      await createInquiry(replay.client, id(1), inquiry, async () => {
        throw Error("must not notify");
      })
    ).ok,
    true,
  );
  assert.equal(replay.calls.length, 1);
  const denied = fixture(deny);
  const result = await createInquiry(denied.client, id(1), inquiry);
  assert.equal(result.ok, false);
  assert.equal(denied.calls.length, 1);
});
test("messages can precede pricing and a saved send survives notification failures", async (t) => {
  t.mock.method(console, "warn", () => {});
  const { client, calls } = fixture((call) =>
    call.path.endsWith("/thread_vendors")
      ? { owner_id: id(3), business_name: "Test vendor" }
      : call.path.endsWith("/rfqs_visible")
        ? { owner_id: id(1) }
        : null,
  );
  assert.equal(
    (
      await sendThreadMessage(client, id(1), message, async () => {
        throw Error("delivery offline");
      })
    ).ok,
    true,
  );
  const saved = calls[0].body!;
  assert.equal(saved.quote_id, null);
  assert.equal(saved.rfq_id, id(20));
  assert.equal(saved.vendor_id, id(10));
  assert.equal(saved.body, "A question before pricing");
  const rejected = fixture(deny);
  assert.equal(
    (await sendThreadMessage(rejected.client, id(1), message)).ok,
    false,
  );
  assert.equal(rejected.calls.length, 2);
});
test("ambiguous send retries are acknowledged only for the same actor, body and thread", async () => {
  for (const other of [false, true]) {
    const { client } = fixture((call) =>
      call.method === "POST"
        ? new Response(JSON.stringify({ code: "23505" }), {
            status: 409,
            headers: { "Content-Type": "application/json" },
          })
        : {
            sender_id: other ? id(2) : id(1),
            sender_role: "client",
            rfq_id: id(20),
            vendor_id: id(10),
            body: message.body.trim(),
          },
    );
    assert.equal((await sendThreadMessage(client, id(1), message)).ok, !other);
  }
});
test("proposal acceptance uses authoritative vendor identity and does not duplicate notifications on retry", async (t) => {
  t.mock.method(console, "warn", () => {});
  for (const alreadyAccepted of [false, true]) {
    let notifications = 0;
    const { client } = fixture((call) =>
      call.path.endsWith("accept_vendor_quote")
        ? { vendorId: id(10), alreadyAccepted }
        : call.path.endsWith("/thread_vendors")
          ? { owner_id: id(3) }
          : { full_name: "Example client" },
    );
    const result = await acceptVendorQuote(
      client,
      id(1),
      { rfqId: id(20), quoteId: id(40), vendorId: id(999) },
      async (_client, input) => {
        notifications++;
        assert.equal(input.vendorId, id(10));
        throw Error("delivery offline");
      },
    );
    assert.equal(result.ok, true);
    assert.equal(notifications, alreadyAccepted ? 0 : 1);
  }
});
test("history reads beyond one database page and retains messages from earlier proposal versions", async () => {
  const { client, calls } = fixture((call) => {
    const offset = Number(call.url.searchParams.get("offset") ?? 0);
    return Array.from({ length: offset === 0 ? 200 : 35 }, (_, n) => ({
      id: id(n + offset + 100),
      quote_id: n % 2 ? id(40) : null,
      sender_id: id(1),
      sender_role: "client",
      body: "Example history",
      created_at: "2026-10-19T12:00:00Z",
    }));
  });
  const history = await fetchThreadMessages(client, id(20), id(10));
  assert.equal(history.length, 235);
  assert.equal(calls.length, 2);
  assert.ok(
    calls.every(
      (call) =>
        call.url.searchParams.get("rfq_id") === `eq.${id(20)}` &&
        call.url.searchParams.get("vendor_id") === `eq.${id(10)}`,
    ),
  );
});
test("thread actions consistently handle expiry, closure, accepted follow-up and precise prices", () => {
  assert.equal(
    getConversationState({ expires_at: "2020-01-01" }, null, []).closed,
    true,
  );
  assert.equal(
    getConversationState({ closed_at: "2026-01-01" }, id(40), [id(40)]).closed,
    true,
  );
  assert.equal(
    getConversationState(
      { expires_at: "2020-01-01", status: "accepted" },
      id(40),
      [id(40)],
    ).closed,
    false,
  );
  assert.equal(getConversationState({}, id(40), [id(41)]).canAccept, false);
  assert.equal(formatQuoteAmount(125050, "USD", "en-US"), "$1,250.50");
  assert.equal(formatQuoteAmount(125000, "USD", "en-US"), "$1,250");
  assert.ok(
    parseThreadReplyNotificationData({
      rfqId: id(20),
      vendorId: id(10),
      quoteId: null,
      senderRole: "client",
    }),
  );
});
