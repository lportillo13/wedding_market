"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ContextualSponsoredUnits from "@/components/ads/ContextualSponsoredUnits";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getDefaultBlogIndexContent,
  type BlogIndexContent,
} from "@/lib/content/siteContent";
import type { BlogSummary } from "@/lib/blog/content";

type Props = {
  posts: BlogSummary[];
};

function formatPublishedDate(value: string | null, language: "en" | "es"): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(language === "es" ? "es-ES" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function BlogIndexPageContent({ posts }: Props) {
  const { language } = useLanguage();
  const fallbackContent = useMemo(() => getDefaultBlogIndexContent(language), [language]);
  const [managedContent, setManagedContent] = useState<{
    language: string;
    value: BlogIndexContent;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadManagedContent() {
      try {
        const response = await fetch(`/api/content/site-settings?lang=${encodeURIComponent(language)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { blogIndex?: BlogIndexContent };
        if (!cancelled && payload.blogIndex) {
          setManagedContent({ language, value: payload.blogIndex });
        }
      } catch {
        if (!cancelled) {
          setManagedContent(null);
        }
        // Keep default copy when managed content is unavailable.
      }
    }

    void loadManagedContent();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const content = managedContent?.language === language ? managedContent.value : fallbackContent;

  const featuredPost = posts[0] ?? null;
  const secondaryPosts = featuredPost ? posts.slice(1) : posts;
  const blogKeywords = useMemo(
    () =>
      posts.slice(0, 6).flatMap((post) => [post.category ?? "", post.title, post.excerpt ?? ""]),
    [posts],
  );

  return (
    <main className="wm-blog-page">
      <section className="wm-blog-hero">
        <div className="container">
          <div className="row align-items-end g-4">
            <div className="col-lg-7">
              <span className="wm-blog-kicker">{content.kicker}</span>
              <h1 className="wm-blog-title">{content.title}</h1>
              <p className="wm-blog-subtitle">{content.subtitle}</p>
            </div>
            <div className="col-lg-5">
              <div className="wm-blog-stats-card">
                <p className="wm-blog-stats-label">{content.statsLabel}</p>
                <div className="wm-blog-stats-grid">
                  <div>
                    <strong>{posts.length}</strong>
                    <span>{content.statsStoriesLabel}</span>
                  </div>
                  <div>
                    <strong>5</strong>
                    <span>{content.statsSampleLabel}</span>
                  </div>
                  <div>
                    <strong>{content.statsIdeasValue}</strong>
                    <span>{content.statsIdeasLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container pb-5">
        {featuredPost ? (
          <section className="wm-blog-featured mb-5">
            <article className="row g-0 overflow-hidden">
              <div className="col-lg-7">
                {featuredPost.hero_image_url && (
                  <div className="wm-blog-featured-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={featuredPost.hero_image_url} alt={featuredPost.title} className="w-100 h-100 object-fit-cover" />
                  </div>
                )}
              </div>
              <div className="col-lg-5">
                <div className="wm-blog-featured-body">
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    {featuredPost.category && <span className="wm-blog-chip">{featuredPost.category}</span>}
                    <p className="wm-blog-meta mb-0">
                      {formatPublishedDate(featuredPost.published_at, language)}
                      {featuredPost.author ? ` — ${featuredPost.author}` : ""}
                    </p>
                  </div>
                  <h2>
                    <Link href={`/blog/${featuredPost.slug}`} className="stretched-link text-decoration-none text-reset">
                      {featuredPost.title}
                    </Link>
                  </h2>
                  {featuredPost.excerpt && <p>{featuredPost.excerpt}</p>}
                  <span className="wm-blog-readmore">{content.readArticleLabel}</span>
                </div>
              </div>
            </article>
          </section>
        ) : (
          <p className="text-center text-secondary">{content.emptyState}</p>
        )}

        <ContextualSponsoredUnits
          pageKey="blog"
          headline={content.title}
          keywords={blogKeywords}
        />

        {secondaryPosts.length > 0 && (
          <section>
            <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
              <div>
                <span className="wm-blog-kicker">{content.latestPostsLabel}</span>
                <h2 className="wm-section-title mb-0">{content.latestPostsTitle}</h2>
              </div>
            </div>
            <div className="row g-4">
              {secondaryPosts.map((post) => {
                const publishedDate = formatPublishedDate(post.published_at, language);
                return (
                  <div key={post.id} className="col-md-6">
                    <article className="wm-blog-card h-100">
                      {post.hero_image_url && (
                        <div className="wm-blog-card-media">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post.hero_image_url} alt={post.title} className="w-100 h-100 object-fit-cover" />
                        </div>
                      )}
                      <div className="wm-blog-card-body">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {post.category && <span className="wm-blog-chip">{post.category}</span>}
                          {publishedDate && <p className="wm-blog-meta mb-0">{publishedDate}</p>}
                        </div>
                        <h2 className="h3 fw-semibold mb-0">
                          <Link href={`/blog/${post.slug}`} className="text-decoration-none stretched-link text-reset">
                            {post.title}
                          </Link>
                        </h2>
                        {post.excerpt && <p className="mb-0 text-secondary">{post.excerpt}</p>}
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
