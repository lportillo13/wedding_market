'use client';
import ContentSafety from '@/components/safety/ContentSafety';
import { boutiqueCopy } from '@/shared/boutiques/copy';
import { boutiqueText, type Boutique, type BoutiqueLanguage } from '@/shared/boutiques/types';

export default function BoutiqueAbout({ shop, language, example, onVisit }: {
    shop: Boutique;
    language: BoutiqueLanguage;
    example: boolean;
    onVisit: () => void;
}) {
    const t = boutiqueCopy[language];
    return <section id="boutique-about" className="wm-boutique-about" aria-labelledby="boutique-about-heading">
        <h2 id="boutique-about-heading">{t.about}</h2>
        <details>
            <summary>
                <span className="wm-boutique-about__bio">{boutiqueText(shop.bio, language)}</span>
                <span className="wm-boutique-about__toggle"><span className="wm-boutique-about__more">{language === 'es' ? 'Leer más' : 'Read more'} +</span><span className="wm-boutique-about__less">{language === 'es' ? 'Leer menos' : 'Read less'} −</span></span>
            </summary>
            <div className="wm-boutique-about__details">
                <div>{shop.languages?.length ? <p>{shop.languages.join(' · ')}</p> : null}{shop.address ? <p>{shop.address}</p> : null}{shop.map_url && /^https:\/\//.test(shop.map_url) ? <a href={shop.map_url} target="_blank" rel="noopener noreferrer">{shop.city} ↗</a> : null}{!example ? <ContentSafety kind="vendor" targetId={shop.vendor_id} language={language}/> : null}</div>
                <div><h3>{t.policies}</h3><p>{boutiqueText(shop.policies, language)}</p><p>{shop.duration_minutes} min · {shop.companions_max} {t.companions.toLowerCase()} · {shop.visit_fee_cents ? new Intl.NumberFormat(language, { style: 'currency', currency: shop.currency }).format(shop.visit_fee_cents / 100) : t.free}</p><button type="button" className="btn btn-primary" onClick={onVisit}>{t.request} →</button></div>
            </div>
        </details>
    </section>;
}
