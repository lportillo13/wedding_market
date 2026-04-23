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
      <div className="wm-page-content">
        <div className="container">
          <div className="alert alert-warning">{labels.loginRequired}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wm-page-content">
      <div className="container" style={{ maxWidth: "52rem" }}>
        <p className="text-secondary mb-4">{labels.intro}</p>
        <AvatarForm
          image={avatarImage}
          name={initial.full_name || initial.email}
          labels={labels.avatar}
        />
        <ProfileForm initial={initial} />
      </div>
    </div>
  );
}
