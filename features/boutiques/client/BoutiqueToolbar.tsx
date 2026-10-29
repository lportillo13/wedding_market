import Link from 'next/link';
import HeaderIcon from '@/components/HeaderIcon';
import { boutiqueCopy } from '@/shared/boutiques/copy';
import type { BoutiqueLanguage } from '@/shared/boutiques/types';

export default function BoutiqueToolbar({ language, example, vendor }: { language: BoutiqueLanguage; example: boolean; vendor: boolean }) {
    const t = boutiqueCopy[language];
    return <nav className="wm-boutique-toolbar" aria-label={t.boutiques}>
        <Link className="wm-boutique-toolbar__back" href={example ? '/boutiques?examples=1' : '/boutiques'}><HeaderIcon name="arrow"/>{t.title}</Link>
        <div>
            <Link href={example ? '/boutiques/favorites?examples=1' : '/boutiques/favorites'} aria-label={t.favorites}><HeaderIcon name="heart"/><span>{t.toolbarSaved}</span></Link>
            <Link href={example ? '/boutiques/examples/appointments' : vendor ? '/vendor/inbox/appointments' : '/account/inbox/appointments'} aria-label={t.appointments}><HeaderIcon name="calendar"/><span>{t.toolbarAppointments}</span></Link>
        </div>
    </nav>;
}
