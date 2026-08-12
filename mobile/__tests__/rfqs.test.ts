import {
  buildQuoteVendorSelection,
  isQuoteThreadClosed,
  matchInboxInvitesToRfqs,
  parseQuoteAmountCents,
} from "../src/lib/quoteUtils";

describe("mobile quote helpers", () => {
  test("creates a client thread pair for every vendor invited from a desktop RFQ", () => {
    const rfqs = [{ id: "request-1", notes: "Shared request" }];
    const invites = [
      { rfq_id: "request-1", vendor_id: "vendor-1" },
      { rfq_id: "request-1", vendor_id: "vendor-2" },
      { rfq_id: "missing-request", vendor_id: "vendor-3" },
    ];

    expect(matchInboxInvitesToRfqs(rfqs, invites)).toEqual([
      { rfq: rfqs[0], invite: invites[0] },
      { rfq: rfqs[0], invite: invites[1] },
    ]);
  });

  test("sends a multi-quote as one vendor batch while deduplicating selections", () => {
    expect(buildQuoteVendorSelection(["vendor-1", "vendor-2", "vendor-1"])).toEqual({
      vendorId: undefined,
      vendorIds: ["vendor-1", "vendor-2"],
      vendorCount: 2,
    });
    expect(buildQuoteVendorSelection(["vendor-1"])).toEqual({
      vendorId: "vendor-1",
      vendorIds: undefined,
      vendorCount: 1,
    });
  });

  test("keeps the accepted vendor open and independently closes competing vendor threads", () => {
    const acceptedQuoteId = "quote-vendor-1";
    expect(isQuoteThreadClosed("accepted", "2020-01-01T00:00:00Z", acceptedQuoteId, [acceptedQuoteId])).toBe(false);
    expect(isQuoteThreadClosed("quoted", null, acceptedQuoteId, ["quote-vendor-2"])).toBe(true);
    expect(isQuoteThreadClosed("quoted", "2020-01-01T00:00:00Z", null, [], Date.parse("2020-01-02T00:00:00Z"))).toBe(true);
  });

  test.each([
    ["1,250.50", 125_050],
    ["$99", 9_900],
    ["0", null],
    ["12.345", null],
    ["not a number", null],
  ])("parses quote amount %s", (value, expected) => {
    expect(parseQuoteAmountCents(value)).toBe(expected);
  });
});
