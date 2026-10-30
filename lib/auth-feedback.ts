/** Public, localized feedback categories; never expose raw provider diagnostics. */
export function authFeedbackKey(error: unknown) {
  const value = error && typeof error === 'object'
    ? error as { code?: string; status?: number; name?: string }
    : {};
  if (value.status === 429 || value.code === 'over_request_rate_limit' || value.code === 'over_email_send_rate_limit') return 'rateLimited';
  if (value.code === 'invalid_credentials') return 'invalidCredentials';
  if (value.code === 'email_not_confirmed') return 'emailUnconfirmed';
  if (value.code === 'same_password') return 'samePassword';
  if (value.code === 'weak_password') return 'weakPassword';
  if (value.code === 'otp_expired' || value.code === 'session_not_found' || value.code === 'refresh_token_not_found') return 'recoveryExpired';
  if (value.name === 'AuthRetryableFetchError' || value.name === 'TypeError') return 'connectionError';
  return 'unavailable';
}
