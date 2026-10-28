'use client';
/* eslint-disable @next/next/no-img-element -- Owner media thumbnails use the existing admitted library. */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { boutiqueCopy } from '@/shared/boutiques/copy';
import { boutiqueText, outfitDetailKeys, type Outfit } from '@/shared/boutiques/types';
import { boutiqueApi } from './api';
type Workspace = {
    vendor: {
        id: string;
        slug: string;
        business_name: string;
        gallery_images: Record<string, unknown>[];
    };
    settings: {
        enabled: boolean;
        duration_minutes: number;
        companions_max: number;
        visit_fee_cents: number;
        currency: string;
        policies: {
            en: string;
            es: string;
        };
    } | null;
    items: Outfit[];
};
export default function BoutiqueManager() {
    const { language } = useLanguage(), t = boutiqueCopy[language];
    const [data, setData] = useState<Workspace | null>(null), [editing, setEditing] = useState<Outfit | null | undefined>(undefined), [kind, setKind] = useState<'dress' | 'suit'>('dress'), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [revision, setRevision] = useState(0);
    const lock = useRef(false);
    useEffect(() => { let active = true; void boutiqueApi<Workspace>('/account?mode=workspace').then(r => { if (active)
        setData(r); }).catch(() => { if (active)
        setMessage(t.error); }); return () => { active = false; }; }, [revision, t.error]);
    async function save(event: React.FormEvent<HTMLFormElement>, section: 'settings' | 'item') {
        event.preventDefault();
        if (!data || lock.current)
            return;
        const f = new FormData(event.currentTarget);
        const text = (key: string) => String(f.get(key) ?? '');
        const localized = (key: string) => ({ en: text(key + '_en'), es: text(key + '_es') });
        const payload = section === 'settings' ? { action: 'settings', vendor: data.vendor.id, data: { enabled: f.has('enabled'), duration_minutes: Number(f.get('duration_minutes')), companions_max: Number(f.get('companions_max')), visit_fee_cents: Math.round(Number(f.get('fee')) * 100), currency: text('currency'), policies: localized('policies') } } :
            { action: 'item', vendor: data.vendor.id, id: editing?.id ?? null, data: { kind, name: localized('name'), description: localized('description'), designer: text('designer'), reference: text('reference'), offer: text('offer'), details: Object.fromEntries(outfitDetailKeys[kind].map(key => [key, text('detail_' + key)])), sample_sizes: text('sample_sizes'), order_sizes: text('order_sizes'), lead_time: text('lead_time'), price_cents: text('price') === '' ? null : Math.round(Number(f.get('price')) * 100), currency: text('currency'), media_indexes: f.getAll('media').map(Number), is_published: f.has('is_published') } };
        lock.current = true;
        setBusy(true);
        setMessage('');
        try {
            await boutiqueApi('/account', payload);
            setMessage(t.saved);
            setEditing(undefined);
            setRevision(v => v + 1);
        }
        catch (e) {
            setMessage(e instanceof Error ? e.message : t.error);
        }
        finally {
            lock.current = false;
            setBusy(false);
        }
    }
    const input = (name: string, label: string, value: unknown = '', max = 300, type = 'text') => <label key={name}>{label}<input className="form-control" name={name} defaultValue={String(value ?? '')} type={type} maxLength={max}/></label>;
    if (!data)
        return <div className="wm-boutiques"><p role="status">{message || t.loading}</p></div>;
    return <main className="wm-boutiques"><h1>{t.management}</h1><p>{t.manageHint}</p><div className="wm-boutique-actions"><Link href={`/boutiques/${data.vendor.slug}`}>{t.visit} ↗</Link><Link href="/vendor/inbox/appointments">{t.appointments} ↗</Link></div>{message ? <p role="status" className="wm-boutique-notice">{message}</p> : null}
 <details className="wm-boutique-settings" open={!data.settings}><summary>{t.settings}</summary><form key={revision} onSubmit={e => void save(e, 'settings')} className="wm-boutique-form"><label className="form-check wm-boutique-full"><input type="checkbox" name="enabled" defaultChecked={data.settings?.enabled}/>{t.enabled}</label><label>{t.duration}<input className="form-control" type="number" name="duration_minutes" defaultValue={data.settings?.duration_minutes ?? 60} min={15} max={180} required/></label><label>{t.companionsMax}<input className="form-control" type="number" name="companions_max" defaultValue={data.settings?.companions_max ?? 2} min={0} max={10} required/></label><label>{t.fee}<input className="form-control" type="number" name="fee" defaultValue={(data.settings?.visit_fee_cents ?? 0) / 100} min={0} max={1000000} step="0.01" required/></label><label>{t.currency}<select className="form-select" name="currency" defaultValue={data.settings?.currency ?? 'CRC'}><option>CRC</option><option>USD</option></select></label>{(['en', 'es'] as const).map(lang => <label key={lang}>{lang === 'en' ? t.policyEn : t.policyEs}<textarea className="form-control" name={'policies_' + lang} defaultValue={data.settings?.policies[lang] ?? ''} maxLength={2500}/></label>)}<button className="btn btn-primary wm-boutique-full" disabled={busy}>{busy ? t.saving : t.settings}</button></form></details>
 {data.settings ? <><div className="wm-boutique-toolbar"><h2>{t.collection}</h2><button className="btn btn-primary" disabled={busy} onClick={() => { setEditing(null); setKind('dress'); }}>{t.add} +</button></div>{editing !== undefined ? <form key={editing?.id ?? 'new'} onSubmit={e => void save(e, 'item')} className="wm-boutique-form"><label>{t.title}<select className="form-select" value={kind} onChange={e => setKind(e.target.value as 'dress' | 'suit')}><option value="dress">{t.dress}</option><option value="suit">{t.suit}</option></select></label><label>{t.offer}<select className="form-select" name="offer" defaultValue={editing?.offer ?? 'purchase'}>{(['purchase', 'rental', 'both'] as const).map(v => <option key={v} value={v}>{t[v]}</option>)}</select></label>{(['en', 'es'] as const).map(lang => input('name_' + lang, `${t.name} · ${lang}`, editing?.name[lang], 160))}{(['en', 'es'] as const).map(lang => <label key={lang}>{t.description} · {lang}<textarea className="form-control" name={'description_' + lang} defaultValue={editing?.description[lang] ?? ''} maxLength={2500}/></label>)}{input('designer', t.designer, editing?.designer, 160)}{input('reference', t.reference, editing?.reference, 120)}{outfitDetailKeys[kind].map(key => input('detail_' + key, key === 'back' ? t.backDetail : t[key], editing?.details[key]))}{input('sample_sizes', t.sample, editing?.sample_sizes)}{input('order_sizes', t.sizes, editing?.order_sizes)}{input('lead_time', t.timeline, editing?.lead_time, 500)}<label>{t.outfitPrice}<input className="form-control" name="price" type="number" min={0} max={1000000} step="0.01" defaultValue={editing?.price_cents == null ? '' : editing.price_cents / 100}/></label><label>{t.currency}<select className="form-select" name="currency" defaultValue={editing?.currency ?? 'CRC'}><option>CRC</option><option>USD</option></select></label><fieldset className="wm-boutique-full"><legend>{t.media}</legend><p>{t.mediaHint}</p><Link href="/vendor/profile">{t.media} ↗</Link><div className="wm-boutique-media-picker">{(data.vendor.gallery_images ?? []).map((asset, index) => <label key={index}><input type="checkbox" name="media" value={index} defaultChecked={editing?.media.some(m => JSON.stringify(m) === JSON.stringify(asset))}/>{asset.type === 'video' ? <span>▶ {index + 1}</span> : typeof asset.url === 'string' ? <img src={asset.url} alt={`${t.media} ${index + 1}`}/> : <span>{index + 1}</span>}</label>)}</div></fieldset><label className="form-check wm-boutique-full"><input type="checkbox" name="is_published" defaultChecked={editing?.is_published}/>{t.publish}</label><div className="wm-boutique-actions wm-boutique-full"><button className="btn btn-primary" disabled={busy}>{busy ? t.saving : t.add}</button><button className="btn btn-outline-secondary" type="button" disabled={busy} onClick={() => setEditing(undefined)}>{t.back}</button></div></form> : null}<div className="wm-boutique-appointments">{data.items.map(i => <button key={i.id} className="wm-boutique-appointment-row" disabled={busy} onClick={() => { setEditing(i); setKind(i.kind); }}><span><strong>{boutiqueText(i.name, language)}</strong><span>{t[i.kind]} · {i.is_published ? t.publish : t.edit}</span></span><span>{t.edit} →</span></button>)}</div></> : null}
 </main>;
}
