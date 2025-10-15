import Link from "next/link";
import { getSupabaseForBlog } from "@/lib/blog/supabase";
import type { BlogPostRecord } from "@/lib/blog/blocks";

type BlogSummary = Pick<
  BlogPostRecord,
  "id" | "title" | "slug" | "excerpt" | "hero_image_url" | "published_at"
>;

async function loadPublishedPosts(): Promise<BlogSummary[]> {
  const supabase = await getSupabaseForBlog();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, hero_image_url, published_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Unable to load blog posts", error.message);
    return [];
  }

  return data ?? [];
}

function formatPublishedDate(value: string | null): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default async function BlogIndexPage() {
  const posts = await loadPublishedPosts();

  return (
    <main className="py-5">
      <div className="container">
        <header className="text-center mb-5">
          <span className="text-uppercase text-secondary fw-semibold">Insights</span>
          <h1 className="display-4 fw-bold mt-2">Wedding Market Blog</h1>
          <p className="lead text-secondary">
            Discover planning tips, vendor spotlights, and real celebrations from our community.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-center text-secondary">No stories have been published yet. Check back soon!</p>
        ) : (
          <div className="row g-4">
            {posts.map((post) => {
              const publishedDate = formatPublishedDate(post.published_at);
              return (
                <div key={post.id} className="col-md-6 col-lg-4">
                  <article className="card h-100 border-0 shadow-sm">
                    {post.hero_image_url && (
                      <div className="ratio ratio-16x9 bg-light">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.hero_image_url}
                          alt={post.title}
                          className="rounded-top w-100 h-100 object-fit-cover"
                        />
                      </div>
                    )}
                    <div className="card-body d-grid gap-3">
                      {publishedDate && <p className="text-uppercase text-secondary small mb-0">{publishedDate}</p>}
                      <h2 className="h4 fw-semibold">
                        <Link href={`/blog/${post.slug}`} className="text-decoration-none stretched-link">
                          {post.title}
                        </Link>
                      </h2>
                      {post.excerpt && <p className="text-secondary mb-0">{post.excerpt}</p>}
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
