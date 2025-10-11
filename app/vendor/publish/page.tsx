export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getUserAndRole } from "@/lib/auth/guards";
import { getSupabaseServer } from "@/lib/supabase/server";
import PublishForm from "./publishForm";

export default async function PublishPage() {
  const { user } = await getUserAndRole();
  if (!user) redirect(`/login?next=${encodeURIComponent("/vendor/publish")}`);

  const supabase = await getSupabaseServer();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, slug, business_name, is_published")
    .eq("owner_id", user.id)
    .maybeSingle();

  const initial = {
    is_published: vendor?.is_published ?? false,
    slug: vendor?.slug ?? undefined,
  };

  return (
    <div className="row">
      <div className="col-lg-8">
        <h2 className="mb-3">Publish</h2>
        <p className="text-muted">
          Toggle whether your vendor profile appears in public search.
        </p>
        <PublishForm initial={initial} />
      </div>
    </div>
  );
}
