'use client';
/* eslint-disable @next/next/no-img-element -- Reuse admitted boutique media without another optimizer cache. */
import Link from 'next/link';
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import HeaderIcon from '@/components/HeaderIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { resolveMediaUrl } from '@/lib/media-url';
import { boutiqueCopy } from '@/shared/boutiques/copy';
import { boutiqueText, costaRicaDateTime, type Boutique, type Outfit } from '@/shared/boutiques/types';
import { useBoutiqueTransport } from './transport';

export type VisitProfile = { role: string; tentative_wedding_date: string | null; wedding_budget: number | null } | null;
export type VisitSubmission = { id: string; fingerprint: string } | null;

export default function BoutiqueVisitPanel({ shop, selectedOutfit, profile, submission, onClose, onSuccess }: {
    shop: Boutique; selectedOutfit: Outfit | null; profile: VisitProfile; submission: RefObject<VisitSubmission>;
    onClose: () => void; onSuccess: () => void;
}) {
    const { language } = useLanguage(), t = boutiqueCopy[language];
    const { api: boutiqueApi, example } = useBoutiqueTransport();
    const dialog = useRef<HTMLDialogElement>(null), closeButton = useRef<HTMLButtonElement>(null), lock = useRef(false);
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [failedLogo, setFailedLogo] = useState<string | null>(null), [failedBanner, setFailedBanner] = useState(false);
    const [selection, setSelection] = useState<string[]>(selectedOutfit ? [selectedOutfit.id] : []);
    const titleId = useId(), hintId = useId(), formId = useId();
    const canRequest = profile?.role === 'user';
    const options = selectedOutfit && !shop.items.some(item => item.id === selectedOutfit.id) ? [selectedOutfit, ...shop.items] : shop.items;
    const initials = shop.name.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toLocaleUpperCase(language);
    const banner = selectedOutfit?.images[0] ?? shop.hero ?? '/images/boutique-directory-atelier.webp';
    const loginPath = `/boutiques/${shop.slug}${selectedOutfit ? `?outfit=${selectedOutfit.id}` : ''}`;

    useEffect(() => {
        const element = dialog.current;
        if (!element) return;
        const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const root = document.documentElement;
        const previous = { bodyOverflow: document.body.style.overflow, rootOverflow: root.style.overflow, gutter: root.style.scrollbarGutter };
        root.style.scrollbarGutter = 'stable';
        root.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        const onBackdrop = (event: MouseEvent) => {
            if (event.target !== element || lock.current) return;
            const box = element.getBoundingClientRect();
            if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;
            const controls = [...element.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,summary,[tabindex]')]
                .filter(control => control.tabIndex >= 0 && !control.matches(':disabled') && control.getClientRects().length > 0);
            const first = controls[0], last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        };
        element.addEventListener('click', onBackdrop);
        element.addEventListener('keydown', onKeyDown);
        element.showModal();
        closeButton.current?.focus({ preventScroll: true });
        return () => {
            element.removeEventListener('click', onBackdrop);
            element.removeEventListener('keydown', onKeyDown);
            element.close();
            root.style.overflow = previous.rootOverflow;
            root.style.scrollbarGutter = previous.gutter;
            document.body.style.overflow = previous.bodyOverflow;
            if (trigger?.isConnected) trigger.focus({ preventScroll: true });
        };
    }, [onClose]);

    async function send(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (lock.current || !canRequest) return;
        const f = new FormData(event.currentTarget);
        const starts = costaRicaDateTime(String(f.get('date')), String(f.get('time')));
        if (!starts) { setError(t.error); return; }
        if (f.get('accepted') !== 'on') return;
        const data = { starts_at: starts, wedding_date: String(f.get('wedding') ?? ''), companions: Number(f.get('companions')), size_note: String(f.get('size') ?? ''), budget: String(f.get('budget') ?? ''), note: String(f.get('note') ?? ''), items: f.getAll('items').map(String), accepted: true, policies_version: shop.updated_at };
        const fingerprint = JSON.stringify(data);
        if (!submission.current || submission.current.fingerprint !== fingerprint) submission.current = { id: crypto.randomUUID(), fingerprint };
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            await boutiqueApi('/account', { action: 'request', vendor: shop.vendor_id, submission: submission.current.id, data });
            submission.current = null;
            onSuccess();
        } catch (e) { setError(e instanceof Error ? e.message : t.error); }
        finally { lock.current = false; setBusy(false); }
    }

    return <dialog ref={dialog} className="wm-visit-panel" aria-labelledby={titleId} aria-describedby={hintId}
        onCancel={event => { event.preventDefault(); if (!lock.current) onClose(); }}>
        <div className="wm-visit-panel__cover">
            {!failedBanner ? <img src={banner} alt="" width={600} height={160} onError={() => setFailedBanner(true)}/> : null}
            <span className="wm-visit-panel__handle" aria-hidden="true"/>
            <button ref={closeButton} type="button" className="wm-visit-panel__close" aria-label={t.visitClose} disabled={busy} onClick={onClose}><HeaderIcon name="close"/></button>
        </div>
        <form id={formId} className="wm-visit-panel__form" onSubmit={send} aria-busy={busy}>
            <div className="wm-visit-panel__body">
                <div className="wm-visit-panel__brand">
                    <div className="wm-visit-panel__logo" aria-hidden="true">{shop.logo && failedLogo !== shop.logo ? <img src={resolveMediaUrl(shop.logo)} alt="" width={48} height={48} loading="lazy" onError={() => setFailedLogo(shop.logo)}/> : initials}</div>
                    <div><p>{shop.name}</p><span>{[shop.city, shop.region].filter(Boolean).join(' · ')}</span></div>
                </div>
                <h2 id={titleId}>{t.visitHeading}</h2>
                <p className="wm-visit-panel__intro">{t.visitIntro}</p>
                {selectedOutfit ? <div className="wm-visit-panel__outfit">
                    {selectedOutfit.images[0] ? <img src={selectedOutfit.images[0]} alt="" width={48} height={64}/> : null}
                    <div><span>{t.visitOutfit}</span><p>{boutiqueText(selectedOutfit.name, language)}</p></div>
                </div> : null}
                {canRequest ? <>
                    <div className="wm-visit-panel__dates">
                        <label>{t.date} *<input className="form-control" type="date" name="date" min={new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica' }).format(new Date())} required/></label>
                        <label>{t.time} *<input className="form-control" type="time" name="time" required/></label>
                    </div>
                    <p className="wm-visit-panel__timezone">{t.timezone}</p>
                    <label className="wm-visit-panel__field">{t.companions}<select className="form-select" name="companions">{Array.from({ length: shop.companions_max + 1 }, (_, i) => <option key={i}>{i}</option>)}</select></label>
                    <label className="wm-visit-panel__field">{t.size} · {t.optional}<input className="form-control" name="size" maxLength={300}/></label>
                    <details className="wm-visit-panel__fold">
                        <summary>{t.visitMore} · {t.optional}<HeaderIcon name="chevron"/></summary>
                        <div className="wm-visit-panel__extras">
                            <label>{t.wedding} · {t.optional}<input className="form-control" type="date" name="wedding" defaultValue={profile?.tentative_wedding_date ?? ''}/></label>
                            <label>{t.budget} · {t.optional}<input className="form-control" name="budget" maxLength={120}/></label>
                            <fieldset><legend>{t.selected} · {t.optional}</legend><p>{t.visitSelectionLimit}</p>{options.map(item => <label className="wm-visit-panel__check" key={item.id}><input type="checkbox" name="items" value={item.id} checked={selection.includes(item.id)} disabled={!selection.includes(item.id) && selection.length >= 5} onChange={event => setSelection(previous => event.target.checked ? [...previous, item.id] : previous.filter(id => id !== item.id))}/><span>{boutiqueText(item.name, language)}</span></label>)}</fieldset>
                            <label>{t.note} · {t.optional}<textarea className="form-control" name="note" rows={3} maxLength={2000}/></label>
                        </div>
                    </details>
                </> : null}
                <details className="wm-visit-panel__fold wm-visit-panel__policies">
                    <summary><span>{t.policies}<small>{shop.duration_minutes} min · {shop.companions_max} {t.companions.toLowerCase()}<br/>{shop.visit_fee_cents ? `${t.fee}: ${new Intl.NumberFormat(language, { style: 'currency', currency: shop.currency }).format(shop.visit_fee_cents / 100)}` : t.free}</small></span><HeaderIcon name="chevron"/></summary>
                    <p>{boutiqueText(shop.policies, language)}</p>
                </details>
                {canRequest ? <label className="wm-visit-panel__check wm-visit-panel__consent"><input type="checkbox" name="accepted" required/><span>{t.accept} *</span></label> : example ? <p className="wm-visit-panel__account">{t.visitExampleAccount}</p> : null}
            </div>
            <footer className="wm-visit-panel__footer">
                {error ? <p className="wm-visit-panel__error" role="alert">{error}</p> : null}
                {canRequest ? <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? t.saving : t.send}<HeaderIcon name="arrow"/></button> : !example ? <Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(loginPath)}`}>{t.signIn}<HeaderIcon name="arrow"/></Link> : null}
                <p id={hintId}>{t.confirmedOnly}</p>
            </footer>
        </form>
    </dialog>;
}
