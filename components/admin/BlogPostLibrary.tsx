"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AutocompleteInput from "@/components/search/AutocompleteInput";
import { buildAutocompleteSuggestions } from "@/lib/search/autocomplete";
import type { AdminPost } from "@/components/admin/BlogPostManager";

type Props = {
  posts: AdminPost[];
};

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "Unscheduled";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function BlogPostLibrary({ posts }: Props) {
  const [query, setQuery] = useState("");
  const suggestions = useMemo(
    () => buildAutocompleteSuggestions(posts.flatMap((post) => [post.title, post.slug, post.excerpt]), 20),
    [posts],
  );

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return posts;

    return posts.filter((post) =>
      [post.title, post.slug, post.excerpt]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized))
    );
  }, [posts, query]);

  const publishedCount = posts.filter((post) => post.status === "published").length;
  const draftCount = posts.filter((post) => post.status === "draft").length;

  return (
    <section className="wm-admin-surface p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="wm-admin-kicker">Blog library</p>
          <h2 className="mt-2 text-[2rem] font-semibold text-[var(--wm-ink)]">All posts in one place.</h2>
          <p className="mb-0 mt-2 text-sm leading-7 text-[var(--wm-muted)]">
            This screen now loads up to 200 posts and lets you filter by title, slug, or excerpt.
          </p>
        </div>
        <div className="grid min-w-[18rem] gap-2">
          <label className="text-sm font-medium text-[var(--wm-ink)]" htmlFor="blog-post-library-search">
            Search posts
          </label>
          <AutocompleteInput
            id="blog-post-library-search"
            className="wm-admin-input"
            value={query}
            onValueChange={setQuery}
            placeholder="Search title, slug, or excerpt"
            ariaLabel="Search posts"
            suggestions={suggestions}
            type="text"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="wm-admin-overview-card px-4 py-3">
          <div className="text-2xl font-semibold text-[var(--wm-ink)]">{posts.length}</div>
          <div className="text-sm text-[var(--wm-muted)]">loaded posts</div>
        </div>
        <div className="wm-admin-overview-card px-4 py-3">
          <div className="text-2xl font-semibold text-[var(--wm-ink)]">{publishedCount}</div>
          <div className="text-sm text-[var(--wm-muted)]">published</div>
        </div>
        <div className="wm-admin-overview-card px-4 py-3">
          <div className="text-2xl font-semibold text-[var(--wm-ink)]">{draftCount}</div>
          <div className="text-sm text-[var(--wm-muted)]">drafts</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredPosts.map((post) => (
          <Link
            key={post.id}
            href={`/private-control-room-hub/blog-posts?edit=${encodeURIComponent(post.id)}#studio`}
            className="wm-admin-card-link"
          >
            <article className="wm-admin-media-card h-100 p-4">
              <div className="wm-admin-media-thumb">
                {post.hero_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.hero_image_url} alt={post.title} />
                ) : (
                  <div className="d-flex h-100 align-items-center justify-content-center text-center text-sm text-[var(--wm-muted)]">
                    Add a hero image
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <span className="wm-admin-kicker text-xs">{post.status}</span>
                  <span className="text-xs text-[var(--wm-muted)]">{formatTimestamp(post.published_at || post.updated_at)}</span>
                </div>
                <h3 className="mb-0 text-[1.35rem] font-semibold leading-tight text-[var(--wm-ink)]">
                  {post.title || "Untitled post"}
                </h3>
                <p className="mb-0 text-sm text-[var(--wm-muted)]">/{post.slug}</p>
                <p className="mb-0 text-sm leading-7 text-[var(--wm-muted)]">{post.excerpt || "No excerpt yet."}</p>
                <span className="text-sm fw-semibold text-primary">Open in studio</span>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <p className="mb-0 mt-6 text-sm text-[var(--wm-muted)]">No posts match that search.</p>
      ) : null}
    </section>
  );
}
