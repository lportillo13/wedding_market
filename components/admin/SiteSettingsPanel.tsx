"use client";

import { FormEvent, useMemo, useState } from "react";
import type { SupportedLanguage } from "@/lib/i18n";
import { uploadWithProgress } from "@/lib/client/uploads";
import {
  buildSiteContentTemplates,
  type BlogIndexContent,
  type HomepageContent,
  type HomepageCategoryItem,
  type HomepageHighlightItem,
} from "@/lib/content/siteContent";

type SettingRow = { key: string; value: string };

type Props = {
  initialSettings: Record<string, string>;
  errorMessage?: string;
};

const TEMPLATES = buildSiteContentTemplates();
const LANGUAGES: SupportedLanguage[] = ["en", "es"];
const KNOWN_KEYS = new Set(["homepage.content", "blog.index.content", "footer.contact_email"]);

function safeParse<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function parseInitialContent(initialSettings: Record<string, string>) {
  return {
    homepage: safeParse<Record<SupportedLanguage, HomepageContent>>(
      initialSettings["homepage.content"],
      clone(TEMPLATES["homepage.content"])
    ),
    blogIndex: safeParse<Record<SupportedLanguage, BlogIndexContent>>(
      initialSettings["blog.index.content"],
      clone(TEMPLATES["blog.index.content"])
    ),
    footerEmail: initialSettings["footer.contact_email"] ?? "",
    customEntries: Object.entries(initialSettings)
      .filter(([key]) => !KNOWN_KEYS.has(key))
      .map(([key, value]) => ({ key, value })),
  };
}

function updateItem<T>(items: T[], index: number, nextItem: T) {
  return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
}

export default function SiteSettingsPanel({ initialSettings, errorMessage }: Props) {
  const initial = useMemo(() => parseInitialContent(initialSettings), [initialSettings]);
  const [locale, setLocale] = useState<SupportedLanguage>("en");
  const [homepage, setHomepage] = useState(initial.homepage);
  const [blogIndex, setBlogIndex] = useState(initial.blogIndex);
  const [footerEmail, setFooterEmail] = useState(initial.footerEmail);
  const [customEntries, setCustomEntries] = useState<SettingRow[]>(initial.customEntries);
  const [customKey, setCustomKey] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(errorMessage ?? null);
  const [heroUploadProgress, setHeroUploadProgress] = useState(0);
  const [heroUploadPending, setHeroUploadPending] = useState(false);

  const homepageDraft = homepage[locale];
  const blogDraft = blogIndex[locale];

  function updateHomepage(next: HomepageContent) {
    setHomepage((current) => ({ ...current, [locale]: next }));
  }

  function updateBlog(next: BlogIndexContent) {
    setBlogIndex((current) => ({ ...current, [locale]: next }));
  }

  function updateHighlight(index: number, next: HomepageHighlightItem) {
    updateHomepage({
      ...homepageDraft,
      highlights: {
        ...homepageDraft.highlights,
        items: updateItem(homepageDraft.highlights.items, index, next),
      },
    });
  }

  function updateCategory(index: number, next: HomepageCategoryItem) {
    updateHomepage({
      ...homepageDraft,
      categories: {
        ...homepageDraft.categories,
        items: updateItem(homepageDraft.categories.items, index, next),
      },
    });
  }

  function updateCustomEntry(index: number, value: string) {
    setCustomEntries((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, value } : row)));
  }

  function addCustomEntry() {
    const key = customKey.trim();
    if (!key) return;
    if (KNOWN_KEYS.has(key) || customEntries.some((entry) => entry.key === key)) {
      setMessage(`The key "${key}" already exists.`);
      setStatus("error");
      return;
    }

    setCustomEntries((rows) => [...rows, { key, value: "" }]);
    setCustomKey("");
    setMessage(null);
    setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);

    try {
      const payload: Record<string, unknown> = {
        "homepage.content": homepage,
        "blog.index.content": blogIndex,
        "footer.contact_email": footerEmail.trim(),
      };

      for (const entry of customEntries) {
        payload[entry.key] = entry.value;
      }

      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save page content");
      }

      setStatus("success");
      setMessage("Content updated");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unknown error");
    }
  }

  async function handleHomepageHeroUpload(file: File | null) {
    if (!file) return;

    try {
      setHeroUploadPending(true);
      setHeroUploadProgress(0);
      setMessage(null);
      const payload = new FormData();
      payload.set("target", "website-homepage-hero");
      payload.set("file", file);

      const response = await uploadWithProgress<{ asset: { url: string } }>("/api/uploads", payload, setHeroUploadProgress);
      updateHomepage({
        ...homepageDraft,
        hero: {
          ...homepageDraft.hero,
          imageUrl: response.asset.url,
        },
      });
      setMessage("Homepage hero image uploaded.");
      setStatus("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload image.");
      setStatus("error");
    } finally {
      setHeroUploadPending(false);
    }
  }

  return (
    <section className="wm-admin-surface p-6 lg:p-8">
      <header className="mb-8 d-grid gap-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <p className="wm-admin-kicker">Page content</p>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--wm-ink)]">Edit pages with previews, not raw JSON.</h2>
          </div>
          <div className="d-flex gap-2">
            {LANGUAGES.map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => setLocale(language)}
                className={`btn ${locale === language ? "btn-primary" : "btn-outline-secondary"}`}
              >
                {language.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-0 max-w-3xl text-base leading-8 text-[var(--wm-muted)]">
          Update homepage images, copy, category cards, and blog landing-page messaging from one editing surface. The preview
          cards below show how each section will feel on the public site.
        </p>
      </header>

      {message ? (
        <div
          className={`mb-6 rounded-4 px-4 py-3 text-sm ${
            status === "error" ? "border border-danger-subtle bg-danger-subtle text-danger-emphasis" : "border border-light-subtle bg-white text-body"
          }`}
        >
          {message}
        </div>
      ) : null}

      <form className="space-y-8" onSubmit={handleSubmit}>
        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(26rem,0.85fr)]">
          <div className="wm-admin-overview-card p-5">
            <p className="wm-admin-kicker">Homepage hero</p>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--wm-ink)]">Badge</span>
                <input
                  className="wm-admin-input"
                  value={homepageDraft.hero.badge}
                  onChange={(event) =>
                    updateHomepage({ ...homepageDraft, hero: { ...homepageDraft.hero, badge: event.target.value } })
                  }
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--wm-ink)]">Title</span>
                <input
                  className="wm-admin-input"
                  value={homepageDraft.hero.title}
                  onChange={(event) =>
                    updateHomepage({ ...homepageDraft, hero: { ...homepageDraft.hero, title: event.target.value } })
                  }
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--wm-ink)]">Description</span>
                <textarea
                  className="wm-admin-textarea"
                  value={homepageDraft.hero.description}
                  onChange={(event) =>
                    updateHomepage({ ...homepageDraft, hero: { ...homepageDraft.hero, description: event.target.value } })
                  }
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-[var(--wm-ink)]">Primary CTA label</span>
                  <input
                    className="wm-admin-input"
                    value={homepageDraft.hero.primaryCtaLabel}
                    onChange={(event) =>
                      updateHomepage({ ...homepageDraft, hero: { ...homepageDraft.hero, primaryCtaLabel: event.target.value } })
                    }
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-[var(--wm-ink)]">Primary CTA link</span>
                  <input
                    className="wm-admin-input"
                    value={homepageDraft.hero.primaryCtaHref}
                    onChange={(event) =>
                      updateHomepage({ ...homepageDraft, hero: { ...homepageDraft.hero, primaryCtaHref: event.target.value } })
                    }
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-[var(--wm-ink)]">Secondary CTA label</span>
                  <input
                    className="wm-admin-input"
                    value={homepageDraft.hero.secondaryCtaLabel}
                    onChange={(event) =>
                      updateHomepage({ ...homepageDraft, hero: { ...homepageDraft.hero, secondaryCtaLabel: event.target.value } })
                    }
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-[var(--wm-ink)]">Secondary CTA link</span>
                  <input
                    className="wm-admin-input"
                    value={homepageDraft.hero.secondaryCtaHref}
                    onChange={(event) =>
                      updateHomepage({ ...homepageDraft, hero: { ...homepageDraft.hero, secondaryCtaHref: event.target.value } })
                    }
                  />
                </label>
              </div>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--wm-ink)]">Hero image URL</span>
                <input
                  className="wm-admin-input"
                  value={homepageDraft.hero.imageUrl}
                  onChange={(event) =>
                    updateHomepage({ ...homepageDraft, hero: { ...homepageDraft.hero, imageUrl: event.target.value } })
                  }
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--wm-ink)]">Upload hero image</span>
                <input
                  className="wm-admin-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleHomepageHeroUpload(event.target.files?.[0] ?? null)}
                  disabled={heroUploadPending}
                />
              </label>
              {heroUploadPending ? (
                <div className="progress" role="progressbar" aria-valuenow={heroUploadProgress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${heroUploadProgress}%` }}>
                    {heroUploadProgress}%
                  </div>
                </div>
              ) : null}
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--wm-ink)]">Hero image alt text</span>
                <input
                  className="wm-admin-input"
                  value={homepageDraft.hero.imageAlt}
                  onChange={(event) =>
                    updateHomepage({ ...homepageDraft, hero: { ...homepageDraft.hero, imageAlt: event.target.value } })
                  }
                />
              </label>
            </div>
          </div>

          <div className="wm-admin-overview-card p-5">
            <p className="wm-admin-kicker">Homepage preview</p>
            <div className="mt-4 space-y-4">
              <div className="wm-admin-media-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={homepageDraft.hero.imageUrl} alt={homepageDraft.hero.imageAlt || homepageDraft.hero.title} />
              </div>
              <span className="rounded-pill bg-primary-subtle px-3 py-2 text-primary-emphasis fw-semibold d-inline-flex">
                {homepageDraft.hero.badge}
              </span>
              <h3 className="wm-admin-preview-title mb-0">{homepageDraft.hero.title}</h3>
              <p className="mb-0 text-base leading-8 text-[var(--wm-muted)]">{homepageDraft.hero.description}</p>
              <div className="d-flex flex-wrap gap-3">
                <span className="btn btn-primary">{homepageDraft.hero.primaryCtaLabel}</span>
                <span className="btn btn-outline-secondary">{homepageDraft.hero.secondaryCtaLabel}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="wm-admin-overview-card p-5">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <p className="wm-admin-kicker">Highlights</p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--wm-ink)]">Homepage benefit cards</h3>
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--wm-ink)]">Section heading</span>
              <input
                className="wm-admin-input min-w-[18rem]"
                value={homepageDraft.highlights.heading}
                onChange={(event) =>
                  updateHomepage({
                    ...homepageDraft,
                    highlights: { ...homepageDraft.highlights, heading: event.target.value },
                  })
                }
              />
            </label>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {homepageDraft.highlights.items.map((item, index) => (
              <article key={`${locale}-highlight-${index}`} className="wm-admin-overview-card p-4">
                <p className="wm-admin-kicker text-xs">Card {index + 1}</p>
                <div className="mt-3 grid gap-3">
                  <input
                    className="wm-admin-input"
                    value={item.title}
                    onChange={(event) => updateHighlight(index, { ...item, title: event.target.value })}
                  />
                  <textarea
                    className="wm-admin-textarea"
                    value={item.description}
                    onChange={(event) => updateHighlight(index, { ...item, description: event.target.value })}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.9fr)]">
          <div className="wm-admin-overview-card p-5">
            <p className="wm-admin-kicker">Category showcase</p>
            <div className="mt-4 grid gap-4">
              <input
                className="wm-admin-input"
                value={homepageDraft.categories.heading}
                onChange={(event) =>
                  updateHomepage({
                    ...homepageDraft,
                    categories: { ...homepageDraft.categories, heading: event.target.value },
                  })
                }
              />
              <textarea
                className="wm-admin-textarea"
                value={homepageDraft.categories.description}
                onChange={(event) =>
                  updateHomepage({
                    ...homepageDraft,
                    categories: { ...homepageDraft.categories, description: event.target.value },
                  })
                }
              />
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  className="wm-admin-input"
                  value={homepageDraft.categories.viewAll}
                  onChange={(event) =>
                    updateHomepage({
                      ...homepageDraft,
                      categories: { ...homepageDraft.categories, viewAll: event.target.value },
                    })
                  }
                />
                <input
                  className="wm-admin-input"
                  value={homepageDraft.categories.spotlightLabel}
                  onChange={(event) =>
                    updateHomepage({
                      ...homepageDraft,
                      categories: { ...homepageDraft.categories, spotlightLabel: event.target.value },
                    })
                  }
                />
                <input
                  className="wm-admin-input"
                  value={homepageDraft.categories.seeVendors}
                  onChange={(event) =>
                    updateHomepage({
                      ...homepageDraft,
                      categories: { ...homepageDraft.categories, seeVendors: event.target.value },
                    })
                  }
                />
              </div>

              <div className="grid gap-3">
                {homepageDraft.categories.items.map((item, index) => (
                  <div key={`${locale}-category-${index}`} className="grid gap-3 md:grid-cols-[1fr_12rem]">
                    <input
                      className="wm-admin-input"
                      value={item.label}
                      onChange={(event) => updateCategory(index, { ...item, label: event.target.value })}
                    />
                    <input
                      className="wm-admin-input"
                      value={item.slug}
                      onChange={(event) => updateCategory(index, { ...item, slug: event.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="wm-admin-overview-card p-5">
            <p className="wm-admin-kicker">Planning section</p>
            <div className="mt-4 grid gap-4">
              <input
                className="wm-admin-input"
                value={homepageDraft.plan.heading}
                onChange={(event) =>
                  updateHomepage({ ...homepageDraft, plan: { ...homepageDraft.plan, heading: event.target.value } })
                }
              />
              <textarea
                className="wm-admin-textarea"
                value={homepageDraft.plan.description}
                onChange={(event) =>
                  updateHomepage({ ...homepageDraft, plan: { ...homepageDraft.plan, description: event.target.value } })
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="wm-admin-input"
                  value={homepageDraft.plan.ctaLabel}
                  onChange={(event) =>
                    updateHomepage({ ...homepageDraft, plan: { ...homepageDraft.plan, ctaLabel: event.target.value } })
                  }
                />
                <input
                  className="wm-admin-input"
                  value={homepageDraft.plan.ctaHref}
                  onChange={(event) =>
                    updateHomepage({ ...homepageDraft, plan: { ...homepageDraft.plan, ctaHref: event.target.value } })
                  }
                />
              </div>

              <div className="rounded-4 border border-[var(--wm-outline)] bg-white/70 p-4">
                <p className="wm-admin-kicker text-xs">Public preview</p>
                <h4 className="mt-2 text-2xl font-semibold text-[var(--wm-ink)]">{homepageDraft.plan.heading}</h4>
                <p className="mb-3 text-sm leading-7 text-[var(--wm-muted)]">{homepageDraft.plan.description}</p>
                <span className="btn btn-primary">{homepageDraft.plan.ctaLabel}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(26rem,0.85fr)]">
          <div className="wm-admin-overview-card p-5">
            <p className="wm-admin-kicker">Blog landing page</p>
            <div className="mt-4 grid gap-4">
              <input
                className="wm-admin-input"
                value={blogDraft.kicker}
                onChange={(event) => updateBlog({ ...blogDraft, kicker: event.target.value })}
              />
              <input
                className="wm-admin-input"
                value={blogDraft.title}
                onChange={(event) => updateBlog({ ...blogDraft, title: event.target.value })}
              />
              <textarea
                className="wm-admin-textarea"
                value={blogDraft.subtitle}
                onChange={(event) => updateBlog({ ...blogDraft, subtitle: event.target.value })}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="wm-admin-input"
                  value={blogDraft.latestPostsLabel}
                  onChange={(event) => updateBlog({ ...blogDraft, latestPostsLabel: event.target.value })}
                />
                <input
                  className="wm-admin-input"
                  value={blogDraft.latestPostsTitle}
                  onChange={(event) => updateBlog({ ...blogDraft, latestPostsTitle: event.target.value })}
                />
                <input
                  className="wm-admin-input"
                  value={blogDraft.readArticleLabel}
                  onChange={(event) => updateBlog({ ...blogDraft, readArticleLabel: event.target.value })}
                />
                <input
                  className="wm-admin-input"
                  value={blogDraft.emptyState}
                  onChange={(event) => updateBlog({ ...blogDraft, emptyState: event.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="wm-admin-overview-card p-5">
            <p className="wm-admin-kicker">Blog preview</p>
            <div className="mt-4 space-y-4">
              <span className="wm-blog-kicker">{blogDraft.kicker}</span>
              <h3 className="wm-admin-preview-title mb-0">{blogDraft.title}</h3>
              <p className="mb-0 text-base leading-8 text-[var(--wm-muted)]">{blogDraft.subtitle}</p>
              <div className="wm-blog-stats-card">
                <p className="wm-blog-stats-label">{blogDraft.statsLabel}</p>
                <div className="wm-blog-stats-grid">
                  <div>
                    <strong>12</strong>
                    <span>{blogDraft.statsStoriesLabel}</span>
                  </div>
                  <div>
                    <strong>5</strong>
                    <span>{blogDraft.statsSampleLabel}</span>
                  </div>
                  <div>
                    <strong>{blogDraft.statsIdeasValue}</strong>
                    <span>{blogDraft.statsIdeasLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="wm-admin-overview-card p-5">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <p className="wm-admin-kicker">Advanced settings</p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--wm-ink)]">Footer and custom keys</h3>
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium text-[var(--wm-ink)]">Footer contact email</span>
              <input className="wm-admin-input min-w-[18rem]" value={footerEmail} onChange={(event) => setFooterEmail(event.target.value)} />
            </div>
          </div>

          <details className="mt-5 rounded-4 border border-[var(--wm-outline)] bg-white/70 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--wm-ink)]">Custom keys</summary>
            <div className="mt-4 grid gap-4">
              {customEntries.length > 0 ? (
                customEntries.map((entry, index) => (
                  <label key={entry.key} className="grid gap-2">
                    <span className="text-sm font-medium text-[var(--wm-ink)]">{entry.key}</span>
                    <textarea
                      className="wm-admin-textarea"
                      value={entry.value}
                      onChange={(event) => updateCustomEntry(index, event.target.value)}
                    />
                  </label>
                ))
              ) : (
                <p className="mb-0 text-sm text-[var(--wm-muted)]">No extra custom keys yet.</p>
              )}

              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  className="wm-admin-input"
                  placeholder="Add a custom key"
                  value={customKey}
                  onChange={(event) => setCustomKey(event.target.value)}
                />
                <button type="button" className="btn btn-outline-secondary" onClick={addCustomEntry}>
                  Add key
                </button>
              </div>
            </div>
          </details>
        </section>

        <div className="d-flex justify-content-end">
          <button type="submit" className="btn btn-primary px-4" disabled={status === "saving"}>
            {status === "saving" ? "Saving..." : "Save page content"}
          </button>
        </div>
      </form>
    </section>
  );
}
