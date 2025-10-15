import SiteSettingsPanel from "@/components/admin/SiteSettingsPanel";
import { getSupabaseForAdmin } from "@/lib/admin/supabase";

async function loadSiteSettings() {
  const supabase = await getSupabaseForAdmin();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .order("key", { ascending: true });

  if (error) {
    return { settings: {}, error: error.message };
  }

  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    if (typeof row.value === "object") {
      result[row.key] = JSON.stringify(row.value, null, 2);
    } else if (typeof row.value === "string") {
      result[row.key] = row.value;
    } else if (row.value != null) {
      result[row.key] = String(row.value);
    }
  }

  return { settings: result, error: null as string | null };
}

export default async function SiteSettingsPage() {
  const { settings, error } = await loadSiteSettings();

  return (
    <div className="space-y-12">
      <SiteSettingsPanel initialSettings={settings} errorMessage={error ?? undefined} />
    </div>
  );
}
