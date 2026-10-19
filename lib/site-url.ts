/** Authentication email redirects must never trust a caller's Host headers. */
export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    const url = new URL(configured);
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.protocol === 'http:')) {
      throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS.');
    }
    return url.origin;
  }
  return process.env.NODE_ENV === 'production' ? 'https://thewedmarket.com' : 'http://localhost:3000';
}
