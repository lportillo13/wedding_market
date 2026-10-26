import Link from 'next/link';
import { legalDocuments, type LegalKind } from '@/features/legal/content';
import { publisher } from '@/features/legal/identity';
import { getRequestLanguage } from '@/lib/i18n/server';

export async function legalLanguage(searchParams?: Promise<{lang?:string}>) {
  const requested=(await searchParams)?.lang;
  return requested === 'en' || requested === 'es' ? requested : getRequestLanguage();
}

export default async function LegalPage({kind,searchParams}:{kind:LegalKind;searchParams?:Promise<{lang?:string}>}) {
  const language=await legalLanguage(searchParams);
  const content=legalDocuments[language][kind];
  const links=[['privacy',language==='es'?'Privacidad':'Privacy'],['terms',language==='es'?'Términos':'Terms'],['support',language==='es'?'Soporte':'Support'],['account-deletion',language==='es'?'Eliminar cuenta':'Account deletion'],['community-guidelines',language==='es'?'Comunidad':'Community'],['cookies','Cookies']];
  return <main lang={language} className="container py-5"><article className="mx-auto" style={{maxWidth:880}}>
    <p className="text-uppercase text-muted small fw-semibold">Wedding Market</p>
    <nav className="d-flex gap-3 mb-4" aria-label={language==='es'?'Idioma del documento':'Document language'}>
      <Link href={`/${kind}?lang=en`} hrefLang="en" aria-current={language==='en'?'page':undefined}>English</Link>
      <Link href={`/${kind}?lang=es`} hrefLang="es" aria-current={language==='es'?'page':undefined}>Español</Link>
    </nav>
    <h1>{content.title}</h1><p className="text-muted">{language==='es'?'Actualizado':'Updated'}: <time dateTime={publisher.updated}>{publisher.updated}</time></p>
    <p className="lead">{content.intro}</p>
    {content.sections.map(section=><section key={section.title}><h2 className="h4 mt-4">{section.title}</h2>{section.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</section>)}
    <p className="mt-4"><a href={`mailto:${publisher.email}`}>{publisher.email}</a></p>
    <nav className="d-flex flex-wrap gap-3 border-top pt-3 mt-4" aria-label={language==='es'?'Ayuda y políticas':'Help and policies'}>
      {links.map(([path,label])=><Link key={path} href={`/${path}?lang=${language}`}>{label}</Link>)}
    </nav><p className="small text-muted mt-3">{publisher.name} · {publisher.jurisdiction} · thewedmarket.com</p>
  </article></main>;
}
