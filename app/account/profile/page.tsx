import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupportedLanguage } from "@/lib/i18n";
import { parseCloudinaryImage } from "@/lib/images";
import ProfilePageContent from "./ProfilePageContent";
import type { ProfileFormInitial } from "./profileForm";

export default async function AccountProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <ProfilePageContent initial={null} avatarImage={null} />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, phone, country, tentative_wedding_date, guest_count, wedding_budget, wedding_theme, language"
    )
    .eq("id", user.id)
    .maybeSingle();

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

  return <ProfilePageContent initial={initial} avatarImage={avatarImage} />;
}
