'use client';
import { useRouter } from 'next/navigation';
import OutfitDetails from './OutfitDetails';
import OutfitCard from './OutfitCard';
import BoutiqueAbout from './BoutiqueAbout';
import BoutiqueToolbar from './BoutiqueToolbar';
import BoutiqueDirectory from './BoutiqueDirectory';
import BoutiqueVisitPanel, { type VisitProfile, type VisitSubmission } from './BoutiqueVisitPanel';
import HeroSectionNav from '@/components/HeroSectionNav';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabaseBrowser } from '@/lib/supabase/client';
import { boutiqueCopy } from '@/shared/boutiques/copy';
import { boutiqueText, type Boutique, type Outfit } from '@/shared/boutiques/types';
import { useBoutiqueTransport } from './transport';
type Catalog = {
    items: Boutique[];
};
type State = {
    saved: string[];
    profile: VisitProfile;
};
export default function BoutiqueExperience({ initial, store = null, favorites = false, selectedOutfit = null }: {
    initial?: Catalog;
    store?: Boutique | null;
    favorites?: boolean;
    selectedOutfit?: Outfit | null;
}) {
    const { language } = useLanguage(), t = boutiqueCopy[language];
    const router = useRouter();
    const { api: boutiqueApi, example: isExample } = useBoutiqueTransport();
    const [authRevision, setAuthRevision] = useState(0);
    const [shops, setShops] = useState(initial?.items ?? []), [shop, setShop] = useState(store), [items, setItems] = useState<Outfit[]>(store?.items ?? []);
    const [kind, setKind] = useState(''), [page, setPage] = useState(1), [saved, setSaved] = useState<string[]>([]), [account, setAccount] = useState<State['profile']>(null);
    const [detail, setDetail] = useState<Outfit | null>(selectedOutfit), [booking, setBooking] = useState(false), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(false);
    const seq = useRef(0), submission = useRef<VisitSubmission>(null);
    const openVisit = useCallback(() => { setMessage(''); setBooking(true); }, []);
    const closeVisit = useCallback(() => setBooking(false), []);
    const visitRequested = useCallback(() => { setBooking(false); setMessage(t.requested); }, [t.requested]);
    const slug = store?.slug;
    useEffect(() => {
        let active = true;
        let version = 0;
        const load = async () => {
            const own = ++version;
            setSaved([]);
            setAccount(null);
            if (!isExample) {
                setItems(old => favorites ? [] : old.map(item => ({ ...item, price_cents: null })));
                setDetail(old => old ? { ...old, price_cents: null } : null);
                setShop(old => old ? { ...old, address: null, map_url: null } : null);
            }
            setAuthRevision(old => old + 1);
            try {
                const result = await boutiqueApi<State>('/account?mode=state');
                if (active && version === own) {
                    setSaved(result.saved);
                    setAccount(result.profile);
                }
            }
            catch { /* Guests can browse; authenticated actions show the sign-in link. */ }
        };
        void load();
        if (isExample)
            return () => { active = false; version++; };
        const { data } = supabaseBrowser.auth.onAuthStateChange(() => { void load(); });
        return () => { active = false; version++; data.subscription.unsubscribe(); };
    }, [favorites, boutiqueApi, isExample]);
    useEffect(() => {
        let active = true;
        const version = ++seq.current;
        setLoading(true);
        setMessage('');
        const load = async () => {
            try {
                if (favorites) {
                    const r = await boutiqueApi<{
                        items: Outfit[];
                    }>('/account?mode=favorites&page=' + page);
                    if (active && version === seq.current)
                        setItems(r.items);
                }
                else if (slug) {
                    const r = await boutiqueApi<Boutique>(`?slug=${encodeURIComponent(slug)}&page=${page}${kind ? '&kind=' + kind : ''}`);
                    if (active && version === seq.current) {
                        setShop(r);
                        setItems(r.items);
                        if (isExample)
                            setDetail(old => old ? r.items.find(i => i.id === old.id) ?? null : null);
                    }
                }
                else {
                    const r = await boutiqueApi<Catalog>('?page=' + page + (kind ? '&kind=' + kind : ''));
                    if (active && version === seq.current)
                        setShops(r.items);
                }
            }
            catch {
                if (active && version === seq.current)
                    setMessage(t.error);
            }
            finally {
                if (active && version === seq.current)
                    setLoading(false);
            }
        };
        void load();
        return () => { active = false; };
    }, [slug, kind, page, favorites, language, t.error, authRevision, boutiqueApi, isExample]);
    async function toggle(item: Outfit) {
        if (busy)
            return;
        setBusy(true);
        setMessage('');
        try {
            await boutiqueApi('/account', { action: 'favorite', id: item.id, saved: !saved.includes(item.id) });
            setSaved(old => old.includes(item.id) ? old.filter(id => id !== item.id) : [...old, item.id]);
            if (favorites)
                setItems(old => old.filter(i => i.id !== item.id));
        }
        catch {
            setMessage(account ? t.error : t.signIn);
        }
        finally {
            setBusy(false);
        }
    }
    const list = shop || favorites;
    const title = detail ? boutiqueText(detail.name, language) : favorites ? t.favorites : t.title;
    return <main className={`wm-boutiques${!list && !detail && !booking ? ' wm-boutiques--directory' : ''}`}>
  {shop && !detail ? <section className={`wm-boutique-hero${shop.hero ? '' : ' wm-boutique-hero--empty'}`} style={shop.hero ? { backgroundImage: `linear-gradient(180deg,#17120da6 0%,#17120d40 23%,#17120d1a 36%,#17120d66 64%,#17120dcc 100%),url("${shop.hero.replaceAll('"', '%22')}")` } : undefined}>
    <div>{isExample?<p className="wm-boutique-example-label">{language==='es'?'Boutique de ejemplo':'Example boutique'}</p>:null}<p className="wm-boutique-script">{t.accent}</p><h1>{shop.name}</h1><p>{[shop.city, shop.region, 'Costa Rica'].filter(Boolean).join(' · ')}</p><div className="wm-boutique-actions"><button className="btn btn-light" onClick={openVisit}>{t.request} →</button><a href="#boutique-collection">{t.explore}</a></div></div>
  </section> : null}
  {shop && !detail ? <HeroSectionNav key={shop.vendor_id} as="nav" className="wm-boutique-tabs" label={t.about} coverSelector=".wm-boutique-hero:not(.wm-boutique-hero--empty)" enabled={Boolean(shop.hero)}><a href="#boutique-collection">{t.collection}</a><a href="#boutique-about">{t.about}</a><button onClick={openVisit}>{t.visit}</button></HeroSectionNav> : null}
  <div className={detail ? 'container wm-boutique-detail-container' : 'container py-4 py-lg-5'}>
   {!detail ? <BoutiqueToolbar language={language} example={isExample} vendor={account?.role === 'vendor'}/> : null}
   {message ? <p role="alert" className="wm-boutique-notice">{message} {!account ? <Link href={`/login?next=${encodeURIComponent(favorites ? '/boutiques/favorites' : `/boutiques/${shop?.slug ?? ''}`)}`}>{t.account} →</Link> : null}</p> : null}
   {detail ? <OutfitDetails outfit={detail} shop={shop} language={language} example={isExample} saved={saved.includes(detail.id)} busy={busy} onBack={() => setDetail(null)} onVisit={openVisit} onToggle={() => void toggle(detail)}/> :
                <>{shop ? <BoutiqueAbout key={shop.slug} shop={shop} language={language} example={isExample} onVisit={openVisit}/> : null}{!list ? <BoutiqueDirectory shops={shops} language={language} kind={kind} page={page} loading={loading} example={isExample} onKind={value => { if (value === kind) return; setKind(value); setPage(1); setShops([]); }} onPage={setPage}/> : <section id="boutique-collection"><p className="wm-boutique-script">{shop ? t.accent : t.boutiques}</p>{shop ? <h2 className="wm-boutique-collection-title">{t.collection}</h2> : <h1>{title}</h1>}
    {shop ? <div className="wm-boutique-filters" role="group" aria-label={t.collection}>{[['', t.all], ['dress', t.dress], ['suit', t.suit]].map(([value, label]) => <button type="button" key={value} aria-pressed={kind === value} onClick={() => { setKind(value); setPage(1); }}>{label}</button>)}</div> : null}
    {loading ? <p role="status">{t.loading}</p> : null}
    <div className="wm-vendor-grid wm-boutique-grid--editorial">{items.map(item => <OutfitCard key={item.id} outfit={item} language={language} saved={saved.includes(item.id)} busy={busy} onToggle={() => void toggle(item)} onOpen={() => {
        if (favorites) router.push(`/boutiques/${(item as Outfit & { slug: string }).slug}?outfit=${item.id}`);
        else setDetail(item);
    }}/>)}</div>
    {!loading && !items.length ? <p className="wm-boutique-empty">{favorites ? t.noFavorites : t.noItems}</p> : null}
    <div className="wm-boutique-actions mt-4">{page > 1 ? <button className="btn btn-outline-secondary" disabled={loading} onClick={() => setPage(p => p - 1)}>{t.previous}</button> : null}{items.length === 12 ? <button className="btn btn-outline-secondary" disabled={loading} onClick={() => setPage(p => p + 1)}>{t.next}</button> : null}</div>
   </section>}</>}
  </div>
  {booking && shop ? <BoutiqueVisitPanel shop={shop} selectedOutfit={detail} profile={account} submission={submission} onClose={closeVisit} onSuccess={visitRequested}/> : null}
 </main>;
}
