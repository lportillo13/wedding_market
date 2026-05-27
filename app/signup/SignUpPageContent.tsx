"use client";

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import SignUpForm from './SignUpForm';

export default function SignUpPageContent() {
  const { dictionary } = useLanguage();
  const page = dictionary.signup.page;

  return (
    <main className="wm-onboarding-page">
      <div className="wm-onboarding-shell">
        <section className="wm-onboarding-hero">
          <div className="wm-onboarding-hero__copy">
            <p className="wm-onboarding-hero__eyebrow">{page.eyebrow}</p>
            <h1 className="wm-page-title mb-3">{page.title}</h1>
            <p className="text-secondary mb-0">{page.description}</p>
          </div>
          <p className="wm-onboarding-login-link">
            {page.alreadyHave}{' '}
            <Link href="/login">{page.loginLink}</Link>
          </p>
        </section>

        <section className="wm-onboarding-layout">
          <div className="wm-onboarding-main">
            <SignUpForm />
          </div>
        </section>
      </div>
    </main>
  );
}
