import Link from "next/link";
import { loadManagedSiteContent } from "@/lib/content/siteContentServer";
import { getSupabaseForAdmin } from "@/lib/admin/supabase";

async function loadOverview() {
  const [content, postsResult] = await Promise.all([
    loadManagedSiteContent("en"),
    (async () => {
      const supabase = await getSupabaseForAdmin();
      const [{ data }, { count }] = await Promise.all([
        supabase
        .from("blog_posts")
        .select("id, title, slug, status, excerpt, hero_image_url, updated_at")
        .order("updated_at", { ascending: false })
        .limit(12),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
      ]);

      return { posts: data ?? [], totalPosts: count ?? 0 };
    })(),
  ]);

  return {
    homepage: content.homepage,
    posts: postsResult.posts,
    totalPosts: postsResult.totalPosts,
  };
}

export default async function AdminControlRoomIndex() {
  const { homepage, posts, totalPosts } = await loadOverview();
  const publishedCount = posts.filter((post) => post.status === "published").length;

  return (
    <div className="space-y-8">
      <section className="wm-admin-surface p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4">
            <p className="wm-admin-kicker">Dashboard</p>
            <h2 className="wm-admin-title text-4xl font-semibold">A friendlier backend for your public content.</h2>
            <p className="max-w-2xl text-base leading-8 text-[var(--wm-muted)]">
              Review homepage imagery, published articles, and editing areas from one place. Use this dashboard to jump
              directly into the content you want to update.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/private-control-room-hub/site-settings" className="btn btn-primary">
                Edit page content
              </Link>
              <Link href="/private-control-room-hub/blog-posts" className="btn btn-outline-secondary">
                Open blog studio
              </Link>
              <Link href="/private-control-room-hub/vendor-ads" className="btn btn-outline-secondary">
                Manage vendor ads
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="wm-admin-overview-card p-5">
              <p className="wm-admin-kicker text-xs">Homepage</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--wm-ink)]">{homepage.highlights.items.length}</p>
              <p className="text-sm text-[var(--wm-muted)]">highlight cards live on the home page</p>
            </div>
            <div className="wm-admin-overview-card p-5">
              <p className="wm-admin-kicker text-xs">Posts</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--wm-ink)]">{totalPosts}</p>
              <p className="text-sm text-[var(--wm-muted)]">total blog entries in the backend</p>
            </div>
            <div className="wm-admin-overview-card p-5">
              <p className="wm-admin-kicker text-xs">Published</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--wm-ink)]">{publishedCount}</p>
              <p className="text-sm text-[var(--wm-muted)]">published in the recent 12-post snapshot</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="wm-admin-surface p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="wm-admin-kicker">Homepage preview</p>
              <h3 className="mt-2 text-3xl font-semibold text-[var(--wm-ink)]">{homepage.hero.title}</h3>
            </div>
            <Link href="/private-control-room-hub/site-settings" className="btn btn-outline-secondary">
              Edit homepage
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="wm-admin-media-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={homepage.hero.imageUrl} alt={homepage.hero.imageAlt || homepage.hero.title} />
            </div>
            <div className="space-y-4">
              <p className="rounded-pill bg-primary-subtle px-3 py-2 d-inline-flex text-primary-emphasis fw-semibold">
                {homepage.hero.badge}
              </p>
              <p className="text-base leading-8 text-[var(--wm-muted)]">{homepage.hero.description}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {homepage.highlights.items.slice(0, 2).map((item) => (
                  <div key={item.title} className="wm-admin-overview-card p-4">
                    <h4 className="mb-2 text-lg font-semibold text-[var(--wm-ink)]">{item.title}</h4>
                    <p className="mb-0 text-sm leading-7 text-[var(--wm-muted)]">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="wm-admin-surface p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="wm-admin-kicker">Recent posts</p>
              <h3 className="mt-2 text-3xl font-semibold text-[var(--wm-ink)]">Latest 12 articles</h3>
              <p className="mb-0 mt-2 text-sm text-[var(--wm-muted)]">
                The dashboard shows only the latest entries. Open the studio to browse the full library.
              </p>
            </div>
            <Link href="/private-control-room-hub/blog-posts" className="btn btn-outline-secondary">
              Open studio
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/private-control-room-hub/blog-posts?edit=${encodeURIComponent(post.id)}#studio`}
                  className="wm-admin-card-link"
                >
                  <article className="wm-admin-overview-card grid gap-4 p-4 sm:grid-cols-[7rem_1fr] sm:items-center">
                    <div className="wm-admin-media-thumb">
                      {post.hero_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.hero_image_url} alt={post.title} />
                      ) : (
                        <div className="d-flex h-100 align-items-center justify-content-center text-center text-sm text-[var(--wm-muted)]">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className="wm-admin-kicker text-xs">{post.status}</span>
                        <span className="text-xs text-[var(--wm-muted)]">/{post.slug}</span>
                      </div>
                      <h4 className="mb-0 text-xl font-semibold text-[var(--wm-ink)]">{post.title}</h4>
                      <p className="mb-0 text-sm leading-7 text-[var(--wm-muted)]">{post.excerpt || "No excerpt yet."}</p>
                    </div>
                  </article>
                </Link>
              ))
            ) : (
              <p className="mb-0 text-sm text-[var(--wm-muted)]">No blog posts yet. Open the blog studio to create your first one.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
