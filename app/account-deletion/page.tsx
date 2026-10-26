import Link from 'next/link';
import DeletionForm from '@/components/legal/DeletionForm';
import {legalLanguage} from '@/components/legal/LegalPage';
import {deletionCopy,type DeletionReceipt} from '@/shared/accounts/deletion';
import {createSupabaseServerClient} from '@/lib/supabase/server';

export const metadata={title:'Account Deletion | Wedding Market',alternates:{canonical:'https://thewedmarket.com/account-deletion'}};

export default async function AccountDeletionPage({searchParams}:{searchParams:Promise<{lang?:string}>}) {
  const language=await legalLanguage(searchParams);const labels=deletionCopy[language];
  const client=await createSupabaseServerClient();const {data:{user}}=await client.auth.getUser();
  let initial:DeletionReceipt|null=null;
  if (user) {
    const {data,error}=await client.from('account_deletion_requests').select('id,requested_at,due_at,status').eq('user_id',user.id).maybeSingle();
    if (error) throw new Error('Account controls are temporarily unavailable.');
    if (data) initial={id:data.id,requestedAt:data.requested_at,dueAt:data.due_at,status:data.status};
  }
  return <main lang={language} className="container py-5"><article className="mx-auto" style={{maxWidth:880}}>
    <nav className="d-flex gap-3 mb-4" aria-label="Language"><Link href="/account-deletion?lang=en" hrefLang="en">English</Link><Link href="/account-deletion?lang=es" hrefLang="es">Español</Link></nav>
    <p className="small text-uppercase text-muted">Wedding Market</p><h1>{labels.title}</h1><p>{labels.body}</p>
    {user?<DeletionForm language={language} initial={initial} />:<Link className="btn btn-dark my-3" href={`/login?next=${encodeURIComponent('/account-deletion?lang='+language)}`}>{labels.signIn}</Link>}
    <h2 className="h4 mt-4">{language==='es'?'Qué se elimina':'What is deleted'}</h2>
    <p>{language==='es'?'Se eliminan el acceso, perfil, tokens de notificaciones y contenido asociado. Las solicitudes y conversaciones que dependan de tu cuenta pueden dejar de estar disponibles. Las reservas independientes de otros usuarios y proveedores se mantienen.':'Login access, profile, notification tokens and associated content are removed. Inquiries and conversations dependent on your account may become unavailable. Independent bookings belonging to other users and vendors remain.'}</p>
    <h2 className="h4 mt-4">{language==='es'?'Retención limitada y copias':'Limited retention and copies'}</h2>
    <p>{language==='es'?'Si existe una obligación legal concreta o disputa, explicaremos qué registros limitados se deben conservar y por qué. Las copias de respaldo se aíslan del uso habitual y se revisan durante la eliminación. No controlamos copias realizadas de forma independiente por otros proveedores o usuarios.':'If a specific legal obligation or dispute requires limited records, we will explain what must be retained and why. Backups are isolated from ordinary use and reviewed during deletion. We cannot control copies independently kept by other vendors or users.'}</p>
    <p>{language==='es'?'Si no puedes acceder a la cuenta, escribe a':'If you cannot access your account, contact'} <a href="mailto:hello@thewedmarket.com">hello@thewedmarket.com</a>. {language==='es'?'Verificaremos la titularidad antes de cambiar datos privados.':'We verify ownership before changing private account data.'}</p>
    <nav className="d-flex flex-wrap gap-3 mt-4"><Link href={`/privacy?lang=${language}`}>{language==='es'?'Privacidad':'Privacy'}</Link><Link href={`/support?lang=${language}`}>{language==='es'?'Soporte':'Support'}</Link></nav>
  </article></main>;
}
