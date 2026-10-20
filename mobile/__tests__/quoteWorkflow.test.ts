import {
  createQuoteRequests,
  loadMobileInbox,
  sendQuoteThreadReply,
  type MobileInboxThread,
  type QuoteRequestInput,
} from "../src/lib/rfqs";
import { requestJson } from "../src/lib/http";
import { createSubmissionId, isQuoteThreadClosed } from "../src/lib/quoteUtils";
import { supabase } from "../src/lib/supabase";

jest.mock("../src/lib/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
    auth: {
      getSession: jest.fn(async () => ({
        data: { session: { access_token: "synthetic-session-token" } },
      })),
    },
  },
}));
jest.mock("../src/lib/config", () => ({
  mobileConfig: { webApiUrl: "https://workflow.example.invalid" },
}));
jest.mock("../src/lib/http", () => ({ requestJson: jest.fn() }));
const transport = jest.mocked(requestJson);
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const input: QuoteRequestInput = {
  vendorId: id(10),
  firstName: "Example",
  lastName: "Client",
  email: "example@example.invalid",
  phone: "",
  eventDate: "2027-05-12",
  flexible: true,
  guestCount: "60",
  budget: "0",
  city: "Heredia",
  language: "es",
  theme: "garden",
  message: "Our garden wedding",
};
const thread: MobileInboxThread = {
  id: "example",
  rfqId: id(20),
  vendorId: id(10),
  title: "Example vendor",
  subtitle: "",
  meta: "",
  status: "invited",
  expiresAt: null,
  acceptedQuoteId: null,
  contactEmail: null,
  contactPhone: null,
  request: {
    eventDate: null,
    flexibleDate: false,
    guestCount: 60,
    guestCountRange: null,
    budgetMin: null,
    budgetMax: null,
    city: null,
    state: null,
    country: "Costa Rica",
    language: "es",
    theme: null,
    notes: null,
  },
  quotes: [],
  latestQuote: null,
  messages: [],
};
beforeEach(() => {
  transport.mockReset();
  transport.mockResolvedValue({ ok: true, rfq_id: id(20), vendor_count: 2 });
});
test("a group submission retains one brief, deduplicated vendors, zero budget and its retry token", async () => {
  await createQuoteRequests(input, [id(10), id(11), id(10)], id(30));
  const options = transport.mock.calls[0][1]!;
  const body = JSON.parse(String(options.body));
  expect(body.vendor_ids).toEqual([id(10), id(11)]);
  expect(body.request_id).toBe(id(30));
  expect(body.budget).toBe(0);
  expect(body.flexible).toBe(true);
});
test("a mobile conversation can send a message before pricing and retain the same retry ID", async () => {
  await sendQuoteThreadReply(
    thread,
    "  A question before pricing  ",
    "client",
    id(31),
  );
  const body = JSON.parse(String(transport.mock.calls[0][1]!.body));
  expect(body).toMatchObject({
    rfqId: id(20),
    vendorId: id(10),
    quoteId: null,
    clientMessageId: id(31),
    senderRole: "client",
    body: "A question before pricing",
  });
});
test("malformed guest counts and budgets are rejected without changing their numeric meaning", async () => {
  for (const changed of [
    { guestCount: "-20" },
    { guestCount: "12.5" },
    { budget: "-30" },
    { budget: "12.5" },
    { budget: "2147483648" },
  ])
    await expect(
      createQuoteRequests({ ...input, ...changed }),
    ).rejects.toThrow();
  expect(transport).not.toHaveBeenCalled();
});
test("archived accepted threads stay read only and deduplication IDs have UUID shape", () => {
  expect(
    isQuoteThreadClosed(
      "accepted",
      null,
      id(40),
      [id(40)],
      Date.now(),
      "2026-10-19",
    ),
  ).toBe(true);
  expect(createSubmissionId()).toMatch(
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
  );
});

test("native inbox reads bookings from each invitation instead of the shared inquiry shortcut", async () => {
  const rpc = supabase!.rpc as unknown as jest.Mock;
  rpc.mockResolvedValue({ error: null, data: [
    { invite: { rfq_id: id(20), vendor_id: id(10), status: "accepted", accepted_quote_id: id(40) },
      rfq: { accepted_quote_id: id(40) }, vendor: { business_name: "Example photographer" }, latest_quote: null, accepted_here: true, total_count: 2 },
    { invite: { rfq_id: id(20), vendor_id: id(11), status: "responded", accepted_quote_id: null },
      rfq: { accepted_quote_id: id(40) }, vendor: { business_name: "Example venue" }, latest_quote: null, accepted_here: false, total_count: 2 },
  ] });
  const { threads } = await loadMobileInbox("client", "en");
  expect(threads[0].acceptedQuoteId).toBe(id(40));
  expect(threads[1].acceptedQuoteId).toBeNull();
  expect(threads[1].status).toBe("responded");
  expect(isQuoteThreadClosed(threads[1].status, threads[1].expiresAt, threads[1].acceptedQuoteId, [])).toBe(false);
});
