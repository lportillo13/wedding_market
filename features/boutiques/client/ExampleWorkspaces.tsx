'use client';
import AppointmentInbox from './AppointmentInbox';
import BoutiqueManager from './BoutiqueManager';
import { useBoutiqueTransport } from './transport';
import { useLanguage } from '@/contexts/LanguageContext';
export function ExampleAppointmentInbox() { const { role } = useBoutiqueTransport(); return <AppointmentInbox vendor={role === 'store'}/>; }
export function ExampleBoutiqueManager() { const { role } = useBoutiqueTransport(); const { language } = useLanguage(); return role === 'store' ? <BoutiqueManager /> : <p className="container py-4">{language === 'es' ? 'Elige «Probar como boutique» arriba para administrar la colección.' : 'Choose “Try as boutique” above to manage the collection.'}</p>; }
