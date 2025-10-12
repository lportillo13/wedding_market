"use client";

import ProfileForm, { type ProfileFormInitial } from "./profileForm";
import { useLanguage } from "@/contexts/LanguageContext";

type ProfilePageContentProps = {
  initial: ProfileFormInitial | null;
};

export default function ProfilePageContent({ initial }: ProfilePageContentProps) {
  const { dictionary } = useLanguage();
  const labels = dictionary.account.profile;

  if (!initial) {
    return (
      <main className="container py-4" style={{ maxWidth: 960 }}>
        <h1 className="mb-3">{labels.title}</h1>
        <div className="alert alert-warning">{labels.loginRequired}</div>
      </main>
    );
  }

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <h1 className="mb-3">{labels.title}</h1>
      <p className="text-secondary">{labels.intro}</p>
      <ProfileForm initial={initial} />
    </main>
  );
}
