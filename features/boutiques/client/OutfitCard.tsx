'use client';
/* eslint-disable @next/next/no-img-element -- Reuses admitted vendor media without adding an optimizer cache. */
import HeaderIcon from '@/components/HeaderIcon';
import { boutiqueCopy } from '@/shared/boutiques/copy';
import { boutiqueText, type BoutiqueLanguage, type Outfit } from '@/shared/boutiques/types';

export default function OutfitCard({ outfit, language, saved, busy, onOpen, onToggle }: {
    outfit: Outfit;
    language: BoutiqueLanguage;
    saved: boolean;
    busy: boolean;
    onOpen: () => void;
    onToggle: () => void;
}) {
    const t = boutiqueCopy[language];
    const name = boutiqueText(outfit.name, language);
    const price = outfit.price_cents === null ? t.price : new Intl.NumberFormat(language, { style: 'currency', currency: outfit.currency }).format(outfit.price_cents / 100);
    return <article className="wm-vendor-card wm-outfit-card">
        <div className="wm-vendor-card__media">
            <button type="button" className="wm-vendor-card__image-link wm-outfit-card__open" onClick={onOpen} aria-label={name} tabIndex={-1}>
                {outfit.images[0] ? <img src={outfit.images[0]} alt={name} loading="lazy"/> : <span className="wm-vendor-card__photo-empty">{t[outfit.kind]}</span>}
            </button>
            <div className="wm-vendor-card__save"><button type="button" className="btn" disabled={busy} aria-label={saved ? t.unsave : t.save} aria-pressed={saved} onClick={onToggle}><HeaderIcon name="heart"/></button></div>
        </div>
        <div className="wm-vendor-card__body">
            <div className="wm-vendor-card__cats">{t[outfit.kind]}</div>
            <div className="wm-vendor-card__heading"><button type="button" className="wm-vendor-card__name wm-outfit-card__open" onClick={onOpen}>{name}</button></div>
            {outfit.designer ? <div className="wm-vendor-card__location">{outfit.designer}</div> : null}
            <div className="wm-vendor-card__details"><div className="wm-vendor-card__location">{t[outfit.offer]} · {price}</div></div>
            <button type="button" className="wm-vendor-card__profile-link wm-outfit-card__open" onClick={onOpen} aria-label={`${language === 'es' ? 'Ver prenda' : 'View outfit'} · ${name}`}><span aria-hidden="true">→</span></button>
        </div>
    </article>;
}
