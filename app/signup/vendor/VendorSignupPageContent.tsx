"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import VendorSignUpForm from './VendorSignUpForm';
import Link from 'next/link';
import { vendorOnboardingCopy } from './presentation';

type CategoryOption = {
  key: string;
  label: Record<string, unknown> | null;
};

export default function VendorSignupPageContent({
  categories,
  requiresAccount,
}: {
  categories: CategoryOption[];
  requiresAccount: boolean;
}) {
  const { language } = useLanguage();
  const page = vendorOnboardingCopy[language];

  return (
    <main className="wm-vendor-onboarding">
      <div className="container wm-vendor-onboarding__layout">
        <header className="wm-vendor-onboarding__intro">
          <p className="wm-editorial-eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <div className="wm-vendor-onboarding__promise"><span>{page.free}</span><p>{page.private}</p></div>
          {requiresAccount && <p className="wm-vendor-onboarding__login">{page.signIn} <Link href="/login?next=%2Fsignup%2Fvendor">{page.signInAction}</Link></p>}
        </header>
          <VendorSignUpForm categories={categories} requiresAccount={requiresAccount} />
      </div>
    </main>
  );
}
