import Link from 'next/link';
import {getRequestI18n} from '@/lib/i18n/server';

export default async function AccountAccessNotice({vendor = false}: {vendor?:boolean}) {
  const {language} = await getRequestI18n();
  const es = language === 'es';
  return <main className="container py-5 wm-account-access-notice">
    <h1>{es ? 'Un espacio para cada cuenta.' : 'A space for each account.'}</h1>
    <p>{es ? 'Esta sección está disponible para cuentas de pareja. Puedes continuar desde tu perfil personal o explorar proveedores.' : 'This section is available to couple accounts. Continue from your personal profile or explore vendors.'}</p>
    <div className="d-flex flex-wrap gap-3"><Link className="btn btn-primary" href="/account/profile">{es ? 'Perfil personal' : 'Personal profile'}</Link>{vendor && <Link className="btn btn-outline-secondary" href="/vendor">{es ? 'Mi negocio' : 'My business'}</Link>}<Link className="btn btn-outline-secondary" href="/vendors">{es ? 'Explorar proveedores' : 'Explore vendors'}</Link></div>
  </main>;
}
