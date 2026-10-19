// Control characters must be rejected in deletion targets and decoded object keys.
/* eslint-disable no-control-regex */
export function ownedR2ObjectKey(value: string | null | undefined, prefix: string, publicBase: string | null): string | null {
  if (typeof value !== 'string' || value.length > 2048 || /[\\\u0000-\u0020\u007f]/.test(value) || !/^(?:clients|vendors)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(?:avatar\/)?$/i.test(prefix)) return null;
  let key = value;
  try {
    if (/^https?:\/\//i.test(value)) {
      if (!publicBase) return null;
      const rawPath = value.slice(value.indexOf('://') + 3).replace(/^[^/]*/, '').split(/[?#]/)[0];
      if (decodeURIComponent(rawPath).split('/').some(part => part === '.' || part === '..')) return null;
      const base = new URL(publicBase);
      const url = new URL(value);
      if (base.protocol !== 'https:' || url.protocol !== 'https:' || url.username || url.password || url.origin !== base.origin || url.search || url.hash) return null;
      const basePath = base.pathname.replace(/\/+$/, '') + '/';
      if (!url.pathname.startsWith(basePath)) return null;
      key = decodeURIComponent(url.pathname.slice(basePath.length));
    }
    if (!key.startsWith(prefix) || key.length <= prefix.length || /[\\%?#:\u0000-\u0020\u007f]/.test(key) || key.split('/').some(part => !part || part === '.' || part === '..')) return null;
    return key;
  } catch {
    return null;
  }
}
