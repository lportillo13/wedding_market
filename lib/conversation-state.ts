type Invite = {
  status?: string | null;
  closed_at?: string | null;
  expires_at?: string | null;
};
export function getConversationState(
  invite: Invite,
  acceptedQuoteId: string | null,
  quoteIds: string[],
  now = Date.now(),
) {
  const accepted = Boolean(
    acceptedQuoteId && quoteIds.includes(acceptedQuoteId),
  );
  const status = invite.status?.trim().toLowerCase();
  const expired =
    !accepted &&
    Boolean(invite.expires_at && Date.parse(invite.expires_at) <= now);
  const closed =
    Boolean(invite.closed_at) ||
    status === "declined" ||
    status === "expired" ||
    expired ||
    Boolean(acceptedQuoteId && !accepted);
  return {
    accepted,
    closed,
    canPropose: !closed && !accepted,
    canAccept: !closed && !accepted && quoteIds.length > 0,
  };
}
