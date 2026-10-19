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

export function parseQuoteAmountCents(value: string) {
  const normalized = value.trim().replace(/^\$\s*/, "");
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.replace(/,/g, "").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  // Match the PostgreSQL integer column and server-side quote validation.
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 2_147_483_647 ? cents : null;
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
  if (closedAt) return true;
  const normalizedStatus = status.trim().toLowerCase();
  if (normalizedStatus === "declined" || normalizedStatus === "expired") return true;

  const acceptedHere = Boolean(acceptedQuoteId && threadQuoteIds.includes(acceptedQuoteId));
  if (acceptedHere) return false;
  if (acceptedQuoteId) return true;

  const expiresAtTimestamp = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  return Number.isFinite(expiresAtTimestamp) && expiresAtTimestamp <= now;
}

/** A deduplication token, never an authentication secret. Works without a native crypto polyfill. */
export function createSubmissionId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const n = Math.floor(Math.random()*16);
    return (c === "x" ? n : (n&3)|8).toString(16);
  });
}
