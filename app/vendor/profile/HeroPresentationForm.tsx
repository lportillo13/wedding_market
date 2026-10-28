"use client";

import { useActionState, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { VendorImage } from '@/types/vendor';
import { prepareVendorHeroPresentation } from '@/shared/vendors/hero';
import { saveHeroPresentation } from './actions';

export default function HeroPresentationForm({ initial, videos }: { initial: unknown; videos: VendorImage[] }) {
  const { language } = useLanguage();
  const es = language === 'es';
  const parsed = prepareVendorHeroPresentation(initial && typeof initial === 'object' ? initial as { mode: unknown } : { mode: 'image' }, videos);
  const current = parsed.ok ? parsed.value : { mode: 'image' as const };
  const [mode, setMode] = useState(current.mode);
  const [source, setSource] = useState(current.mode === 'video' ? current.source : 'library');
  const [state, action, pending] = useActionState(saveHeroPresentation, { ok: false, message: '' });

  return <section className="wm-vendor-media-card wm-vendor-cover-settings mb-4">
    <h3 className="h5">{es ? 'Portada de tu perfil' : 'Your profile cover'}</h3>
    <p className="text-muted small">{es ? 'Una imagen o un video a todo el ancho, con el nombre de tu negocio sobre la portada.' : 'One full-width photo or video, with your business name over the cover.'}</p>
    <form action={action}>
      <input type="hidden" name="language" value={language} />
      <fieldset className="border-0 p-0 mb-3">
        <legend className="fs-6 mb-2">{es ? 'Tipo de portada' : 'Cover type'}</legend>
        <div className="d-flex flex-wrap gap-3">
          {(['image', 'video'] as const).map(value => <label className="d-inline-flex align-items-center gap-2" key={value}>
            <input type="radio" name="hero_mode" value={value} checked={mode === value} onChange={() => setMode(value)} />
            {value === 'image' ? es ? 'Fotografía' : 'Photo' : 'Video'}
          </label>)}
        </div>
      </fieldset>
      {mode === 'video' && <div className="row g-3 mb-3">
        <div className="col-md-5">
          <label className="form-label" htmlFor="hero-source">{es ? 'Origen del video' : 'Video source'}</label>
          <select id="hero-source" name="hero_source" className="form-select" value={source} onChange={event => setSource(event.target.value as 'library' | 'link')}>
            <option value="library">{es ? 'Videos de mi perfil' : 'My profile videos'}</option>
            <option value="link">{es ? 'YouTube, Vimeo u otro enlace' : 'YouTube, Vimeo or another link'}</option>
          </select>
        </div>
        <div className="col-md-7">
          {source === 'library' ? <>
            <label className="form-label" htmlFor="hero-asset">{es ? 'Elige un video' : 'Choose a video'}</label>
            <select id="hero-asset" className="form-select" name="hero_asset_id" required defaultValue={current.mode === 'video' && current.source === 'library' ? current.assetId : ''} aria-describedby="hero-video-help">
              <option value="">{es ? 'Selecciona un video' : 'Select a video'}</option>
              {videos.map((video, index) => <option key={video.public_id} value={video.public_id}>{`Video ${index + 1}`}</option>)}
            </select>
            <p id="hero-video-help" className="small text-muted mt-2 mb-0"><a href="#profile-videos">{es ? 'Sube un video en la sección de abajo' : 'Upload a video in the section below'}</a></p>
          </> : <>
            <label className="form-label" htmlFor="hero-url">{es ? 'Enlace del video' : 'Video link'}</label>
            <input id="hero-url" type="url" className="form-control" name="hero_url" maxLength={2000} required placeholder="https://www.youtube.com/watch?v=…" defaultValue={current.mode === 'video' && current.source === 'link' ? current.url : ''} aria-describedby="hero-link-help" />
            <p id="hero-link-help" className="small text-muted mt-2 mb-0">{es ? 'YouTube, Vimeo o enlace HTTPS directo a MP4/WebM. El video debe permitir su reproducción en otros sitios.' : 'YouTube, Vimeo or a direct HTTPS MP4/WebM link. The video must allow playback on other websites.'}</p>
          </>}
        </div>
      </div>}
      <p className="small text-muted">{es ? 'La foto de portada se conserva como imagen de respaldo. Los videos se reproducen automáticamente sin sonido y se pueden pausar.' : 'Your cover photo stays as the fallback image. Videos autoplay without sound and can be paused.'}</p>
      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>{pending ? es ? 'Guardando…' : 'Saving…' : es ? 'Guardar portada' : 'Save cover'}</button>
      {state.message && <p className={`small mt-3 mb-0 ${state.ok ? 'text-success' : 'text-danger'}`} role="status">{state.message}</p>}
    </form>
  </section>;
}
