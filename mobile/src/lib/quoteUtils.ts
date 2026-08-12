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
  const normalized = value.trim().replace(/[$,\s]/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
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
) {
  const normalizedStatus = status.trim().toLowerCase();
  if (normalizedStatus === "declined" || normalizedStatus === "expired") return true;

  const acceptedHere = Boolean(acceptedQuoteId && threadQuoteIds.includes(acceptedQuoteId));
  if (acceptedHere) return false;
  if (acceptedQuoteId) return true;

  const expiresAtTimestamp = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  return Number.isFinite(expiresAtTimestamp) && expiresAtTimestamp <= now;
}
