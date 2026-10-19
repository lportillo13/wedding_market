/** Browser-safe R2 URL handling. Never import the storage SDK into client code. */
export function publicR2Bases() {
  return [process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL,process.env.NEXT_PUBLIC_R2_LEGACY_PUBLIC_BASE_URL]
    .filter((base): base is string=>Boolean(base?.trim())).map(base=>base.replace(/\/+$/,''));
}

export function publicR2ObjectKey(url: string) {
  try {
    const parsed=new URL(url);
    if (parsed.protocol!=='https:' || parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    for(const base of publicR2Bases()) {
      const root=new URL(base);
      const prefix=root.pathname.replace(/\/+$/,'')+'/';
      if (parsed.origin===root.origin && parsed.pathname.startsWith(prefix)) {
        const key=decodeURIComponent(parsed.pathname.slice(prefix.length));
        if (key && !key.split('/').some(part=>!part || part==='.' || part==='..')) return key;
      }
    }
  } catch { /* Invalid URLs remain unchanged by the display resolver. */ }
  return null;
}
