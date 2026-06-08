"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import SignUpForm from './SignUpForm';

export default function SignUpPageContent({
  closeHref,
  openModalOnLoad = false,
}: {
  closeHref?: string;
  openModalOnLoad?: boolean;
}) {
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
        </section>

        <section className="wm-onboarding-layout">
          <div className="wm-onboarding-main">
            <SignUpForm closeHref={closeHref} openModalOnLoad={openModalOnLoad} />
          </div>
        </section>
      </div>
    </main>
  );
}
