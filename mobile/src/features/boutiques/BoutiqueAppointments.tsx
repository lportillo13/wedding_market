import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Text, TouchableOpacity, View } from 'react-native';
import { boutiqueCopy } from '../../../../shared/boutiques/copy';
import { appointmentLabel, boutiqueText, type BoutiqueAppointment } from '../../../../shared/boutiques/types';
import { createSubmissionId } from '../../lib/quoteUtils';
import { useBoutiqueNativeTransport } from './transport';
import { BoutiqueButton, BoutiqueField, boutiqueStyles as s } from './ui';
export function BoutiqueAppointments({ language, vendor, onBack }: {
    language: 'en' | 'es';
    vendor: boolean;
    onBack: () => void;
}) {
    const t = boutiqueCopy[language];
    const { api: boutiqueRequest } = useBoutiqueNativeTransport();
    const [items, setItems] = useState<BoutiqueAppointment[]>([]), [selected, setSelected] = useState<BoutiqueAppointment | null>(null), [page, setPage] = useState(1), [note, setNote] = useState(''), [body, setBody] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const lastRefresh = useRef(0);
    const selectedId = useRef<string | null>(null), inFlight = useRef(false), alive = useRef(true), lock = useRef(false), reply = useRef<{
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
            const r = await boutiqueRequest<{
                items: BoutiqueAppointment[];
            }>(`/account?mode=appointments&page=${target ? 1 : page}${target ? '&id=' + target : ''}`);
            if (alive.current && target === selectedId.current) {
                if (selectedId.current)
                    setSelected(r.items[0] ?? null);
                else
                    setItems(r.items);
            }
        }
        catch {
            if (alive.current)
                setError(t.error);
        }
        finally {
            inFlight.current = false;
        }
    }, [page, t.error, boutiqueRequest]);
    useEffect(() => {
        alive.current = true;
        void load();
        const refresh = () => {
            if (AppState.currentState === 'active' && !lock.current && Date.now() - lastRefresh.current >= 5000)
                void load();
        };
        const timer = setInterval(refresh, 45000);
        const sub = AppState.addEventListener('change', state => {
            if (state === 'active')
                refresh();
        });
        return () => { alive.current = false; clearInterval(timer); sub.remove(); };
    }, [load]);
    async function decide(status: 'confirmed' | 'declined' | 'cancelled') {
        if (!selected || lock.current)
            return;
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            await boutiqueRequest('/account', { action: 'decide', id: selected.id, status, version: selected.version, note });
            await load();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : t.error);
        }
        finally {
            lock.current = false;
            setBusy(false);
        }
    }
    async function send() {
        if (!selected || lock.current || !body.trim())
            return;
        const value = body.trim();
        if (!reply.current || reply.current.body !== value || reply.current.thread !== selected.id)
            reply.current = { id: createSubmissionId(), body: value, thread: selected.id };
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            await boutiqueRequest('/account', { action: 'reply', id: selected.id, submission: reply.current.id, body: value });
            setBody('');
            reply.current = null;
            await load();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : t.error);
        }
        finally {
            lock.current = false;
            setBusy(false);
        }
    }
    return <View style={s.root}><BoutiqueButton title={'← ' + t.back} secondary disabled={busy} onPress={() => {
            if (selected) {
                selectedId.current = null;
                setSelected(null);
                setBody('');
                void load();
            }
            else
                onBack();
        }}/><Text style={s.title}>{t.appointments}</Text><Text style={s.muted}>{t.timezone}</Text><BoutiqueButton title={t.refresh} secondary disabled={busy} onPress={() => void load()}/>{error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}
 {selected ? <><Text style={s.heading}>{selected.vendor_name}</Text>{vendor ? <Text style={s.body}>{selected.client_name}</Text> : null}<Text style={s.body}>{appointmentLabel(selected.starts_at, language)} · {selected.duration_minutes} min</Text><View style={s.status}><Text style={s.muted}>{t[selected.status]}</Text></View>{[[t.wedding, selected.wedding_date], [t.companions, String(selected.companions)], [t.size, selected.size_note], [t.budget, selected.budget], [t.note, selected.note]].filter(([, v]) => v).map(([label, value]) => <Text key={label} style={s.body}>{label}: {value}</Text>)}<Text style={s.body}>{selected.items_snapshot.map(i => boutiqueText(i.name, language)).join(' · ') || t.general}</Text><View style={s.policy}><Text style={s.heading}>{t.policies}</Text><Text style={s.body}>{boutiqueText(selected.policies_snapshot.policies, language)}</Text><Text style={s.body}>{selected.policies_snapshot.visit_fee_cents ? new Intl.NumberFormat(language, { style: 'currency', currency: selected.policies_snapshot.currency }).format(selected.policies_snapshot.visit_fee_cents / 100) : t.free}</Text></View>{selected.store_note ? <Text style={s.body}>{t.storeNote}: {selected.store_note}</Text> : null}
 {vendor && selected.status === 'requested' ? <><BoutiqueField label={t.storeNote + ' · ' + t.optional} value={note} onChangeText={setNote} maxLength={2000} multiline/><BoutiqueButton title={t.confirm} disabled={busy} onPress={() => void decide('confirmed')}/><BoutiqueButton title={t.decline} secondary disabled={busy} onPress={() => void decide('declined')}/></> : null}{['requested', 'confirmed'].includes(selected.status) ? <BoutiqueButton title={t.cancel} secondary disabled={busy} onPress={() => void decide('cancelled')}/> : null}
 <View style={s.section}><Text style={s.heading}>{t.messages}</Text>{selected.messages?.length ? selected.messages.map(m => <View key={m.id} style={s.appointment}><Text style={s.muted}>{appointmentLabel(m.created_at, language)}</Text><Text style={s.body}>{m.body}</Text></View>) : <Text style={s.muted}>{t.noMessages}</Text>}<BoutiqueField label={t.message} value={body} onChangeText={setBody} multiline maxLength={2000}/><BoutiqueButton title={t.reply} disabled={busy} onPress={() => void send()}/></View></> :
            <>{items.map(a => <TouchableOpacity key={a.id} style={s.appointment} accessibilityRole="button" disabled={busy} onPress={() => {
                        if (inFlight.current)
                            return;
                        selectedId.current = a.id;
                        setBody('');
                        setNote('');
                        setError('');
                        void load();
                    }}><Text style={s.heading}>{a.vendor_name}</Text>{vendor ? <Text style={s.body}>{a.client_name}</Text> : null}<Text style={s.body}>{appointmentLabel(a.starts_at, language)}</Text><View style={s.status}><Text style={s.muted}>{t[a.status]}</Text></View></TouchableOpacity>)}{!items.length ? <Text style={s.muted}>{t.noAppointments}</Text> : null}<View style={s.row}>{page > 1 ? <BoutiqueButton title={t.previous} secondary onPress={() => setPage(p => p - 1)}/> : null}{items.length === 12 ? <BoutiqueButton title={t.next} secondary onPress={() => setPage(p => p + 1)}/> : null}</View></>}
 </View>;
}
