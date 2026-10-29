'use client';
/* eslint-disable @next/next/no-img-element -- Reuse the vendor logo without adding an optimizer cache. */
import { useState } from 'react';
import HeaderIcon from '@/components/HeaderIcon';
import ContentSafety from '@/components/safety/ContentSafety';
import { resolveMediaUrl } from '@/lib/media-url';
import { boutiqueCopy } from '@/shared/boutiques/copy';
import { boutiqueText, type Boutique, type BoutiqueLanguage } from '@/shared/boutiques/types';

export default function BoutiqueAbout({ shop, language, example, compact = false, onVisit }: {
    shop: Boutique;
    language: BoutiqueLanguage;
    example: boolean;
    compact?: boolean;
    onVisit: () => void;
}) {
    const t = boutiqueCopy[language];
    const [failedLogo, setFailedLogo] = useState<string | null>(null);
    const initials = shop.name.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toLocaleUpperCase(language);
    return <section id="boutique-about" className={`wm-boutique-about${compact ? ' wm-boutique-about--compact' : ''}`} aria-labelledby="boutique-about-heading">
        {!compact ? <>
            <div className="wm-boutique-about__logo">
                {shop.logo && failedLogo !== shop.logo ? <img src={resolveMediaUrl(shop.logo)} alt={shop.name} width={112} height={112} loading="lazy" onError={() => setFailedLogo(shop.logo)}/> : <span aria-hidden="true">{initials}</span>}
            </div>
            <div className="wm-boutique-about__brand">
                <h2 id="boutique-about-heading">{shop.name}</h2>
                <p><HeaderIcon name="pin"/>{[shop.city, shop.region, 'Costa Rica'].filter(Boolean).join(' · ')}</p>
            </div>
        </> : null}
        <details>
            <summary>
                {compact ? <span className="wm-boutique-about__identity"><strong id="boutique-about-heading">{shop.name}</strong><small>{[shop.city, shop.region].filter(Boolean).join(' · ')}</small></span> : null}
                <span className="wm-boutique-about__bio">{boutiqueText(shop.bio, language)}</span>
                <span className="wm-boutique-about__toggle"><span className="wm-boutique-about__more">{compact ? language === 'es' ? 'Leer más' : 'Read more' : t.aboutMore} <span aria-hidden="true">+</span></span><span className="wm-boutique-about__less">{compact ? language === 'es' ? 'Leer menos' : 'Read less' : t.aboutLess} <span aria-hidden="true">−</span></span></span>
            </summary>
            <div className="wm-boutique-about__details">
                <div>{shop.languages?.length ? <p>{shop.languages.join(' · ')}</p> : null}{shop.address ? <p>{shop.address}</p> : null}{shop.map_url && /^https:\/\//.test(shop.map_url) ? <a href={shop.map_url} target="_blank" rel="noopener noreferrer">{shop.city} ↗</a> : null}{!example ? <ContentSafety kind="vendor" targetId={shop.vendor_id} language={language}/> : null}</div>
                <div><h3>{t.policies}</h3><p>{boutiqueText(shop.policies, language)}</p><p>{shop.duration_minutes} min · {shop.companions_max} {t.companions.toLowerCase()} · {shop.visit_fee_cents ? new Intl.NumberFormat(language, { style: 'currency', currency: shop.currency }).format(shop.visit_fee_cents / 100) : t.free}</p><button type="button" className="btn btn-primary" onClick={onVisit}>{t.request} →</button></div>
            </div>
        </details>
    </section>;
}
