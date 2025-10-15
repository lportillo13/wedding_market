"use client";

import { FormEvent, useMemo, useState } from "react";

type AdminPost = {
  id: string;
  title: string;
  slug: string;
  status: string;
  excerpt: string | null;
  hero_image_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  body?: string | null;
};

type Props = {
  initialPosts: AdminPost[];
  errorMessage?: string;
};

type PostDraft = {
  title: string;
  slug: string;
  excerpt: string;
  hero_image_url: string;
  body: string;
  status: "draft" | "published";
};

const EMPTY_DRAFT: PostDraft = {
  title: "",
  slug: "",
  excerpt: "",
  hero_image_url: "",
  body: "",
  status: "draft",
};

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function BlogPostManager({ initialPosts, errorMessage }: Props) {
  const [posts, setPosts] = useState<AdminPost[]>(initialPosts);
  const [draft, setDraft] = useState<PostDraft>(EMPTY_DRAFT);
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "success">("idle");
  const [message, setMessage] = useState<string | null>(errorMessage ?? null);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);

    try {
      const response = await fetch("/api/admin/blog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          slug: draft.slug,
          excerpt: draft.excerpt,
          hero_image_url: draft.hero_image_url,
          body: draft.body,
          status: draft.status,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create post");
      }

      if (payload.post) {
        setPosts((current) => [payload.post as AdminPost, ...current]);
      }

      setDraft(EMPTY_DRAFT);
      setStatus("success");
      setMessage("Post created");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unknown error");
    }
  }

  async function handleUpdate(id: string, updates: Partial<AdminPost>) {
    setBusyPostId(id);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/blog-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update post");
      }

      setPosts((current) =>
        current.map((post) => {
          if (post.id !== id) return post;
          const next = payload.post ? (payload.post as AdminPost) : post;
          return { ...next, ...updates };
        })
      );

      setMessage("Post updated");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this post? This action cannot be undone.")) {
      return;
    }

    setBusyPostId(id);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/blog-posts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete post");
      }

      setPosts((current) => current.filter((post) => post.id !== id));
      setMessage("Post deleted");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setBusyPostId(null);
    }
  }

  const hasPosts = useMemo(() => posts.length > 0, [posts.length]);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 shadow-xl shadow-slate-900/20">
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Publishing</p>
          <h2 className="text-2xl font-semibold text-white">Blog posts</h2>
        </div>
        <p className="max-w-lg text-sm text-slate-400">
          Draft and publish long-form content for the Wedding Market blog. Newly created posts start in draft mode; publish when
          you&apos;re ready to go live.
        </p>
      </header>

      {message && (
        <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
          {message}
        </div>
      )}

      <form onSubmit={handleCreate} className="mb-10 grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-6">
        <h3 className="text-lg font-semibold text-white">Create new post</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-200">
            Title
            <input
              required
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-200">
            Slug
            <input
              required
              value={draft.slug}
              onChange={(event) => setDraft((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="unique-post-slug"
              className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm text-slate-200">
          Excerpt
          <textarea
            value={draft.excerpt}
            onChange={(event) => setDraft((prev) => ({ ...prev, excerpt: event.target.value }))}
            rows={3}
            className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-200">
          Hero image URL
          <input
            value={draft.hero_image_url}
            onChange={(event) => setDraft((prev) => ({ ...prev, hero_image_url: event.target.value }))}
            placeholder="https://cdn.example.com/blog/hero.jpg"
            className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-200">
          Body
          <textarea
            value={draft.body}
            onChange={(event) => setDraft((prev) => ({ ...prev, body: event.target.value }))}
            rows={8}
            className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={draft.status === "published"}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, status: event.target.checked ? "published" : "draft" }))
              }
              className="h-4 w-4 rounded border border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            Publish immediately
          </label>
          <button
            type="submit"
            className="ml-auto rounded-2xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
            disabled={status === "saving"}
          >
            {status === "saving" ? "Saving…" : "Create post"}
          </button>
        </div>
      </form>

      <div className="grid gap-6">
        {hasPosts ? (
          posts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div className="grow">
                  <h3 className="text-xl font-semibold text-white">{post.title || "Untitled"}</h3>
                  <p className="text-sm text-slate-400">/{post.slug}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                    post.status === "published"
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-amber-500/20 text-amber-200"
                  }`}
                >
                  {post.status}
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
                <div>
                  <dt className="uppercase tracking-[0.2em]">Updated</dt>
                  <dd>{formatTimestamp(post.updated_at)}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.2em]">Published</dt>
                  <dd>{formatTimestamp(post.published_at)}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.2em]">Hero image</dt>
                  <dd>{post.hero_image_url || "—"}</dd>
                </div>
              </dl>
              <textarea
                key={`${post.id}-${post.updated_at}-${post.excerpt ?? ""}`}
                defaultValue={post.excerpt ?? ""}
                onBlur={(event) => {
                  const value = event.target.value;
                  if (value !== (post.excerpt ?? "")) {
                    handleUpdate(post.id, { excerpt: value });
                  }
                }}
                rows={3}
                placeholder="Short summary shown on listings"
                className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() =>
                    handleUpdate(post.id, {
                      status: post.status === "published" ? "draft" : "published",
                    })
                  }
                  className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
                  disabled={busyPostId === post.id}
                >
                  {post.status === "published" ? "Move to draft" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdate(post.id, {
                      hero_image_url: window.prompt("Hero image URL", post.hero_image_url ?? "") ?? post.hero_image_url ?? "",
                    })
                  }
                  className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
                  disabled={busyPostId === post.id}
                >
                  Update hero image
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdate(post.id, {
                      title: window.prompt("Title", post.title ?? "") ?? post.title ?? "",
                    })
                  }
                  className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
                  disabled={busyPostId === post.id}
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(post.id)}
                  className="ml-auto rounded-2xl border border-rose-500/60 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10"
                  disabled={busyPostId === post.id}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-400">No blog posts yet. Use the form above to create your first story.</p>
        )}
      </div>
    </section>
  );
}
