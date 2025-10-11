"use client";

import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';
import SignUpForm from './SignUpForm';

export default function SignUpPageContent() {
  const t = useTranslation();

  return (
    <main className="container py-5" style={{ maxWidth: 480 }}>
      <h1 className="mb-3">{t('signup.page.title')}</h1>
      <p className="text-secondary mb-4">{t('signup.page.description')}</p>
      <SignUpForm />
      <p className="mt-3 text-center">
        {t('signup.page.alreadyHave')}{' '}
        <Link href="/login">{t('signup.page.loginLink')}</Link>
      </p>
    </main>
  );
}
