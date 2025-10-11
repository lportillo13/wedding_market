import { createSupabaseServerClient } from "@/lib/supabase/server";
import NewRfqForm, { type RfqPrefill } from "./form";

type ProfileRow = {
  country: string | null;
  tentative_wedding_date: string | null;
  guest_count: number | null;
  wedding_budget: number | null;
  wedding_theme: string | null;
};

export default async function NewRfqPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let prefill: RfqPrefill = {};

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("country, tentative_wedding_date, guest_count, wedding_budget, wedding_theme")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>();

    if (profile) {
      prefill = {
        country: profile.country,
        eventDate: profile.tentative_wedding_date,
        guestCount: profile.guest_count,
        budget: profile.wedding_budget,
        theme: profile.wedding_theme,
      };
    }
  }

  return <NewRfqForm prefill={prefill} />;
}
