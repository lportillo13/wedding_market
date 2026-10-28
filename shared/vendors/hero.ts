export type VendorHeroVideo = { provider: 'file'; url: string } | { provider: 'youtube' | 'vimeo'; url: string; embedUrl: string };
export type VendorHeroPresentation = { mode: 'image' } | { mode: 'video'; source: 'library'; assetId: string } | { mode: 'video'; source: 'link'; url: string };
type GalleryAsset = { public_id?: unknown; url?: unknown; type?: unknown } | null;

/** Normalize public video links; never accept executable markup or credentials. */
export function parseVendorVideoUrl(value: unknown): VendorHeroVideo | null {
  if (typeof value !== 'string' || value.length > 2000) return null;
  let url: URL;
  try { url = new URL(value.trim()); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split('/').filter(Boolean);
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be', 'www.youtu.be'].includes(host)) {
    const id = host.endsWith('youtu.be') ? parts[0] : ['embed', 'shorts', 'live'].includes(parts[0]) ? parts[1] : url.searchParams.get('v');
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return { provider: 'youtube', url: `https://www.youtube.com/watch?v=${id}`, embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${id}&controls=0&rel=0` };
  }
  if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
    const id = parts[0] === 'video' ? parts[1] : parts[0];
    if (!id || !/^\d{5,12}$/.test(id)) return null;
    const hash = url.searchParams.get('h') ?? (parts[0] === 'video' ? parts[2] : parts[1]);
    if (hash && !/^[A-Za-z0-9]{1,64}$/.test(hash)) return null;
    const privacy = hash ? `h=${hash}&` : '';
    return { provider: 'vimeo', url: `https://vimeo.com/${id}${hash ? `/${hash}` : ''}`, embedUrl: `https://player.vimeo.com/video/${id}?${privacy}autoplay=1&muted=1&loop=1&background=1&dnt=1` };
  }
  if (host === 'localhost' || !host.includes('.') || /^(?:\d+\.){3}\d+$/.test(host) || host.includes(':')) return null;
  if (!/\.(mp4|webm)$/i.test(url.pathname)) return null;
  return { provider: 'file', url: url.toString() };
}

export function prepareVendorHeroPresentation(input: { mode: unknown; source?: unknown; assetId?: unknown; url?: unknown }, gallery: readonly GalleryAsset[]) {
  if (input.mode === 'image') return { ok: true as const, value: { mode: 'image' } as VendorHeroPresentation };
  if (input.mode !== 'video') return { ok: false as const, error: 'mode' as const };
  if (input.source === 'library') {
    const asset = gallery.find(item => item?.public_id === input.assetId && item?.type === 'video');
    if (!asset || typeof asset.public_id !== 'string' || !parseVendorVideoUrl(asset.url)) return { ok: false as const, error: 'asset' as const };
    return { ok: true as const, value: { mode: 'video', source: 'library', assetId: asset.public_id } as VendorHeroPresentation };
  }
  if (input.source === 'link') {
    const video = parseVendorVideoUrl(input.url);
    if (!video) return { ok: false as const, error: 'url' as const };
    return { ok: true as const, value: { mode: 'video', source: 'link', url: video.url } as VendorHeroPresentation };
  }
  return { ok: false as const, error: 'source' as const };
}

export function resolveVendorHeroVideo(settings: unknown, gallery: readonly GalleryAsset[]): VendorHeroVideo | null {
  if (!settings || typeof settings !== 'object') return null;
  const value = settings as Record<string, unknown>;
  const prepared = prepareVendorHeroPresentation({ mode: value.mode, source: value.source, assetId: value.assetId, url: value.url }, gallery);
  if (!prepared.ok || prepared.value.mode !== 'video') return null;
  if (prepared.value.source === 'link') return parseVendorVideoUrl(prepared.value.url);
  const assetId = prepared.value.assetId;
  const asset = gallery.find(item => item?.public_id === assetId && item?.type === 'video');
  return typeof asset?.url === 'string' ? parseVendorVideoUrl(asset.url) : null;
}
