'use client';
import { createContext, useContext, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ExampleBoutiqueSession } from '@/shared/boutiques/example-session';
import { boutiqueCopy } from '@/shared/boutiques/copy';
import { boutiqueApi } from './api';
type Transport = {
    api: typeof boutiqueApi;
    example: boolean;
    role: 'couple' | 'store';
};
const Context = createContext<Transport>({ api: boutiqueApi, example: false, role: 'couple' });
export function useBoutiqueTransport() { return useContext(Context); }
export function BoutiqueTransportProvider({ children }: {
    children: ReactNode;
}) {
    const pathname = usePathname(), search = useSearchParams(), { language } = useLanguage(), t = boutiqueCopy[language];
    const [session, setSession] = useState(() => new ExampleBoutiqueSession()), [role, setRole] = useState<'couple' | 'store'>('couple'), [store, setStore] = useState(session.storeId), [generation, setGeneration] = useState(0);
    const example = search.get('examples') === '1' || pathname.startsWith('/boutiques/example-') || pathname.startsWith('/boutiques/examples/');
    function actor(next: 'couple' | 'store') { session.setRole(next); setRole(next); if (next === 'store')
        setStore(session.storeId); }
    const controls = example ? <aside className="wm-boutique-demo" aria-label={language === 'es' ? 'Boutiques de ejemplo' : 'Example boutiques'}><div className="container"><div><strong>{language === 'es' ? 'Boutiques de ejemplo' : 'Example boutiques'}</strong><p>{language === 'es' ? 'Tiendas, prendas y precios ficticios. Los cambios se quedan en esta prueba y se reinician al recargar.' : 'Fictional stores, outfits and prices. Changes stay in this preview and reset on reload.'}</p></div><div className="wm-boutique-actions"><button className={`btn ${role === 'couple' ? 'btn-primary' : 'btn-outline-secondary'}`} aria-pressed={role === 'couple'} onClick={() => actor('couple')}>{language === 'es' ? 'Probar como pareja' : 'Try as couple'}</button><button className={`btn ${role === 'store' ? 'btn-primary' : 'btn-outline-secondary'}`} aria-pressed={role === 'store'} onClick={() => actor('store')}>{language === 'es' ? 'Probar como boutique' : 'Try as boutique'}</button>{role === 'store' ? <label>{t.boutiques}<select className="form-select" value={store} onChange={event => { session.setStore(event.target.value); setStore(event.target.value); }}>{session.shops.map(s => <option key={s.vendor_id} value={s.vendor_id}>{s.name}</option>)}</select></label> : null}</div><nav className="wm-boutique-actions mt-3" aria-label={language === 'es' ? 'Pruebas de ejemplo' : 'Example preview navigation'}><Link href="/boutiques?examples=1">{t.boutiques}</Link><Link href="/boutiques/favorites?examples=1">{t.favorites}</Link><Link href="/boutiques/examples/appointments">{t.appointments}</Link>{role === 'store' ? <Link href="/boutiques/examples/manage">{t.management}</Link> : null}<button className="btn btn-link" onClick={() => { const fresh = new ExampleBoutiqueSession(); fresh.role = role; fresh.storeId = store; setSession(fresh); setGeneration(old => old + 1); }}>{language === 'es' ? 'Reiniciar prueba' : 'Reset preview'}</button><Link href="/boutiques">{language === 'es' ? 'Salir de ejemplos' : 'Exit examples'}</Link></nav></div></aside> : null;
    return <Context.Provider value={{ api: example ? session.api : boutiqueApi, example, role }}>
 {pathname.startsWith('/boutiques/examples/') ? controls : null}
 <div key={example ? `${role}-${role === 'store' ? store : ''}-${generation}` : 'real'}>{children}</div>
 </Context.Provider>;
}
