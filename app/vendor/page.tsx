"use client";
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import HeaderIcon from '@/components/HeaderIcon';
import { useVendorWorkspace } from './VendorWorkspaceContext';
import {vendorStudioCopy} from './workspace-navigation';

export default function VendorHome() {
  const {language} = useLanguage();
  const labels = vendorStudioCopy[language];
  const {summary} = useVendorWorkspace();
  const cards = [
    {href:'/vendor/inbox', icon:'inbox' as const, title:labels.inboxTitle, body:labels.inboxBody, action:labels.openInbox},
    {href:'/vendor/profile#details', icon:'user' as const, title:labels.editTitle, body:labels.editBody, action:labels.editProfile},
    {href:'/vendor/profile#availability', icon:'calendar' as const, title:labels.calendarTitle, body:labels.calendarBody, action:labels.openCalendar},
  ];
  return <main className="wm-studio-overview">
    <p className="wm-studio-eyebrow">{labels.studio}</p><h1>{labels.homeTitle}</h1><p className="wm-studio-intro">{labels.homeIntro}</p>
    <div className="wm-studio-task-grid">{cards.map(card => <Link href={card.href} key={card.href}><HeaderIcon name={card.icon}/><h2>{card.title}</h2><p>{card.body}</p><span>{card.action}<HeaderIcon name="arrow"/></span></Link>)}</div>
    <section className="wm-studio-listing-card"><div><p className="wm-studio-eyebrow">{labels.publication} · {summary.isPublished ? labels.published : labels.draft}</p><h2>{labels.publicationTitle}</h2><p>{labels.publicationBody}</p></div><Link className="btn btn-outline-secondary" href="/vendor/publish">{labels.reviewPublication} <HeaderIcon name="arrow"/></Link></section>
  </main>;
}