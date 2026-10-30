/** GoTrue can obscure duplicate signup as a user with no identities. */
export function isExistingSignupResponse(data: {session: unknown; user?: {identities?: unknown[] | null} | null}) {
  return !data.session && Array.isArray(data.user?.identities) && data.user.identities.length === 0;
}
