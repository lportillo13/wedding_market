import SiteSettingsPanel from "@/components/admin/SiteSettingsPanel";
import BlogPostManager from "@/components/admin/BlogPostManager";
import OperationsPanel from "@/components/admin/OperationsPanel";
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

async function loadBlogPosts() {
  const supabase = await getSupabaseForAdmin();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, status, excerpt, hero_image_url, published_at, updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return { posts: [], error: error.message };
  }

  return { posts: data ?? [], error: null as string | null };
}

export default async function AdminControlRoomPage() {
  const [{ settings, error: settingsError }, { posts, error: postsError }] =
    await Promise.all([loadSiteSettings(), loadBlogPosts()]);

  return (
    <div className="space-y-10">
      <SiteSettingsPanel initialSettings={settings} errorMessage={settingsError ?? undefined} />
      <BlogPostManager initialPosts={posts} errorMessage={postsError ?? undefined} />
      <OperationsPanel />
    </div>
  );
}
