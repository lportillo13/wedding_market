// app/vendor/profile/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getUserAndRole } from "@/lib/auth/guards";
import { getSupabaseServer } from "@/lib/supabase/server";
import ProfileForm from "./profileForm";

type VendorRow = {
  slug: string | null;
  business_name: string | null;
  bio: { en?: string | null; es?: string | null } | null;
};

export default async function ProfilePage() {
  const { user } = await getUserAndRole();
  if (!user) redirect(`/login?next=${encodeURIComponent("/vendor/profile")}`);

  const supabase = await getSupabaseServer();

  // ✅ Only select columns that actually exist in your table
  let { data: vendor } = await supabase
    .from("vendors")
    .select("id, slug, business_name, bio")
    .eq("owner_id", user.id)
    .maybeSingle();

  // Optional: auto-create a vendor row for first-time users
  if (!vendor) {
    const inserted = await supabase
      .from("vendors")
      .insert({
        owner_id: user.id,
        slug: `vendor-${user.id.slice(0, 8)}`,
        business_name: "Untitled Vendor",
        bio: { en: "", es: "" }, // JSONB shape your table uses
        is_published: false,
      })
      .select("id, slug, business_name, bio")
      .single();

    if (inserted.error) {
      throw new Error(inserted.error.message);
    }

    vendor = inserted.data ?? null;
  }

  // Normalize to the form shape
  const v = vendor as VendorRow | null;
  const bio = v?.bio ?? null;
  const initial = {
    slug: v?.slug ?? "",
    business_name: v?.business_name ?? "",
    bio_en: bio?.en ?? "",
    bio_es: bio?.es ?? "",
  };

  return (
    <div className="row">
      <div className="col-lg-8">
        <ProfileForm initial={initial} />
      </div>
    </div>
  );
}
