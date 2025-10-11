"use client";

import { useTranslation } from '@/contexts/LanguageContext';
import VendorSignUpForm from './VendorSignUpForm';

export default function VendorSignupPageContent() {
  const t = useTranslation();

  return (
    <main className="container py-5" style={{ maxWidth: 520 }}>
      <h1 className="mb-3">{t('signup.vendor.formPage.title')}</h1>
      <p className="text-secondary mb-4">{t('signup.vendor.formPage.description')}</p>
      <VendorSignUpForm />
    </main>
  );
}
