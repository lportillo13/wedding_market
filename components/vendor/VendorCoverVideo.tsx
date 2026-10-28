"use client";

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { VendorHeroVideo } from '@/shared/vendors/hero';
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from '@/lib/media-url';

export default function VendorCoverVideo({ source, poster, name, language }: { source: VendorHeroVideo; poster: string | null; name: string; language: 'en' | 'es' }) {
  const container = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const [requested, setRequested] = useState(false);
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(true);
  const active = requested && visible && foreground;

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let offeredAutoplay = false;
    const motionChanged = () => { if (reduced.matches) setRequested(false); };
    const visibilityChanged = () => setForeground(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(Boolean(entry?.isIntersecting));
      setForeground(!document.hidden);
      if (entry?.isIntersecting && !offeredAutoplay) {
        offeredAutoplay = true;
        if (!reduced.matches) setRequested(true);
      }
    }, { threshold: .05 });
    if (container.current) observer.observe(container.current);
    reduced.addEventListener('change', motionChanged);
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => { observer.disconnect(); reduced.removeEventListener('change', motionChanged); document.removeEventListener('visibilitychange', visibilityChanged); };
  }, []);

  useEffect(() => {
    const video = player.current;
    if (!video) return;
    if (active) void video.play().catch(() => setRequested(false));
    else video.pause();
  }, [active]);

  const label = language === 'es' ? active ? 'Pausar video de portada' : 'Reproducir video de portada' : active ? 'Pause cover video' : 'Play cover video';
  return <div className="wm-profile-cover-video" ref={container}>
    {poster && <Image src={resolveMediaUrl(poster)} alt="" fill priority sizes="100vw" unoptimized={shouldRenderUnoptimizedMedia(poster)} className="wm-profile-cover-video__poster" />}
    {source.provider === 'file' ? <video ref={player} src={resolveMediaUrl(source.url)} poster={poster ? resolveMediaUrl(poster) : undefined} muted playsInline loop preload="metadata" aria-hidden="true" className={`wm-profile-cover-video__file${active ? ' is-playing' : ''}`} onError={() => setRequested(false)} /> : active && <iframe src={source.embedUrl} title={`${name} · ${language === 'es' ? 'Video de portada' : 'Cover video'}`} className="wm-profile-cover-video__embed" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" referrerPolicy="strict-origin-when-cross-origin" tabIndex={-1} />}
    <button type="button" className="wm-profile-cover-video__toggle" aria-label={label} aria-pressed={active} onClick={() => setRequested(current => !current)}><span aria-hidden="true">{active ? 'Ⅱ' : '▶'}</span></button>
    {source.provider !== 'file' && <a className="wm-profile-cover-video__source" href={source.url} target="_blank" rel="noreferrer">{source.provider === 'youtube' ? 'YouTube' : 'Vimeo'} ↗</a>}
  </div>;
}
