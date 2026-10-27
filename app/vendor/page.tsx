"use client";

import Link from 'next/link';
import { useLanguage } from "@/contexts/LanguageContext";

export default function VendorHome() {
  const { language } = useLanguage();
  const es = language === 'es';
  const cards = [
    { href: '/vendor/inbox', title: es ? 'Tus conversaciones' : 'Your conversations', body: es ? 'Revisa solicitudes, responde preguntas y prepara propuestas en un solo lugar.' : 'Review inquiries, answer questions, and prepare proposals in one place.', action: es ? 'Abrir bandeja' : 'Open inbox' },
    { href: '/vendor/profile', title: es ? 'Tu perfil' : 'Your profile', body: es ? 'Muestra tu trabajo, organiza tus servicios y mantén tus fotos al día.' : 'Show your work, organize your services, and keep your photos up to date.', action: es ? 'Editar perfil' : 'Edit profile' },
    { href: '/vendor/publish', title: es ? 'Tu publicación' : 'Your listing', body: es ? 'Revisa los requisitos y decide cuándo tu negocio está listo para publicarse.' : 'Review the requirements and decide when your business is ready to publish.', action: es ? 'Revisar publicación' : 'Review listing' },
  ];
  return <main className="wm-workspace-overview">
    <h1>{es ? 'Un espacio para tu negocio.' : 'A little space for your business.'}</h1>
    <p>{es ? 'Elige lo que necesitas hacer hoy. Puedes volver a cada sección cuando quieras.' : 'Choose what you need to do today. You can return to each section whenever you need.'}</p>
    <div className="wm-workspace-cards">{cards.map(card => <Link href={card.href} key={card.href}><h2>{card.title}</h2><p>{card.body}</p><span>{card.action} →</span></Link>)}</div>
  </main>;
}
