"use client";

import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';

export default function VendorSignupGate() {
  const t = useTranslation();

  return (
    <main className="container py-5" style={{ maxWidth: 520 }}>
      <h1 className="wm-page-title mb-3">{t('signup.vendor.gate.title')}</h1>
      <p className="text-secondary mb-4">{t('signup.vendor.gate.description')}</p>
      <Link className="btn btn-primary" href="/login?next=/signup/vendor">
        {t('signup.vendor.gate.loginCta')}
      </Link>
      <p className="mt-3">
        {t('signup.vendor.gate.newHere')}{' '}
        <Link href="/signup">{t('signup.vendor.gate.signUpLink')}</Link>.
      </p>
    </main>
  );
}
