import Link from "next/link";
import { notFound } from "next/navigation";
import ContextualSponsoredUnits from "@/components/ads/ContextualSponsoredUnits";
import BlogPostContent from "@/components/blog/BlogPostContent";
import { fillTemplate, getLanguageLocale } from "@/lib/i18n";
import { getRequestI18n } from "@/lib/i18n/server";
import { estimateReadingMinutes, parseBlogBody } from "@/lib/blog/blocks";
import { loadPost } from "@/lib/blog/content";

function formatPublishedDate(value: string | null, locale: string): string {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(locale, {
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

  const { dictionary, language } = await getRequestI18n();
  const labels = dictionary.blog.postPage;
  const locale = getLanguageLocale(language);
  const blocks = parseBlogBody(post.body);
  const readingMinutes = estimateReadingMinutes(blocks);
  const publishedDate = formatPublishedDate(post.published_at, locale);

  return (
    <main className="wm-blog-post-page">
      <section className="wm-blog-post-shell container">
        <nav className="mb-4" aria-label={labels.breadcrumbAria}>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link href="/blog">{dictionary.nav.blog}</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {post.title}
            </li>
          </ol>
        </nav>

        <article className="wm-blog-post-article mx-auto">
          <header className="wm-blog-post-header">
            <p className="wm-blog-kicker mb-3">{labels.kicker}</p>
            <h1 className="wm-blog-post-title">{post.title}</h1>
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 text-secondary">
              {publishedDate && <span>{publishedDate}</span>}
              {readingMinutes > 0 && <span>{fillTemplate(labels.minutesToRead, { count: readingMinutes })}</span>}
            </div>
            {post.excerpt && <p className="wm-blog-post-dek">{post.excerpt}</p>}
          </header>

          {post.hero_image_url && (
            <figure className="wm-blog-post-hero">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.hero_image_url} alt={post.title} className="img-fluid rounded-4 shadow-sm" />
            </figure>
          )}

          <ContextualSponsoredUnits
            pageKey="blog-post"
            headline={post.title}
            keywords={post.excerpt ? [post.excerpt] : []}
          />

          <div className="wm-blog-post-content-wrap">
            <BlogPostContent body={post.body} emptyMessage={labels.emptyContent} />
          </div>
        </article>
      </section>
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
