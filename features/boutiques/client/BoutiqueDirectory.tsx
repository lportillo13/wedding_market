'use client';
/* eslint-disable @next/next/no-img-element -- Use admitted vendor media without another optimizer cache. */
import Link from 'next/link';
import { useState } from 'react';
import HeaderIcon from '@/components/HeaderIcon';
import { resolveMediaUrl } from '@/lib/media-url';
import { boutiqueCopy } from '@/shared/boutiques/copy';
import type { Boutique, BoutiqueLanguage } from '@/shared/boutiques/types';

export default function BoutiqueDirectory({ shops, language, kind, page, loading, example, onKind, onPage }: {
    shops: Boutique[]; language: BoutiqueLanguage; kind: string; page: number; loading: boolean; example: boolean;
    onKind: (kind: string) => void; onPage: (page: number) => void;
}) {
    const t = boutiqueCopy[language];
    return <section className="wm-boutique-directory" aria-labelledby="boutique-directory-title" aria-busy={loading}>
        <div className="wm-boutique-directory__intro">
            <div className="wm-boutique-directory__copy">
                <p className="wm-boutique-directory__eyebrow">{t.title}</p>
                <h1 id="boutique-directory-title">{t.directoryHeading}</h1>
                <p>{t.directoryIntro}</p>
            </div>
            <img className="wm-boutique-directory__image" src="/images/boutique-directory-atelier.webp" alt="" width={1200} height={800} fetchPriority="high"/>
        </div>
        <div className="wm-boutique-directory__controls">
            <div className="wm-boutique-filters" role="group" aria-label={t.directoryFilters}>
                {([['', t.all], ['dress', t.dress], ['suit', t.suit]] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={kind === value} onClick={() => onKind(value)}>{label}</button>)}
            </div>
            <span className="wm-boutique-directory__location"><HeaderIcon name="pin"/>Costa Rica</span>
        </div>
        {loading && !shops.length ? <p className="wm-boutique-directory__status" role="status">{t.loading}</p> : null}
        <div className="wm-boutique-directory__grid">
            {shops.map(shop => <BoutiqueDirectoryCard key={shop.vendor_id} shop={shop} language={language}/>)}
        </div>
        {!loading && !shops.length ? <p className="wm-boutique-empty">{kind ? t.directoryNoMatches : t.empty}</p> : null}
        <div className="wm-boutique-directory__pagination">
            {page > 1 ? <button type="button" className="wm-boutique-directory__previous" disabled={loading} onClick={() => onPage(page - 1)}><HeaderIcon name="arrow"/>{t.previous}</button> : null}
            {shops.length === 12 ? <button type="button" disabled={loading} onClick={() => onPage(page + 1)}>{t.next}<HeaderIcon name="arrow"/></button> : null}
        </div>
        {!example ? <p className="wm-boutique-directory__examples"><Link href="/boutiques?examples=1">{t.directoryExamples}<HeaderIcon name="arrow"/></Link></p> : null}
    </section>;
}

function BoutiqueDirectoryCard({ shop, language }: { shop: Boutique; language: BoutiqueLanguage }) {
    const [failedLogo, setFailedLogo] = useState<string | null>(null);
    const [failedHero, setFailedHero] = useState<string | null>(null);
    const initials = shop.name.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toLocaleUpperCase(language);
    const hasPhoto = Boolean(shop.hero && failedHero !== shop.hero);
    return <Link href={`/boutiques/${shop.slug}`} className={`wm-boutique-directory-card${hasPhoto ? '' : ' wm-boutique-directory-card--empty'}`} prefetch={false}>
        {hasPhoto ? <img className="wm-boutique-directory-card__photo" src={shop.hero!} alt="" width={600} height={800} loading="lazy" onError={() => setFailedHero(shop.hero)}/> : <span className="wm-boutique-directory-card__placeholder" aria-hidden="true">{initials}</span>}
        <div className="wm-boutique-directory-card__identity">
            <div className={`wm-boutique-directory-card__mark${shop.logo && failedLogo !== shop.logo ? ' wm-boutique-directory-card__mark--image' : ''}`} aria-hidden="true">
                {shop.logo && failedLogo !== shop.logo ? <img src={resolveMediaUrl(shop.logo)} alt="" width={72} height={72} loading="lazy" onError={() => setFailedLogo(shop.logo)}/> : initials}
            </div>
            <h2>{shop.name}</h2>
            <p>{[shop.city, shop.region].filter(Boolean).join(' · ')}</p>
            <span className="wm-boutique-directory-card__action">{boutiqueCopy[language].explore}<HeaderIcon name="arrow"/></span>
        </div>
    </Link>;
}
