import Link from "next/link";
import { notFound } from "next/navigation";
import BlogPostContent from "@/components/blog/BlogPostContent";
import { parseBlogBody, estimateReadingMinutes, type BlogPostRecord } from "@/lib/blog/blocks";
import { getSupabaseForBlog } from "@/lib/blog/supabase";

async function loadPost(slug: string): Promise<BlogPostRecord | null> {
  const supabase = await getSupabaseForBlog();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, status, excerpt, hero_image_url, published_at, updated_at, body")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<BlogPostRecord>();

  if (error) {
    console.error("Unable to load blog post", error.message);
    return null;
  }

  return data ?? null;
}

function formatPublishedDate(value: string | null): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await loadPost(slug);

  if (!post) {
    notFound();
  }

  const resolvedPost = post;
  const blocks = parseBlogBody(resolvedPost.body);
  const readingMinutes = estimateReadingMinutes(blocks);
  const publishedDate = formatPublishedDate(resolvedPost.published_at);

  return (
    <main className="py-5">
      <div className="container">
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link href="/blog">Blog</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {resolvedPost.title}
            </li>
          </ol>
        </nav>

        <article className="mx-auto" style={{ maxWidth: "720px" }}>
          <header className="mb-5 text-center">
            <h1 className="display-4 fw-bold mb-3">{resolvedPost.title}</h1>
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 text-secondary">
              {publishedDate && <span>{publishedDate}</span>}
              {readingMinutes > 0 && <span>{readingMinutes} min read</span>}
            </div>
          </header>

          {resolvedPost.hero_image_url && (
            <figure className="mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolvedPost.hero_image_url} alt={resolvedPost.title} className="img-fluid rounded-4 shadow-sm" />
              {resolvedPost.excerpt && (
                <figcaption className="mt-2 text-secondary small">{resolvedPost.excerpt}</figcaption>
              )}
            </figure>
          )}

          <BlogPostContent body={resolvedPost.body} />
        </article>
      </div>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await loadPost(slug);

  if (!post) {
    return {
      title: "Blog | Wedding Market",
    };
  }

  return {
    title: `${post.title} | Wedding Market`,
    description: post.excerpt ?? undefined,
  };
}
