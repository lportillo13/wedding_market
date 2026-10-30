import { getSiteUrl } from './site-url';

export function safeAuthNextPath(value: unknown, fallback = '/') {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    && !value.includes('\\') && ![...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
    ? value : fallback;
}

/** Keep the original page when an OAuth or password recovery link fails. */
export function authCallbackFailurePath(value: string) {
  const next = safeAuthNextPath(value);
  const destination = new URL(next, 'https://auth.invalid');
  if (destination.pathname === '/reset-password') {
    const returnTo = safeAuthNextPath(destination.searchParams.get('next'), '/account/profile');
    return `/forgot-password?${new URLSearchParams({ error: 'recovery', next: returnTo })}`;
  }
  return `/login?${new URLSearchParams({ error: 'auth_callback', next })}`;
}

/** Next's internal request origin can be localhost behind the production proxy. */
export function authRedirectUrl(path: string) {
  const origin = getSiteUrl();
  const destination = new URL(safeAuthNextPath(path), origin);
  return destination.origin === origin ? destination : new URL('/', origin);
}
