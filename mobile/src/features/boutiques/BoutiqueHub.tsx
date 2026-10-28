import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { boutiqueCopy } from '../../../../shared/boutiques/copy';
import { boutiqueText, outfitDetailKeys, type Boutique, type Outfit } from '../../../../shared/boutiques/types';
import { colors } from '../../theme/tokens';
import { boutiqueRequest } from './api';
import { BoutiqueButton, boutiqueStyles as s } from './ui';
import { BoutiqueAppointmentForm } from './BoutiqueAppointmentForm';
import { BoutiqueAppointments } from './BoutiqueAppointments';
import { BoutiqueManager } from './BoutiqueManager';
import { ContentSafety } from '../inbox/ContentSafety';
export type BoutiqueMode = 'directory' | 'favorites' | 'appointments' | 'manage';
export function BoutiqueHub({ language, mode = 'directory', role, onBack, onSignIn }: {
    language: 'en' | 'es';
    mode?: BoutiqueMode;
    role: string;
    onBack: () => void;
    onSignIn: () => void;
}) {
    const t = boutiqueCopy[language];
    const [shop, setShop] = useState<Boutique | null>(null), [shops, setShops] = useState<Boutique[]>([]), [items, setItems] = useState<Outfit[]>([]), [detail, setDetail] = useState<Outfit | null>(null), [booking, setBooking] = useState(false), [page, setPage] = useState(1), [kind, setKind] = useState(''), [saved, setSaved] = useState<string[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(false), [busy, setBusy] = useState(false);
    const sequence = useRef(0), lock = useRef(false);
    const slug = shop?.slug;
    const back = useCallback(() => { if (booking)
        setBooking(false);
    else if (detail)
        setDetail(null);
    else if (shop) {
        setShop(null);
        setPage(1);
        setKind('');
    }
    else
        onBack(); }, [booking, detail, shop, onBack]);
    useEffect(() => { const sub = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; }); return () => sub.remove(); }, [back]);
    useEffect(() => { let active = true; setSaved([]); if (role !== 'guest')
        void boutiqueRequest<{
            saved: string[];
        }>('/account?mode=state').then(r => { if (active)
            setSaved(r.saved); }).catch(() => { }); return () => { active = false; }; }, [role]);
    useEffect(() => {
        if (mode === 'appointments' || mode === 'manage')
            return;
        const version = ++sequence.current;
        setLoading(true);
        setError('');
        const load = async () => {
            try {
                if (slug) {
                    const r = await boutiqueRequest<Boutique>(`?slug=${encodeURIComponent(slug)}&page=${page}${kind ? '&kind=' + kind : ''}`);
                    if (version === sequence.current) {
                        setShop(r);
                        setItems(r.items);
                    }
                }
                else if (mode === 'favorites') {
                    const r = await boutiqueRequest<{
                        items: Outfit[];
                    }>('/account?mode=favorites&page=' + page);
                    if (version === sequence.current)
                        setItems(r.items);
                }
                else {
                    const r = await boutiqueRequest<{
                        items: Boutique[];
                    }>('?page=' + page);
                    if (version === sequence.current)
                        setShops(r.items);
                }
            }
            catch {
                if (version === sequence.current)
                    setError(role === 'guest' && mode === 'favorites' ? t.signIn : t.error);
            }
            finally {
                if (version === sequence.current)
                    setLoading(false);
            }
        };
        void load();
        return () => { sequence.current++; };
    }, [slug, page, kind, mode, role, t.error, t.signIn]);
    async function toggle(item: Outfit) { if (role === 'guest') {
        onSignIn();
        return;
    } if (lock.current)
        return; lock.current = true; setBusy(true); setError(''); try {
        await boutiqueRequest('/account', { action: 'favorite', id: item.id, saved: !saved.includes(item.id) });
        setSaved(old => old.includes(item.id) ? old.filter(id => id !== item.id) : [...old, item.id]);
        if (mode === 'favorites')
            setItems(old => old.filter(i => i.id !== item.id));
    }
    catch {
        setError(t.error);
    }
    finally {
        lock.current = false;
        setBusy(false);
    } }
    if (mode === 'appointments')
        return <BoutiqueAppointments language={language} vendor={role === 'vendor'} onBack={onBack}/>;
    if (mode === 'manage')
        return <BoutiqueManager language={language} onBack={onBack}/>;
    if (booking && shop)
        return <BoutiqueAppointmentForm language={language} shop={{ ...shop, items: detail && !shop.items.some(item => item.id === detail.id) ? [detail, ...shop.items] : shop.items }} selected={detail ? [detail.id] : []} role={role} onBack={() => setBooking(false)} onSignIn={onSignIn} onSuccess={() => { setBooking(false); setError(t.requested); }}/>;
    const itemName = detail ? boutiqueText(detail.name, language) : '';
    return <View style={s.root}><BoutiqueButton title={'← ' + t.back} onPress={back} secondary/>{error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
 {detail ? <><Text style={s.script}>{detail.designer}</Text><Text style={s.title}>{itemName}</Text>{detail.images.map((url, i) => <Image key={url} source={{ uri: url }} style={s.gallery} resizeMode="cover" accessibilityLabel={`${itemName} ${i + 1}`}/>)}{detail.videos.map((url, i) => <BoutiqueButton key={url} title={`▶ ${t.media} ${i + 1}`} secondary onPress={() => void Linking.openURL(url)}/>)}<Text style={s.body}>{boutiqueText(detail.description, language)}</Text><Text style={s.body}>{t[detail.offer]} · {detail.price_cents === null ? t.price : new Intl.NumberFormat(language, { style: 'currency', currency: detail.currency }).format(detail.price_cents / 100)}</Text><View style={s.section}>{outfitDetailKeys[detail.kind].filter(key => detail.details[key]).map(key => <Text key={key} style={s.body}>{key === 'back' ? t.backDetail : t[key]}: {detail.details[key]}</Text>)}{[[t.sample, detail.sample_sizes], [t.sizes, detail.order_sizes], [t.timeline, detail.lead_time], [t.reference, detail.reference]].filter(([, v]) => v).map(([label, value]) => <Text key={label} style={s.body}>{label}: {value}</Text>)}</View><Text style={s.muted}>{t.availability}</Text><BoutiqueButton title={t.request + ' →'} disabled={loading || !shop?.vendor_id} onPress={() => setBooking(true)}/><BoutiqueButton title={(saved.includes(detail.id) ? '♥ ' : '♡ ') + t.save} secondary disabled={busy} onPress={() => void toggle(detail)}/></> :
            <>{shop ? <><View style={s.hero}>{shop.hero ? <Image source={{ uri: shop.hero }} style={s.heroImage}/> : null}<View style={s.heroOverlay}/><View style={s.heroCopy}><Text style={s.heroScript}>{t.accent}</Text><Text style={s.heroTitle}>{shop.name}</Text><Text style={s.heroBody}>{[shop.city, shop.region, 'Costa Rica'].filter(Boolean).join(' · ')}</Text><BoutiqueButton title={t.request + ' →'} secondary onPress={() => setBooking(true)}/></View></View><Text style={s.heading}>{t.collection}</Text><View style={s.row}>{[['', t.all], ['dress', t.dress], ['suit', t.suit]].map(([value, label]) => <BoutiqueButton key={value} title={label} secondary={kind !== value} onPress={() => { setKind(value); setPage(1); }}/>)}</View></> : <><Text style={s.script}>{t.accent}</Text><Text style={s.title}>{mode === 'favorites' ? t.favorites : t.title}</Text><Text style={s.muted}>{t.intro}</Text></>}
 {loading ? <ActivityIndicator color={colors.ink}/> : null}
 {shop || mode === 'favorites' ? <View style={s.grid}>{items.map(item => <View key={item.id} style={s.tile}><View><TouchableOpacity accessibilityRole="button" accessibilityLabel={boutiqueText(item.name, language)} onPress={() => { if (!shop) {
                    setShop({ slug: (item as Outfit & {
                            slug: string;
                        }).slug } as Boutique);
                    setPage(1);
                } setDetail(item); }}>{item.images[0] ? <Image source={{ uri: item.images[0] }} style={s.tileImage}/> : <View style={s.tileImage}/>}</TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={saved.includes(item.id) ? t.unsave : t.save} disabled={busy} onPress={() => void toggle(item)} style={s.heart}><Text style={s.heartText}>{saved.includes(item.id) ? '♥' : '♡'}</Text></TouchableOpacity></View><TouchableOpacity onPress={() => { if (!shop)
                    setShop({ slug: (item as Outfit & {
                            slug: string;
                        }).slug } as Boutique); setDetail(item); }}><Text style={s.tileTitle}>{boutiqueText(item.name, language)}</Text></TouchableOpacity><Text style={s.muted}>{t[item.offer]}</Text><Text style={s.muted}>{item.price_cents === null ? t.price : new Intl.NumberFormat(language, { style: 'currency', currency: item.currency }).format(item.price_cents / 100)}</Text></View>)}</View> :
                    <View style={s.root}>{shops.map(b => <TouchableOpacity key={b.vendor_id} style={s.hero} accessibilityRole="button" onPress={() => { setShop(b); setPage(1); setKind(''); }}>{b.hero ? <Image source={{ uri: b.hero }} style={s.heroImage}/> : null}<View style={s.heroOverlay}/><View style={s.heroCopy}><Text style={s.heroScript}>{t.boutiques}</Text><Text style={s.heroTitle}>{b.name}</Text><Text style={s.heroBody}>{b.city}</Text><Text style={s.heroBody}>{t.explore} ↗</Text></View></TouchableOpacity>)}</View>}
 {!loading && !(shop || mode === 'favorites' ? items : shops).length ? <Text style={s.muted}>{mode === 'favorites' ? t.noFavorites : shop ? t.noItems : t.empty}</Text> : null}
 <View style={s.row}>{page > 1 ? <BoutiqueButton title={t.previous} secondary onPress={() => setPage(p => p - 1)}/> : null}{(shop || mode === 'favorites' ? items : shops).length === 12 ? <BoutiqueButton title={t.next} secondary onPress={() => setPage(p => p + 1)}/> : null}</View>
 {shop ? <View style={s.section}><Text style={s.heading}>{t.about}</Text><Text style={s.body}>{boutiqueText(shop.bio, language)}</Text><Text style={s.muted}>{shop.languages?.join(' · ')}</Text>{shop.address ? <Text style={s.body}>{shop.address}</Text> : null}<ContentSafety kind="vendor" targetId={shop.vendor_id} language={language}/><Text style={s.heading}>{t.policies}</Text><Text style={s.body}>{boutiqueText(shop.policies, language)}</Text><Text style={s.muted}>{shop.duration_minutes} min · {shop.companions_max} {t.companions.toLowerCase()} · {shop.visit_fee_cents ? new Intl.NumberFormat(language, { style: 'currency', currency: shop.currency }).format(shop.visit_fee_cents / 100) : t.free}</Text><BoutiqueButton title={t.request} onPress={() => setBooking(true)}/></View> : null}</>}
 </View>;
}
