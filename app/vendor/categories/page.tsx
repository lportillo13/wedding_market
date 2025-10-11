import { redirect } from "next/navigation";
import { getUserAndRole } from "@/lib/auth/guards";
import { getSupabaseServer } from "@/lib/supabase/server";
import CategoriesForm from "./categoriesForm";

export default async function CategoriesPage() {
  const { user } = await getUserAndRole();
  if (!user) redirect(`/login?next=${encodeURIComponent("/vendor/categories")}`);

  const supabase = await getSupabaseServer();
  const [{ data: vendor }, { data: allCats }] = await Promise.all([
    supabase.from("vendors").select("id").eq("owner_id", user.id).maybeSingle(),
    supabase.from("categories").select("key,label").order("key"),
  ]);

  let selected: string[] = [];
  if (vendor?.id) {
    const { data: vview } = await supabase
      .from("vendor_public_search")
      .select("categories")
      .eq("id", vendor.id)
      .maybeSingle();
    selected = (vview?.categories as string[]) ?? [];
  }

  return (
    <div className="row">
      <div className="col-lg-8">
        <CategoriesForm allCats={allCats || []} selected={selected} />
      </div>
    </div>
  );
}
