'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { boutiqueCopy } from '@/shared/boutiques/copy';
import { appointmentLabel, boutiqueText, type BoutiqueAppointment } from '@/shared/boutiques/types';
import { useBoutiqueTransport } from './transport';
export function AppointmentInboxLink({ vendor = false }: {
    vendor?: boolean;
}) { const { language } = useLanguage(); return <div className="wm-boutique-inbox-link"><Link href={`${vendor ? '/vendor' : '/account'}/inbox/appointments`}>{boutiqueCopy[language].appointments} ↗</Link>{vendor ? <Link href="/vendor/boutique">{boutiqueCopy[language].management} ↗</Link> : null}</div>; }
export default function AppointmentInbox({ vendor = false }: {
    vendor?: boolean;
}) {
    const { language } = useLanguage(), t = boutiqueCopy[language];
    const { api: boutiqueApi, example: isExample } = useBoutiqueTransport();
    const [items, setItems] = useState<BoutiqueAppointment[]>([]), [selected, setSelected] = useState<BoutiqueAppointment | null>(null), [page, setPage] = useState(1), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [note, setNote] = useState(''), [body, setBody] = useState('');
    const lastRefresh = useRef(0);
    const selectedId = useRef<string | null>(null), inFlight = useRef(false), mounted = useRef(true), reply = useRef<{
        id: string;
        body: string;
        thread: string;
    } | null>(null);
    const load = useCallback(async () => {
        if (inFlight.current)
            return;
        inFlight.current = true;
        lastRefresh.current = Date.now();
        const target = selectedId.current;
        try {
            const r = await boutiqueApi<{
                items: BoutiqueAppointment[];
            }>(`/account?mode=appointments&page=${target ? 1 : page}${target ? '&id=' + target : ''}`);
            if (!mounted.current || target !== selectedId.current)
                return;
            if (selectedId.current)
                setSelected(r.items[0] ?? null);
            else
                setItems(r.items);
        }
        catch {
            if (mounted.current)
                setMessage(t.error);
        }
        finally {
            inFlight.current = false;
        }
    }, [page, t.error, boutiqueApi]);
    useEffect(() => {
        mounted.current = true;
        void load();
        const refresh = () => {
            if (document.visibilityState === 'visible' && Date.now() - lastRefresh.current >= 5000)
                void load();
        };
        const timer = setInterval(refresh, 45000);
        document.addEventListener('visibilitychange', refresh);
        return () => { mounted.current = false; clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
    }, [load]);
    async function open(id: string) {
        if (busy || inFlight.current)
            return;
        selectedId.current = id;
        setBody('');
        setNote('');
        setMessage('');
        await load();
    }
    async function decide(status: 'confirmed' | 'declined' | 'cancelled') {
        if (!selected || busy)
            return;
        setBusy(true);
        setMessage('');
        try {
            await boutiqueApi('/account', { action: 'decide', id: selected.id, status, version: selected.version, note });
            await load();
        }
        catch (e) {
            setMessage(e instanceof Error ? e.message : t.error);
        }
        finally {
            setBusy(false);
        }
    }
    async function send(e: React.FormEvent) {
        e.preventDefault();
        if (!selected || busy || !body.trim())
            return;
        const value = body.trim();
        if (!reply.current || reply.current.body !== value || reply.current.thread !== selected.id)
            reply.current = { id: crypto.randomUUID(), body: value, thread: selected.id };
        setBusy(true);
        setMessage('');
        try {
            await boutiqueApi('/account', { action: 'reply', id: selected.id, submission: reply.current.id, body: value });
            setBody('');
            reply.current = null;
            await load();
        }
        catch (e) {
            setMessage(e instanceof Error ? e.message : t.error);
        }
        finally {
            setBusy(false);
        }
    }
    return <main className="container py-4 wm-boutiques"><Link href={isExample ? '/boutiques?examples=1' : `${vendor ? '/vendor' : '/account'}/inbox`}>← {t.messages}</Link><div className="wm-boutique-toolbar"><h1>{t.appointments}</h1><button className="btn btn-outline-secondary" disabled={busy} onClick={() => void load()}>{t.refresh}</button></div><p>{t.timezone}</p>{message ? <p role="alert">{message}</p> : null}
 {selected ? <section className="wm-boutique-appointment"><button className="btn btn-outline-secondary mb-3" disabled={busy} onClick={() => { selectedId.current = null; setSelected(null); setBody(''); void load(); }}>← {t.back}</button><h2>{selected.vendor_name}</h2><p>{vendor ? selected.client_name : null}</p><p>{appointmentLabel(selected.starts_at, language)} · {selected.duration_minutes} min</p><span className="wm-boutique-status">{t[selected.status]}</span><dl className="wm-boutique-request-details">{[[t.wedding, selected.wedding_date], [t.companions, String(selected.companions)], [t.size, selected.size_note], [t.budget, selected.budget], [t.note, selected.note]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p>{selected.items_snapshot.map(item => boutiqueText(item.name, language)).join(' · ') || t.general}</p><div className="wm-boutique-policy"><h3>{t.policies}</h3><p>{boutiqueText(selected.policies_snapshot.policies, language)}</p><p>{selected.policies_snapshot.visit_fee_cents ? new Intl.NumberFormat(language, { style: 'currency', currency: selected.policies_snapshot.currency }).format(selected.policies_snapshot.visit_fee_cents / 100) : t.free}</p></div>{selected.store_note ? <p>{t.storeNote}: {selected.store_note}</p> : null}
 {vendor && selected.status === 'requested' ? <label className="d-block mb-3">{t.storeNote} · {t.optional}<textarea className="form-control" value={note} onChange={e => setNote(e.target.value)} maxLength={2000}/></label> : null}
 <div className="wm-boutique-actions">{vendor && selected.status === 'requested' ? <><button className="btn btn-primary" disabled={busy} onClick={() => void decide('confirmed')}>{t.confirm}</button><button className="btn btn-outline-secondary" disabled={busy} onClick={() => void decide('declined')}>{t.decline}</button></> : null}{['requested', 'confirmed'].includes(selected.status) ? <button className="btn btn-outline-secondary" disabled={busy} onClick={() => void decide('cancelled')}>{t.cancel}</button> : null}</div>
 <section className="wm-boutique-messages"><h2>{t.messages}</h2>{selected.messages?.length ? selected.messages.map(m => <article key={m.id}><time>{appointmentLabel(m.created_at, language)}</time><p>{m.body}</p></article>) : <p>{t.noMessages}</p>}<form onSubmit={send}><label className="d-block">{t.message}<textarea className="form-control" value={body} onChange={e => setBody(e.target.value)} maxLength={2000} required/></label><button className="btn btn-primary mt-3" disabled={busy}>{t.reply}</button></form></section>
 </section> : <><div className="wm-boutique-appointments">{items.map(a => <button key={a.id} className="wm-boutique-appointment-row" onClick={() => void open(a.id)}><span><strong>{a.vendor_name}</strong>{vendor ? <span>{a.client_name}</span> : null}<span>{appointmentLabel(a.starts_at, language)}</span></span><span className="wm-boutique-status">{t[a.status]}</span></button>)}</div>{!items.length ? <p>{t.noAppointments}</p> : null}<div className="wm-boutique-actions mt-4">{page > 1 ? <button className="btn btn-outline-secondary" onClick={() => setPage(p => p - 1)}>{t.previous}</button> : null}{items.length === 12 ? <button className="btn btn-outline-secondary" onClick={() => setPage(p => p + 1)}>{t.next}</button> : null}</div></>}
 </main>;
}
