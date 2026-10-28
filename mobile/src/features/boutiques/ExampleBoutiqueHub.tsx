import { useState } from 'react';
import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { ExampleBoutiqueSession } from '../../../../shared/boutiques/example-session';
import { boutiqueCopy } from '../../../../shared/boutiques/copy';
import { mobileConfig } from '../../lib/config';
import { SectionPicker } from '../../ui/SectionPicker';
import { BoutiqueButton, boutiqueStyles as s } from './ui';
import { BoutiqueNativeTransport } from './transport';
import { boutiqueRequest } from './api';
export type BoutiqueMode = 'directory' | 'favorites' | 'appointments' | 'manage';
export function ExampleBoutiqueShell({ language, mode, role, onBack, children }: {
    language: 'en' | 'es';
    mode: BoutiqueMode;
    role: string;
    onBack: () => void;
    children: (input: {
        mode: BoutiqueMode;
        role: string;
        onBack: () => void;
    }) => ReactNode;
}) {
    const t = boutiqueCopy[language];
    const [enabled, setEnabled] = useState(false), [session, setSession] = useState(() => new ExampleBoutiqueSession(mobileConfig.webApiUrl)), [actor, setActor] = useState<'couple' | 'store'>('couple'), [store, setStore] = useState(session.storeId), [selectedMode, setMode] = useState<BoutiqueMode>('directory'), [generation, setGeneration] = useState(0);
    function choose(next: 'couple' | 'store') { session.setRole(next); setActor(next); if (next === 'couple' && selectedMode === 'manage')
        setMode('directory'); if (next === 'store')
        setStore(session.storeId); }
    return <BoutiqueNativeTransport.Provider value={{ api: enabled ? session.api : boutiqueRequest, example: enabled }}><View style={s.root}>
 {enabled ? <View style={s.policy}><Text style={s.heading}>{language === 'es' ? 'Boutiques de ejemplo' : 'Example boutiques'}</Text><Text style={s.muted}>{language === 'es' ? 'Tiendas, prendas y precios ficticios. Los cambios se reinician al salir de esta prueba.' : 'Fictional stores, outfits and prices. Changes reset when you leave this preview.'}</Text><View style={s.row}><BoutiqueButton title={language === 'es' ? 'Como pareja' : 'As couple'} secondary={actor !== 'couple'} onPress={() => choose('couple')}/><BoutiqueButton title={language === 'es' ? 'Como boutique' : 'As boutique'} secondary={actor !== 'store'} onPress={() => choose('store')}/></View>{actor === 'store' ? <SectionPicker value={store} options={session.shops.map(s => ({ key: s.vendor_id, label: s.name }))} label={t.boutiques} closeLabel={t.back} onChange={id => { session.setStore(id); setStore(id); }}/> : null}<View style={s.row}>{([['directory', t.boutiques], ['favorites', t.favorites], ['appointments', t.appointments], ...(actor === 'store' ? [['manage', t.management]] : [])] as [
        BoutiqueMode,
        string
    ][]).map(([key, title]) => <BoutiqueButton key={key} title={title} secondary={selectedMode !== key} onPress={() => setMode(key)}/>)}</View><BoutiqueButton title={language === 'es' ? 'Reiniciar prueba' : 'Reset preview'} secondary onPress={() => { const fresh = new ExampleBoutiqueSession(mobileConfig.webApiUrl); fresh.role = actor; fresh.storeId = store; setSession(fresh); setGeneration(v => v + 1); }}/><BoutiqueButton title={language === 'es' ? 'Salir de ejemplos' : 'Exit examples'} secondary onPress={() => { setEnabled(false); setActor('couple'); setMode('directory'); setSession(new ExampleBoutiqueSession(mobileConfig.webApiUrl)); }}/></View> : mode === 'directory' ? <BoutiqueButton title={language === 'es' ? 'Ver boutiques de ejemplo' : 'View example boutiques'} secondary onPress={() => { setEnabled(true); setMode('directory'); }}/> : null}
 <View key={enabled ? `${actor}-${actor === 'store' ? store : ''}-${generation}-${selectedMode}` : 'real'}>{children({ mode: enabled ? selectedMode : mode, role: enabled ? (actor === 'couple' ? 'client' : 'vendor') : role, onBack: enabled ? () => { if (selectedMode !== 'directory')
            setMode('directory');
        else {
            setEnabled(false);
            setSession(new ExampleBoutiqueSession(mobileConfig.webApiUrl));
            setActor('couple');
        } } : onBack })}</View>
 </View></BoutiqueNativeTransport.Provider>;
}
