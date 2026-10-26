import { getConversationState } from "../../../shared/conversations/state";
export { parseQuoteAmountCents } from "../../../shared/proposals/money";

export function matchInboxInvitesToRfqs<
  Rfq extends { id: unknown },
  Invite extends { rfq_id: unknown },
>(rfqs: Rfq[], invites: Invite[]) {
  const rfqById = new Map(rfqs.map((rfq) => [String(rfq.id), rfq]));
  return invites.flatMap((invite) => {
    const rfq = rfqById.get(String(invite.rfq_id));
    return rfq ? [{ invite, rfq }] : [];
  });
}

export function buildQuoteVendorSelection(vendorIds: string[], maxVendors = 10) {
  const uniqueVendorIds = Array.from(
    new Set(vendorIds.map((vendorId) => vendorId.trim()).filter(Boolean)),
  );

  if (!uniqueVendorIds.length) {
    throw new Error("Select at least one vendor.");
  }
  if (uniqueVendorIds.length > maxVendors) {
    throw new Error(`You can request quotes from up to ${maxVendors} vendors at a time.`);
  }

  return {
    vendorId: uniqueVendorIds.length === 1 ? uniqueVendorIds[0] : undefined,
    vendorIds: uniqueVendorIds.length > 1 ? uniqueVendorIds : undefined,
    vendorCount: uniqueVendorIds.length,
  };
}

export function isQuoteThreadClosed(
  status: string,
  expiresAt: string | null,
  acceptedQuoteId: string | null,
  threadQuoteIds: string[],
  now = Date.now(),
  closedAt?: string | null,
) {
  return getConversationState(
    { status, expires_at: expiresAt, closed_at: closedAt },
    acceptedQuoteId,
    threadQuoteIds,
    now,
  ).closed;
}

/** A deduplication token, never an authentication secret. Works without a native crypto polyfill. */
export function createSubmissionId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const n = Math.floor(Math.random()*16);
    return (c === "x" ? n : (n&3)|8).toString(16);
  });
}
