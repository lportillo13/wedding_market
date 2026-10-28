import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { boutiqueCopy } from '../../../../shared/boutiques/copy';
import { boutiqueText, costaRicaDateTime, type Boutique } from '../../../../shared/boutiques/types';
import { QuoteDateCalendar } from '../../ui/calendars';
import { SectionPicker } from '../../ui/SectionPicker';
import { createSubmissionId } from '../../lib/quoteUtils';
import { useBoutiqueNativeTransport } from './transport';
import { BoutiqueButton, BoutiqueField, BoutiqueCheck, boutiqueStyles as s } from './ui';
export function BoutiqueAppointmentForm({ language, shop, selected, role, onBack, onSignIn, onSuccess }: {
    language: 'en' | 'es';
    shop: Boutique;
    selected: string[];
    role: string;
    onBack: () => void;
    onSignIn: () => void;
    onSuccess: () => void;
}) {
    const t = boutiqueCopy[language];
    const { api: boutiqueRequest, example: isExample } = useBoutiqueNativeTransport();
    const [date, setDate] = useState(''), [time, setTime] = useState(''), [wedding, setWedding] = useState(''), [companions, setCompanions] = useState('0'), [size, setSize] = useState(''), [budget, setBudget] = useState(''), [note, setNote] = useState(''), [accepted, setAccepted] = useState(false), [items, setItems] = useState(selected), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const submission = useRef<{
        id: string;
        fingerprint: string;
    } | null>(null), lock = useRef(false);
    useEffect(() => {
        let active = true;
        if (role === 'client')
            void boutiqueRequest<{
                profile: {
                    tentative_wedding_date: string | null;
                };
            }>('/account?mode=state').then(r => {
                if (active && r.profile?.tentative_wedding_date)
                    setWedding(r.profile.tentative_wedding_date);
            }).catch(() => { });
        return () => { active = false; };
    }, [role, boutiqueRequest]);
    async function send() {
        if (lock.current)
            return;
        const starts = costaRicaDateTime(date, time);
        if (!starts || !accepted || items.length > 5) {
            setError(`${t.date} / ${t.time} / ${t.accept}`);
            return;
        }
        const data = { starts_at: starts, wedding_date: wedding, companions: Number(companions), size_note: size, budget, note, items, accepted: true, policies_version: shop.updated_at };
        const fingerprint = JSON.stringify(data);
        if (!submission.current || submission.current.fingerprint !== fingerprint)
            submission.current = { id: createSubmissionId(), fingerprint };
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            await boutiqueRequest('/account', { action: 'request', vendor: shop.vendor_id, submission: submission.current.id, data });
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
    const times = Array.from({ length: 48 }, (_, i) => { const value = `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`; return { key: value, label: value }; });
    return <View style={s.root}><BoutiqueButton title={'← ' + t.back} onPress={onBack} secondary disabled={busy}/><Text style={s.script}>{shop.name}</Text><Text style={s.title}>{t.request}</Text><Text style={s.body}>{t.confirmedOnly}</Text><Text style={s.muted}>{t.timezone}</Text><View style={s.policy}><Text style={s.heading}>{t.policies}</Text><Text style={s.body}>{boutiqueText(shop.policies, language)}</Text><Text style={s.body}>{shop.duration_minutes} min · {shop.companions_max} {t.companions.toLowerCase()}</Text><Text style={s.body}>{shop.visit_fee_cents ? `${t.fee}: ${new Intl.NumberFormat(language, { style: 'currency', currency: shop.currency }).format(shop.visit_fee_cents / 100)}` : t.free}</Text></View>
 {isExample&&role!=='client'?<Text style={s.body}>{language==='es'?'Elige «Como pareja» para solicitar una cita.':'Choose “As couple” to request a fitting.'}</Text>:role !== 'client' ? <BoutiqueButton title={t.signIn} onPress={onSignIn}/> : <><Text style={s.body}>{t.date} *</Text><QuoteDateCalendar value={date} language={language} onChange={setDate}/><SectionPicker value={time} options={[{ key: '', label: t.time + ' *' }, ...times]} label={t.time + ' *'} closeLabel={t.back} onChange={setTime} disabled={busy}/><Text style={s.body}>{t.wedding} · {t.optional}</Text><QuoteDateCalendar value={wedding} language={language} onChange={setWedding}/><SectionPicker value={companions} options={Array.from({ length: shop.companions_max + 1 }, (_, i) => ({ key: String(i), label: String(i) }))} label={t.companions} closeLabel={t.back} onChange={setCompanions} disabled={busy}/><BoutiqueField label={t.size + ' · ' + t.optional} value={size} onChangeText={setSize} maxLength={300}/><BoutiqueField label={t.budget + ' · ' + t.optional} value={budget} onChangeText={setBudget} maxLength={120}/><Text style={s.heading}>{t.selected} · {t.optional}</Text>{shop.items.map(item => <BoutiqueCheck key={item.id} label={boutiqueText(item.name, language)} value={items.includes(item.id)} onChange={() => setItems(old => old.includes(item.id) ? old.filter(id => id !== item.id) : old.length < 5 ? [...old, item.id] : old)}/>)}<BoutiqueField label={t.note + ' · ' + t.optional} value={note} onChangeText={setNote} multiline maxLength={2000}/><BoutiqueCheck label={t.accept + ' *'} value={accepted} onChange={() => setAccepted(v => !v)}/>{error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}<BoutiqueButton title={busy ? t.saving : t.send + ' →'} onPress={() => void send()} disabled={busy}/></>}
 </View>;
}
