import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isSupportedLanguage } from "@/lib/i18n";
import { parseCloudinaryImage } from "@/lib/images";
import ProfilePageContent from "@/app/account/profile/ProfilePageContent";
import type { ProfileFormInitial } from "@/app/account/profile/profileForm";
import AccountLayoutHeader from "@/app/account/AccountLayoutHeader";
import {loadPersonalProfile} from '@/features/accounts/server/personal-profile';

export default async function AccountProfilePage() {
  const supabase = await createSupabaseServerClient();
  const result = await loadPersonalProfile({
    getUser: () => supabase.auth.getUser(),
    readOwnProfile: (userId) => supabase
    .from("profiles")
    .select(
      "role, full_name, phone, country, tentative_wedding_date, guest_count, wedding_budget, wedding_theme, language"
    )
    .eq("id", userId)
    .maybeSingle(),
  });
  if (result.status === 'guest') redirect('/login?next=%2Faccount%2Fprofile');
  if (result.status === 'unavailable') throw new Error('The personal profile could not be loaded. Please try again.');
  const {user, profile} = result;

  const initial: ProfileFormInitial = {
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    email: user.email ?? "",
    country: profile?.country ?? "",
    tentative_wedding_date: profile?.tentative_wedding_date ?? "",
    guest_count: profile?.guest_count ?? null,
    wedding_budget: profile?.wedding_budget ?? null,
    wedding_theme: profile?.wedding_theme ?? "",
    language: isSupportedLanguage(profile?.language) ? profile.language : "en",
  };

  const avatarImage = parseCloudinaryImage(user.user_metadata?.avatar_image);

  return <div className="wm-account-workspace">
    <AccountLayoutHeader clientWorkspace={profile.role === 'user'} />
    <ProfilePageContent initial={initial} avatarImage={avatarImage} />
  </div>;
}
