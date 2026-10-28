"use client";

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { exampleVendorCopy } from '@/shared/vendors/examples';

export default function ExampleVendorNotice({ profile = false }: { profile?: boolean }) {
  const { language } = useLanguage();
  const labels = exampleVendorCopy[language === 'es' ? 'es' : 'en'];
  return <aside className="wm-example-notice" aria-label={labels.badge}>
    <div><p className="wm-profile-eyebrow">{labels.badge}</p><p>{labels.body}</p></div>
    <Link href={profile ? '/vendors?examples=1' : '/vendors'}>{profile ? labels.back : labels.exit}<span aria-hidden="true"> ↗</span></Link>
  </aside>;
}
