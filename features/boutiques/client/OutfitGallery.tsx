'use client';
/* eslint-disable @next/next/no-img-element -- Uses admitted outfit media without a shared image cache. */
import { useState } from 'react';
import { boutiqueCopy } from '@/shared/boutiques/copy';
import { boutiqueText, type Outfit } from '@/shared/boutiques/types';
export default function OutfitGallery({ outfit, language }: {
    outfit: Outfit;
    language: 'en' | 'es';
}) {
    const [selected, setSelected] = useState(0), t = boutiqueCopy[language], title = boutiqueText(outfit.name, language);
    const media = [...outfit.images.map((url, i) => ({ url, video: false, label: `${t.photo} ${i + 1}` })), ...outfit.videos.map((url, i) => ({ url, video: true, label: `${t.video} ${i + 1}` }))];
    const active = media[selected] ?? media[0];
    if (!active)
        return null;
    return <section className="wm-outfit-gallery" aria-label={`${title} · ${t.media}`}>
  <div className="wm-outfit-gallery-stage">{active.video ? <video key={active.url} src={active.url} poster={outfit.images[0]} controls muted playsInline preload="none" aria-label={`${title} · ${active.label}`}>{t.videoFallback}</video> : <img key={active.url} src={active.url} alt={`${title} · ${active.label}`}/>}</div>
  {media.length > 1 ? <div className="wm-outfit-gallery-thumbs" role="group" aria-label={t.media}>{media.map((asset, i) => <button key={asset.url} type="button" aria-label={asset.label} aria-pressed={selected === i} onClick={() => setSelected(i)}>{asset.video ? <><img src={outfit.images[0]} alt="" loading="lazy"/><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></> : <img src={asset.url} alt="" loading="lazy"/>}<span>{asset.label}</span></button>)}</div> : null}
  <p className="wm-outfit-gallery-count" aria-live="polite">{active.label} · {selected + 1} / {media.length}</p>
 </section>;
}
