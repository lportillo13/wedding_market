"use client";

import ProfileForm, { type ProfileFormInitial } from "./profileForm";
import AvatarForm from "./AvatarForm";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CloudinaryImage } from "@/types/images";

type ProfilePageContentProps = {
  initial: ProfileFormInitial | null;
  avatarImage: CloudinaryImage | null;
};

export default function ProfilePageContent({ initial, avatarImage }: ProfilePageContentProps) {
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
    </main>
  );
}
