'use client';
/* eslint-disable @next/next/no-img-element -- Reuses admitted vendor media without adding an optimizer cache. */
import { useRouter } from 'next/navigation';
import OutfitDetails from './OutfitDetails';
import OutfitCard from './OutfitCard';
import BoutiqueAbout from './BoutiqueAbout';
import BoutiqueToolbar from './BoutiqueToolbar';
import BoutiqueDirectory from './BoutiqueDirectory';
import HeroSectionNav from '@/components/HeroSectionNav';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabaseBrowser } from '@/lib/supabase/client';
import { boutiqueCopy } from '@/shared/boutiques/copy';
import { boutiqueText, type Boutique, type Outfit, costaRicaDateTime } from '@/shared/boutiques/types';
import { useBoutiqueTransport } from './transport';
type Catalog = {
    items: Boutique[];
};
type State = {
    saved: string[];
    profile: {
        role: string;
        tentative_wedding_date: string | null;
        wedding_budget: number | null;
    } | null;
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
    const seq = useRef(0), submission = useRef<{
        id: string;
        fingerprint: string;
    } | null>(null);
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
  {shop && !detail && !booking ? <section className={`wm-boutique-hero${shop.hero ? '' : ' wm-boutique-hero--empty'}`} style={shop.hero ? { backgroundImage: `linear-gradient(180deg,#17120da6 0%,#17120d40 23%,#17120d1a 36%,#17120d66 64%,#17120dcc 100%),url("${shop.hero.replaceAll('"', '%22')}")` } : undefined}>
    <div>{isExample?<p className="wm-boutique-example-label">{language==='es'?'Boutique de ejemplo':'Example boutique'}</p>:null}<p className="wm-boutique-script">{t.accent}</p><h1>{shop.name}</h1><p>{[shop.city, shop.region, 'Costa Rica'].filter(Boolean).join(' · ')}</p><div className="wm-boutique-actions"><button className="btn btn-light" onClick={() => { setBooking(true); setMessage(''); }}>{t.request} →</button><a href="#boutique-collection">{t.explore}</a></div></div>
  </section> : null}
  {shop && !detail && !booking ? <HeroSectionNav key={shop.vendor_id} as="nav" className="wm-boutique-tabs" label={t.about} coverSelector=".wm-boutique-hero:not(.wm-boutique-hero--empty)" enabled={Boolean(shop.hero)}><a href="#boutique-collection">{t.collection}</a><a href="#boutique-about">{t.about}</a><button onClick={() => setBooking(true)}>{t.visit}</button></HeroSectionNav> : null}
  <div className={detail && !booking ? 'container wm-boutique-detail-container' : 'container py-4 py-lg-5'}>
   {!detail || booking ? <BoutiqueToolbar language={language} example={isExample} vendor={account?.role === 'vendor'}/> : null}
   {message ? <p role="alert" className="wm-boutique-notice">{message} {!account ? <Link href={`/login?next=${encodeURIComponent(favorites ? '/boutiques/favorites' : `/boutiques/${shop?.slug ?? ''}`)}`}>{t.account} →</Link> : null}</p> : null}
   {booking && shop ? <AppointmentForm shop={{ ...shop, items: detail && !shop.items.some(item => item.id === detail.id) ? [detail, ...shop.items] : shop.items }} selected={detail ? [detail.id] : []} profile={account} submission={submission} onBack={() => setBooking(false)} onSuccess={() => { setBooking(false); setMessage(t.requested); }}/> :
            detail ? <OutfitDetails outfit={detail} shop={shop} language={language} example={isExample} saved={saved.includes(detail.id)} busy={busy} onBack={() => setDetail(null)} onVisit={() => setBooking(true)} onToggle={() => void toggle(detail)}/> :
                <>{shop ? <BoutiqueAbout key={shop.slug} shop={shop} language={language} example={isExample} onVisit={() => setBooking(true)}/> : null}{!list ? <BoutiqueDirectory shops={shops} language={language} kind={kind} page={page} loading={loading} example={isExample} onKind={value => { if (value === kind) return; setKind(value); setPage(1); setShops([]); }} onPage={setPage}/> : <section id="boutique-collection"><p className="wm-boutique-script">{shop ? t.accent : t.boutiques}</p>{shop ? <h2 className="wm-boutique-collection-title">{t.collection}</h2> : <h1>{title}</h1>}
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
 </main>;
}
function AppointmentForm({ shop, selected, profile, submission, onBack, onSuccess }: {
    shop: Boutique;
    selected: string[];
    profile: State['profile'];
    submission: React.RefObject<{
        id: string;
        fingerprint: string;
    } | null>;
    onBack: () => void;
    onSuccess: () => void;
}) {
    const { language } = useLanguage(), t = boutiqueCopy[language];
    const { api: boutiqueApi, example: isExample } = useBoutiqueTransport();
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
    const lock = useRef(false);
    async function send(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (lock.current)
            return;
        const f = new FormData(event.currentTarget);
        const starts = costaRicaDateTime(String(f.get('date')), String(f.get('time')));
        if (!starts) {
            setError(t.error);
            return;
        }
        const data = { starts_at: starts, wedding_date: String(f.get('wedding') ?? ''), companions: Number(f.get('companions')), size_note: String(f.get('size') ?? ''), budget: String(f.get('budget') ?? ''), note: String(f.get('note') ?? ''), items: f.getAll('items').map(String), accepted: true, policies_version: shop.updated_at };
        const fingerprint = JSON.stringify(data);
        if (!submission.current || submission.current.fingerprint !== fingerprint)
            submission.current = { id: crypto.randomUUID(), fingerprint };
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            await boutiqueApi('/account', { action: 'request', vendor: shop.vendor_id, submission: submission.current.id, data });
            submission.current = null;
            onSuccess();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : t.error);
        }
        finally {
            lock.current = false;
            setBusy(false);
        }
    }
    return <section className="wm-boutique-appointment"><button className="btn btn-outline-secondary mb-4" onClick={onBack}>← {t.back}</button><p className="wm-boutique-script">{shop.name}</p><h1>{t.request}</h1><p>{t.confirmedOnly}</p><p>{t.timezone}</p><div className="wm-boutique-policy"><h2>{t.policies}</h2><p>{boutiqueText(shop.policies, language)}</p><p>{shop.duration_minutes} min · {shop.companions_max} {t.companions.toLowerCase()}</p><p>{shop.visit_fee_cents ? `${t.fee}: ${new Intl.NumberFormat(language, { style: 'currency', currency: shop.currency }).format(shop.visit_fee_cents / 100)}` : t.free}</p></div>
 {isExample&&profile?.role!=='user'?<p>{language==='es'?'Elige «Probar como pareja» para solicitar una cita.':'Choose “Try as couple” to request a fitting.'}</p>:!profile || profile.role !== 'user' ? <Link className="btn btn-primary" href={`/login?next=${encodeURIComponent('/boutiques/' + shop.slug)}`}>{t.signIn}</Link> : <form onSubmit={send} className="wm-boutique-form" aria-busy={busy}>
  <label>{t.date} *<input className="form-control" type="date" name="date" min={new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica' }).format(new Date())} required/></label><label>{t.time} *<input className="form-control" type="time" name="time" required/></label>
  <label>{t.wedding} · {t.optional}<input className="form-control" type="date" name="wedding" defaultValue={profile.tentative_wedding_date ?? ''}/></label><label>{t.companions}<select className="form-select" name="companions">{Array.from({ length: shop.companions_max + 1 }, (_, i) => <option key={i}>{i}</option>)}</select></label>
  <label>{t.size} · {t.optional}<input className="form-control" name="size" maxLength={300}/></label><label>{t.budget} · {t.optional}<input className="form-control" name="budget" maxLength={120}/></label>
  <fieldset className="wm-boutique-full"><legend>{t.selected} · {t.optional}</legend>{shop.items.map(item => <label className="form-check" key={item.id}><input type="checkbox" name="items" value={item.id} defaultChecked={selected.includes(item.id)}/>{boutiqueText(item.name, language)}</label>)}</fieldset>
  <label className="wm-boutique-full">{t.note} · {t.optional}<textarea className="form-control" name="note" maxLength={2000}/></label><label className="form-check wm-boutique-full"><input type="checkbox" required/>{t.accept} *</label>
  {error ? <p className="wm-boutique-full" role="alert">{error}</p> : null}<button className="btn btn-primary wm-boutique-full" disabled={busy}>{busy ? t.saving : t.send} →</button>
 </form>}</section>;
}
