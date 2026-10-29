'use client';
import HeaderIcon from '@/components/HeaderIcon';
import { boutiqueCopy } from '@/shared/boutiques/copy';
import { boutiqueText, outfitDetailKeys, type Boutique, type BoutiqueLanguage, type Outfit } from '@/shared/boutiques/types';
import BoutiqueAbout from './BoutiqueAbout';
import OutfitGallery from './OutfitGallery';

export default function OutfitDetails({ outfit, shop, language, example, saved, busy, onBack, onVisit, onToggle }: {
    outfit: Outfit;
    shop: Boutique | null;
    language: BoutiqueLanguage;
    example: boolean;
    saved: boolean;
    busy: boolean;
    onBack: () => void;
    onVisit: () => void;
    onToggle: () => void;
}) {
    const t = boutiqueCopy[language];
    const title = boutiqueText(outfit.name, language);
    const description = boutiqueText(outfit.description, language);
    const introduction = description.length > 220 ? `${description.slice(0, 220).replace(/\s+\S*$/, '')}…` : description;
    // Only the controlled examples encode two languages in one free-text value.
    // Preserve real boutique text, including legitimate slash-separated values.
    const valueText = (value: string) => {
        const pair = example ? value.split(' / ') : [];
        return pair.length === 2 ? pair[language === 'es' ? 1 : 0] : value;
    };
    const factKeys = [outfit.kind === 'dress' ? 'silhouette' : 'fit', 'fabric', 'color'] as const;
    const specifications = outfitDetailKeys[outfit.kind].filter(key => outfit.details[key]);
    const price = outfit.price_cents === null ? t.price : new Intl.NumberFormat(language, { style: 'currency', currency: outfit.currency }).format(outfit.price_cents / 100);
    return <section className="wm-boutique-detail" aria-labelledby="outfit-detail-title">
        {shop ? <BoutiqueAbout key={shop.slug} shop={shop} language={language} example={example} compact onVisit={onVisit}/> : null}
        <nav className="wm-outfit-detail-breadcrumb" aria-label={t.collection}>
            <button type="button" onClick={onBack}>← {shop ? `${t.collectionAt} ${shop.name}` : t.back}</button><span aria-hidden="true">/</span><span>{t[outfit.kind]}</span>
        </nav>
        <div className="wm-boutique-detail-grid">
            <OutfitGallery key={outfit.id} outfit={outfit} language={language}/>
            <div className="wm-outfit-detail-copy">
                {shop ? <p className="wm-boutique-script">{t.collectionAt} {shop.name}</p> : null}
                <h1 id="outfit-detail-title">{title}</h1>
                <p className={`wm-outfit-detail-price${outfit.price_cents === null ? ' wm-outfit-detail-price--ask' : ''}`}>{price}</p>
                <p className="wm-outfit-detail-offer">{t[outfit.offer]}</p>
                {introduction ? <p className="wm-outfit-detail-description">{introduction}</p> : null}
                {factKeys.some(key => outfit.details[key]) ? <dl className="wm-outfit-detail-facts">{factKeys.filter(key => outfit.details[key]).map(key => <div key={key}><dt>{t[key]}</dt><dd>{valueText(outfit.details[key])}</dd></div>)}</dl> : null}
                {outfit.sample_sizes ? <div className="wm-outfit-detail-samples"><p>{t.sample}</p><span>{outfit.sample_sizes}</span></div> : null}
                <div className="wm-outfit-detail-actions">
                    <button type="button" className="btn btn-primary" onClick={onVisit}>{t.request} <HeaderIcon name="arrow"/></button>
                    <button type="button" className="btn btn-outline-secondary wm-outfit-detail-save" disabled={busy} aria-label={saved ? t.unsave : t.save} aria-pressed={saved} onClick={onToggle}><HeaderIcon name="heart"/></button>
                </div>
                <p className="wm-outfit-detail-hint">{t.fittingHint}</p>
                <details className="wm-outfit-detail-fold">
                    <summary>{t.designMaterials}<span aria-hidden="true"/></summary>
                    {description ? <p>{description}</p> : null}
                    <dl>{outfit.designer ? <div><dt>{t.designer}</dt><dd>{outfit.designer}</dd></div> : null}{specifications.map(key => <div key={key}><dt>{key === 'back' ? t.backDetail : t[key]}</dt><dd>{valueText(outfit.details[key])}</dd></div>)}{outfit.reference ? <div><dt>{t.reference}</dt><dd>{outfit.reference}</dd></div> : null}</dl>
                </details>
                <details className="wm-outfit-detail-fold">
                    <summary>{t.sizesFitting}<span aria-hidden="true"/></summary>
                    <dl>{[[t.sample, outfit.sample_sizes], [t.sizes, outfit.order_sizes], [t.timeline, outfit.lead_time]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{valueText(value)}</dd></div>)}</dl>
                    <p>{t.availability}</p>
                </details>
            </div>
        </div>
    </section>;
}
