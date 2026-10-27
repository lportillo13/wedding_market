import { getSiteUrl } from './site-url';

export function safeAuthNextPath(value: string | null, fallback = '/') {
  return value?.startsWith('/') && !value.startsWith('//')
    && !value.includes('\\') && ![...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
    ? value : fallback;
}

/** Next's internal request origin can be localhost behind the production proxy. */
export function authRedirectUrl(path: string) {
  const origin = getSiteUrl();
  const destination = new URL(safeAuthNextPath(path), origin);
  return destination.origin === origin ? destination : new URL('/', origin);
}
