import { useEffect, useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { boutiqueCopy } from '../../../../shared/boutiques/copy';
import { boutiqueText, outfitDetailKeys, type Outfit } from '../../../../shared/boutiques/types';
import { SectionPicker } from '../../ui/SectionPicker';
import { boutiqueRequest } from './api';
import { BoutiqueButton, BoutiqueField, BoutiqueCheck, boutiqueStyles as s } from './ui';
type Workspace = {
    vendor: {
        id: string;
        slug: string;
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
export function BoutiqueManager({ language, onBack }: {
    language: 'en' | 'es';
    onBack: () => void;
}) {
    const t = boutiqueCopy[language];
    const [data, setData] = useState<Workspace | null>(null), [settings, setSettings] = useState<Record<string, string>>({}), [fields, setFields] = useState<Record<string, string>>({}), [editing, setEditing] = useState<Outfit | null | undefined>(undefined), [kind, setKind] = useState<'dress' | 'suit'>('dress'), [media, setMedia] = useState<number[]>([]), [published, setPublished] = useState(false), [enabled, setEnabled] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [revision, setRevision] = useState(0), [showSettings, setShowSettings] = useState(false);
    const lock = useRef(false);
    useEffect(() => { let active = true; void boutiqueRequest<Workspace>('/account?mode=workspace').then(r => { if (!active)
        return; setData(r); setEnabled(r.settings?.enabled ?? false); setSettings({ duration: String(r.settings?.duration_minutes ?? 60), companions: String(r.settings?.companions_max ?? 2), fee: String((r.settings?.visit_fee_cents ?? 0) / 100), currency: r.settings?.currency ?? 'CRC', policies_en: r.settings?.policies.en ?? '', policies_es: r.settings?.policies.es ?? '' }); setShowSettings(!r.settings); }).catch(() => { if (active)
        setError(t.error); }); return () => { active = false; }; }, [revision, t.error]);
    function edit(item: Outfit | null) { setEditing(item); setKind(item?.kind ?? 'dress'); setPublished(item?.is_published ?? false); setFields({ name_en: item?.name.en ?? '', name_es: item?.name.es ?? '', description_en: item?.description.en ?? '', description_es: item?.description.es ?? '', designer: item?.designer ?? '', reference: item?.reference ?? '', offer: item?.offer ?? 'purchase', sample_sizes: item?.sample_sizes ?? '', order_sizes: item?.order_sizes ?? '', lead_time: item?.lead_time ?? '', price: item?.price_cents == null ? '' : String(item.price_cents / 100), currency: item?.currency ?? 'CRC', ...(item?.details ?? {}) }); setMedia((data?.vendor.gallery_images ?? []).flatMap((asset, index) => item?.media.some(m => JSON.stringify(m) === JSON.stringify(asset)) ? [index] : [])); setError(''); }
    async function save(section: 'settings' | 'item') {
        if (!data || lock.current)
            return;
        const payload = section === 'settings' ? { action: 'settings', vendor: data.vendor.id, data: { enabled, duration_minutes: Number(settings.duration), companions_max: Number(settings.companions), visit_fee_cents: Math.round(Number(settings.fee) * 100), currency: settings.currency, policies: { en: settings.policies_en, es: settings.policies_es } } } :
            { action: 'item', vendor: data.vendor.id, id: editing?.id ?? null, data: { kind, name: { en: fields.name_en, es: fields.name_es }, description: { en: fields.description_en, es: fields.description_es }, designer: fields.designer, reference: fields.reference, offer: fields.offer, details: Object.fromEntries(outfitDetailKeys[kind].map(key => [key, fields[key] ?? ''])), sample_sizes: fields.sample_sizes, order_sizes: fields.order_sizes, lead_time: fields.lead_time, price_cents: fields.price ? Math.round(Number(fields.price) * 100) : null, currency: fields.currency, media_indexes: media, is_published: published } };
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            await boutiqueRequest('/account', payload);
            setEditing(undefined);
            setError(t.saved);
            setRevision(v => v + 1);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : t.error);
        }
        finally {
            lock.current = false;
            setBusy(false);
        }
    }
    const field = (key: string, label: string, max = 300) => <BoutiqueField key={key} label={label} value={fields[key] ?? ''} onChangeText={value => setFields(old => ({ ...old, [key]: value }))} maxLength={max}/>;
    const setting = (key: string, label: string, numeric = false) => <BoutiqueField key={key} label={label} value={settings[key] ?? ''} onChangeText={value => setSettings(old => ({ ...old, [key]: value }))} keyboardType={numeric ? 'decimal-pad' : 'default'} maxLength={numeric ? 12 : 2500} multiline={!numeric && key.startsWith('policies')}/>;
    return <View style={s.root}><BoutiqueButton title={'← ' + t.back} secondary disabled={busy} onPress={() => { if (editing !== undefined)
        setEditing(undefined);
    else
        onBack(); }}/><Text style={s.title}>{t.management}</Text><Text style={s.muted}>{t.manageHint}</Text>{error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}{!data ? <Text style={s.body}>{t.loading}</Text> : <>
 <BoutiqueButton title={t.settings} secondary onPress={() => setShowSettings(v => !v)}/>{showSettings ? <View style={s.section}><BoutiqueCheck label={t.enabled} value={enabled} onChange={() => setEnabled(v => !v)}/>{setting('duration', t.duration, true)}{setting('companions', t.companionsMax, true)}{setting('fee', t.fee, true)}<SectionPicker value={settings.currency ?? 'CRC'} options={[{ key: 'CRC', label: 'CRC' }, { key: 'USD', label: 'USD' }]} label={t.currency} closeLabel={t.back} onChange={value => setSettings(old => ({ ...old, currency: value }))}/>{setting('policies_en', t.policyEn)}{setting('policies_es', t.policyEs)}<BoutiqueButton title={busy ? t.saving : t.settings} disabled={busy} onPress={() => void save('settings')}/></View> : null}
 {data.settings ? <><BoutiqueButton title={t.add + ' +'} disabled={busy} onPress={() => edit(null)}/>{editing !== undefined ? <View style={s.section}><SectionPicker value={kind} options={[{ key: 'dress', label: t.dress }, { key: 'suit', label: t.suit }]} label={t.title} closeLabel={t.back} onChange={setKind}/><SectionPicker value={fields.offer ?? 'purchase'} options={(['purchase', 'rental', 'both'] as const).map(key => ({ key, label: t[key] }))} label={t.offer} closeLabel={t.back} onChange={value => setFields(old => ({ ...old, offer: value }))}/>{field('name_en', t.name + ' · English', 160)}{field('name_es', t.name + ' · Español', 160)}{field('description_en', t.description + ' · English', 2500)}{field('description_es', t.description + ' · Español', 2500)}{field('designer', t.designer, 160)}{field('reference', t.reference, 120)}{outfitDetailKeys[kind].map(key => field(key, key === 'back' ? t.backDetail : t[key]))}{field('sample_sizes', t.sample)}{field('order_sizes', t.sizes)}{field('lead_time', t.timeline, 500)}<BoutiqueField label={t.outfitPrice} keyboardType="decimal-pad" value={fields.price ?? ''} onChangeText={value => setFields(old => ({ ...old, price: value }))}/><SectionPicker value={fields.currency ?? 'CRC'} options={[{ key: 'CRC', label: 'CRC' }, { key: 'USD', label: 'USD' }]} label={t.currency} closeLabel={t.back} onChange={value => setFields(old => ({ ...old, currency: value }))}/><Text style={s.heading}>{t.media}</Text><Text style={s.muted}>{t.mediaHint}</Text>{(data.vendor.gallery_images ?? []).map((asset, index) => <View key={index} style={s.row}>{asset.type !== 'video' && typeof asset.url === 'string' ? <Image source={{ uri: asset.url }} style={s.media}/> : null}<View style={{ flex: 1 }}><BoutiqueCheck label={`${t.media} ${index + 1}${asset.type === 'video' ? ' ▶' : ''}`} value={media.includes(index)} onChange={() => setMedia(old => old.includes(index) ? old.filter(i => i !== index) : old.length < 6 ? [...old, index] : old)}/></View></View>)}<BoutiqueCheck label={t.publish} value={published} onChange={() => setPublished(v => !v)}/><BoutiqueButton title={busy ? t.saving : t.add} disabled={busy} onPress={() => void save('item')}/></View> : data.items.map(item => <View key={item.id} style={s.appointment}><Text style={s.heading}>{boutiqueText(item.name, language)}</Text><Text style={s.muted}>{t[item.kind]}</Text><BoutiqueButton title={t.edit} secondary disabled={busy} onPress={() => edit(item)}/></View>)}</> : null}</>}
 </View>;
}
