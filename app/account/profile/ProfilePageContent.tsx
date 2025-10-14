"use client";

import ProfileForm, { type ProfileFormInitial } from "./profileForm";
import AvatarForm from "./AvatarForm";
import ProfileTranslationsForm from "./ProfileTranslationsForm";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CloudinaryImage } from "@/types/images";
import type { ProfileTranslationsByField } from "./translationConfig";

type ProfilePageContentProps = {
  initial: ProfileFormInitial | null;
  avatarImage: CloudinaryImage | null;
  translations: ProfileTranslationsByField | null;
};

export default function ProfilePageContent({ initial, avatarImage, translations }: ProfilePageContentProps) {
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
      <AvatarForm
        image={avatarImage}
        name={initial.full_name || initial.email}
        labels={labels.avatar}
      />
      <ProfileForm initial={initial} />
      {translations ? (
        <ProfileTranslationsForm
          initialTranslations={translations}
          defaultLanguage={initial.language}
        />
      ) : null}
    </main>
  );
}
