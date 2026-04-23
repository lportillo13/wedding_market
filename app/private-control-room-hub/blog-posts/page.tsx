import BlogPostLibrary from "@/components/admin/BlogPostLibrary";
import BlogPostManager from "@/components/admin/BlogPostManager";
import { getSupabaseForAdmin } from "@/lib/admin/supabase";

async function loadBlogPosts() {
  const supabase = await getSupabaseForAdmin();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, status, excerpt, hero_image_url, body, published_at, updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return { posts: [], error: error.message };
  }

  return { posts: data ?? [], error: null as string | null };
}

export default async function BlogPostsPage() {
  const { posts, error } = await loadBlogPosts();

  return (
    <div className="space-y-12">
      <BlogPostLibrary posts={posts} />
      <BlogPostManager initialPosts={posts} errorMessage={error ?? undefined} />
    </div>
  );
}
