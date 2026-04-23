"use client";

import { FormEvent, useMemo, useState } from "react";
import VendorAdsBanner from "@/components/ads/VendorAdsBanner";
import { uploadWithProgress } from "@/lib/client/uploads";
import {
  cloneVendorAdsConfig,
  createEmptySponsoredPlacement,
  type VendorAdTargeting,
  type VendorAdsBanner as VendorAdsBannerConfig,
  type VendorAdsConfig,
  type VendorAdsVendorOption,
} from "@/lib/content/vendorAds";
import type { SupportedLanguage } from "@/lib/i18n";

type Props = {
  initialConfig: VendorAdsConfig;
  vendors: VendorAdsVendorOption[];
};

type BannerKey = "directoryBanner" | "profileBanner";
type BannerCopyKey = "badge" | "title" | "description" | "ctaLabel" | "imageAlt";
type PlacementCopyKey = "badge" | "note" | "ctaLabel";
type TargetingListKey = "categories" | "themes" | "countries" | "keywords";
type TargetingNumberKey = "minBudget" | "maxBudget" | "minGuestCount" | "maxGuestCount";

const LANGUAGES: SupportedLanguage[] = ["en", "es"];

function updateLocalizedValue<T extends Record<SupportedLanguage, string>>(
  value: T,
  language: SupportedLanguage,
  next: string,
): T {
  return {
    ...value,
    [language]: next,
  };
}

function parseListValue(rawValue: string): string[] {
  return Array.from(
    new Set(
      rawValue
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry.length > 0),
    ),
  );
}

function formatListValue(values: string[]): string {
  return values.join(", ");
}

function parseNumberValue(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function VendorAdsPanel({ initialConfig, vendors }: Props) {
  const [locale, setLocale] = useState<SupportedLanguage>("en");
  const [config, setConfig] = useState(() => cloneVendorAdsConfig(initialConfig));
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<BannerKey | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const vendorLookup = useMemo(
    () => new Map(vendors.map((vendor) => [vendor.id, vendor])),
    [vendors],
  );

  function setBannerField<K extends keyof Pick<VendorAdsBannerConfig, "enabled" | "ctaHref" | "imageUrl">>(
    bannerKey: BannerKey,
    field: K,
    value: VendorAdsBannerConfig[K],
  ) {
    setConfig((current) => ({
      ...current,
      [bannerKey]: {
        ...current[bannerKey],
        [field]: value,
      },
    }));
  }

  function setBannerCopy(bannerKey: BannerKey, field: BannerCopyKey, value: string) {
    setConfig((current) => ({
      ...current,
      [bannerKey]: {
        ...current[bannerKey],
        [field]: updateLocalizedValue(current[bannerKey][field], locale, value),
      },
    }));
  }

  function setSponsoredCopy(field: "title" | "description", value: string) {
    setConfig((current) => ({
      ...current,
      sponsoredSection: {
        ...current.sponsoredSection,
        [field]: updateLocalizedValue(current.sponsoredSection[field], locale, value),
      },
    }));
  }

  function updatePlacementField(index: number, field: "vendorId" | "active", value: string | boolean) {
    setConfig((current) => ({
      ...current,
      sponsoredSection: {
        ...current.sponsoredSection,
        placements: current.sponsoredSection.placements.map((placement, placementIndex) =>
          placementIndex === index
            ? {
                ...placement,
                [field]: value,
              }
            : placement,
        ),
      },
    }));
  }

  function updatePlacementCopy(index: number, field: PlacementCopyKey, value: string) {
    setConfig((current) => ({
      ...current,
      sponsoredSection: {
        ...current.sponsoredSection,
        placements: current.sponsoredSection.placements.map((placement, placementIndex) =>
          placementIndex === index
            ? {
                ...placement,
                [field]: updateLocalizedValue(placement[field], locale, value),
              }
            : placement,
        ),
      },
    }));
  }

  function updatePlacementTargetingList(index: number, field: TargetingListKey, value: string) {
    setConfig((current) => ({
      ...current,
      sponsoredSection: {
        ...current.sponsoredSection,
        placements: current.sponsoredSection.placements.map((placement, placementIndex) =>
          placementIndex === index
            ? {
                ...placement,
                targeting: {
                  ...placement.targeting,
                  [field]: parseListValue(value),
                },
              }
            : placement,
        ),
      },
    }));
  }

  function updatePlacementTargetingNumber(index: number, field: TargetingNumberKey, value: string) {
    setConfig((current) => ({
      ...current,
      sponsoredSection: {
        ...current.sponsoredSection,
        placements: current.sponsoredSection.placements.map((placement, placementIndex) =>
          placementIndex === index
            ? {
                ...placement,
                targeting: {
                  ...placement.targeting,
                  [field]: parseNumberValue(value),
                },
              }
            : placement,
        ),
      },
    }));
  }

  function movePlacement(index: number, direction: -1 | 1) {
    setConfig((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.sponsoredSection.placements.length) {
        return current;
      }

      const placements = [...current.sponsoredSection.placements];
      const [item] = placements.splice(index, 1);
      placements.splice(targetIndex, 0, item);

      return {
        ...current,
        sponsoredSection: {
          ...current.sponsoredSection,
          placements,
        },
      };
    });
  }

  function removePlacement(index: number) {
    setConfig((current) => ({
      ...current,
      sponsoredSection: {
        ...current.sponsoredSection,
        placements: current.sponsoredSection.placements.filter((_, placementIndex) => placementIndex !== index),
      },
    }));
  }

  function addPlacement() {
    setConfig((current) => ({
      ...current,
      sponsoredSection: {
        ...current.sponsoredSection,
        placements: [
          ...current.sponsoredSection.placements,
          createEmptySponsoredPlacement(current.sponsoredSection.placements.length + 1),
        ],
      },
    }));
  }

  async function handleBannerUpload(bannerKey: BannerKey, file: File | null) {
    if (!file) {
      return;
    }

    const target =
      bannerKey === "directoryBanner"
        ? "website-vendor-directory-banner"
        : "website-vendor-profile-banner";

    try {
      setUploadTarget(bannerKey);
      setUploadProgress(0);
      setMessage(null);
      const payload = new FormData();
      payload.set("target", target);
      payload.set("file", file);

      const response = await uploadWithProgress<{ asset: { url: string } }>(
        "/api/uploads",
        payload,
        setUploadProgress,
      );

      setBannerField(bannerKey, "imageUrl", response.asset.url);
      setStatus("success");
      setMessage("Banner image uploaded.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to upload the banner image.");
    } finally {
      setUploadTarget(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);

    try {
      const response = await fetch("/api/admin/vendor-ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save vendor ads.");
      }

      setStatus("success");
      setMessage("Vendor ads updated.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unknown error.");
    }
  }

  function renderBannerEditor(
    bannerKey: BannerKey,
    label: string,
    description: string,
    previewLabel: string,
  ) {
    const banner = config[bannerKey];
    const isUploading = uploadTarget === bannerKey;

    return (
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.9fr)]">
        <div className="wm-admin-overview-card p-5">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
            <div>
              <p className="wm-admin-kicker">{label}</p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--wm-ink)]">{previewLabel}</h3>
              <p className="mb-0 mt-2 text-sm leading-7 text-[var(--wm-muted)]">{description}</p>
            </div>
            <label className="form-check form-switch mt-1">
              <input
                className="form-check-input"
                type="checkbox"
                checked={banner.enabled}
                onChange={(event) => setBannerField(bannerKey, "enabled", event.target.checked)}
              />
              <span className="form-check-label ms-2">Enabled</span>
            </label>
          </div>

          <div className="mt-4 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--wm-ink)]">Badge</span>
              <input
                className="wm-admin-input"
                value={banner.badge[locale]}
                onChange={(event) => setBannerCopy(bannerKey, "badge", event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--wm-ink)]">Title</span>
              <input
                className="wm-admin-input"
                value={banner.title[locale]}
                onChange={(event) => setBannerCopy(bannerKey, "title", event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--wm-ink)]">Description</span>
              <textarea
                className="wm-admin-textarea"
                value={banner.description[locale]}
                onChange={(event) => setBannerCopy(bannerKey, "description", event.target.value)}
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--wm-ink)]">CTA label</span>
                <input
                  className="wm-admin-input"
                  value={banner.ctaLabel[locale]}
                  onChange={(event) => setBannerCopy(bannerKey, "ctaLabel", event.target.value)}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--wm-ink)]">CTA href</span>
                <input
                  className="wm-admin-input"
                  value={banner.ctaHref}
                  onChange={(event) => setBannerField(bannerKey, "ctaHref", event.target.value)}
                />
              </label>
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--wm-ink)]">Image URL</span>
              <input
                className="wm-admin-input"
                value={banner.imageUrl}
                onChange={(event) => setBannerField(bannerKey, "imageUrl", event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--wm-ink)]">Upload banner image</span>
              <input
                className="wm-admin-input"
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={(event) => handleBannerUpload(bannerKey, event.target.files?.[0] ?? null)}
              />
            </label>
            {isUploading ? (
              <div className="progress" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${uploadProgress}%` }}>
                  {uploadProgress}%
                </div>
              </div>
            ) : null}
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--wm-ink)]">Image alt text</span>
              <input
                className="wm-admin-input"
                value={banner.imageAlt[locale]}
                onChange={(event) => setBannerCopy(bannerKey, "imageAlt", event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="wm-admin-overview-card p-5">
          <p className="wm-admin-kicker">Preview</p>
          <div className="mt-4">
            {banner.enabled ? (
              <VendorAdsBanner
                banner={banner}
                language={locale}
                variant={bannerKey === "profileBanner" ? "profile" : "directory"}
              />
            ) : (
              <p className="mb-0 text-sm text-[var(--wm-muted)]">This banner is disabled and will not render publicly.</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  function renderTargetingSummary(targeting: VendorAdTargeting): string {
    const parts: string[] = [];

    if (targeting.categories.length > 0) {
      parts.push(`categories: ${targeting.categories.join(", ")}`);
    }
    if (targeting.themes.length > 0) {
      parts.push(`themes: ${targeting.themes.join(", ")}`);
    }
    if (targeting.countries.length > 0) {
      parts.push(`countries: ${targeting.countries.join(", ")}`);
    }
    if (targeting.keywords.length > 0) {
      parts.push(`keywords: ${targeting.keywords.join(", ")}`);
    }
    if (targeting.minBudget !== null || targeting.maxBudget !== null) {
      parts.push(`budget: ${targeting.minBudget ?? 0} - ${targeting.maxBudget ?? "open"}`);
    }
    if (targeting.minGuestCount !== null || targeting.maxGuestCount !== null) {
      parts.push(`guests: ${targeting.minGuestCount ?? 0} - ${targeting.maxGuestCount ?? "open"}`);
    }

    return parts.join(" / ");
  }

  return (
    <section className="wm-admin-surface p-6 lg:p-8">
      <header className="mb-8 d-grid gap-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <p className="wm-admin-kicker">Vendor ads</p>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--wm-ink)]">
              Sponsored placements tuned to search and wedding preferences.
            </h2>
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
          Each sponsored slot can target a search category, wedding theme, country, budget range, guest count, and custom
          keywords. Those same managed slots now power contextual banners and side rails across the public directory,
          homepage, blog, shortlist, RFQ, and vendor profile pages using the current page intent plus what the client
          already saved in their wedding profile or most recent request form.
        </p>
      </header>

      {message ? (
        <div
          className={`mb-6 rounded-4 px-4 py-3 text-sm ${
            status === "error"
              ? "border border-danger-subtle bg-danger-subtle text-danger-emphasis"
              : "border border-light-subtle bg-white text-body"
          }`}
        >
          {message}
        </div>
      ) : null}

      <form className="space-y-8" onSubmit={handleSubmit}>
        {renderBannerEditor(
          "directoryBanner",
          "Directory banner",
          "Large-format banner that sits above the sponsored vendor section on the /vendors page.",
          "Vendor directory hero",
        )}

        <section className="wm-admin-overview-card p-5">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
            <div>
              <p className="wm-admin-kicker">Sponsored section</p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--wm-ink)]">Paid vendor recommendations</h3>
              <p className="mb-0 mt-2 text-sm leading-7 text-[var(--wm-muted)]">
                These placements are sorted by the client search, saved profile preferences, and the latest RFQ they filled out.
              </p>
            </div>
            <label className="form-check form-switch mt-1">
              <input
                className="form-check-input"
                type="checkbox"
                checked={config.sponsoredSection.enabled}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    sponsoredSection: {
                      ...current.sponsoredSection,
                      enabled: event.target.checked,
                    },
                  }))
                }
              />
              <span className="form-check-label ms-2">Enabled</span>
            </label>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--wm-ink)]">Section title</span>
              <input
                className="wm-admin-input"
                value={config.sponsoredSection.title[locale]}
                onChange={(event) => setSponsoredCopy("title", event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--wm-ink)]">Section description</span>
              <textarea
                className="wm-admin-textarea"
                value={config.sponsoredSection.description[locale]}
                onChange={(event) => setSponsoredCopy("description", event.target.value)}
              />
            </label>
          </div>

          <div className="mt-5 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <p className="mb-0 text-sm text-[var(--wm-muted)]">
              {config.sponsoredSection.placements.length} sponsored placement
              {config.sponsoredSection.placements.length === 1 ? "" : "s"}
            </p>
            <button type="button" className="btn btn-outline-secondary" onClick={addPlacement}>
              Add sponsor slot
            </button>
          </div>

          <div className="mt-4 grid gap-4">
            {config.sponsoredSection.placements.length > 0 ? (
              config.sponsoredSection.placements.map((placement, index) => {
                const selectedVendor = vendorLookup.get(placement.vendorId);
                const targetingSummary = renderTargetingSummary(placement.targeting);

                return (
                  <article key={placement.id} className="wm-admin-overview-card p-4">
                    <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                      <div>
                        <p className="wm-admin-kicker text-xs">Placement {index + 1}</p>
                        <h4 className="mb-0 mt-2 text-xl font-semibold text-[var(--wm-ink)]">
                          {selectedVendor?.businessName ?? "Choose a vendor"}
                        </h4>
                        {selectedVendor ? (
                          <p className="mb-0 mt-2 text-sm text-[var(--wm-muted)]">
                            /{selectedVendor.slug}
                            {selectedVendor.categories.length > 0 ? ` / ${selectedVendor.categories.join(", ")}` : ""}
                          </p>
                        ) : null}
                        {targetingSummary ? (
                          <p className="mb-0 mt-2 text-sm text-[var(--wm-muted)]">{targetingSummary}</p>
                        ) : (
                          <p className="mb-0 mt-2 text-sm text-[var(--wm-muted)]">No targeting rules yet. This slot behaves as a generic sponsor.</p>
                        )}
                      </div>

                      <div className="d-flex flex-wrap gap-2">
                        <label className="form-check form-switch mt-1">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={placement.active}
                            onChange={(event) => updatePlacementField(index, "active", event.target.checked)}
                          />
                          <span className="form-check-label ms-2">Active</span>
                        </label>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          disabled={index === 0}
                          onClick={() => movePlacement(index, -1)}
                        >
                          Move up
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          disabled={index === config.sponsoredSection.placements.length - 1}
                          onClick={() => movePlacement(index, 1)}
                        >
                          Move down
                        </button>
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removePlacement(index)}>
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--wm-ink)]">Vendor</span>
                        <select
                          className="wm-admin-input"
                          value={placement.vendorId}
                          onChange={(event) => updatePlacementField(index, "vendorId", event.target.value)}
                        >
                          <option value="">Choose a published vendor</option>
                          {vendors.map((vendor) => (
                            <option key={vendor.id} value={vendor.id}>
                              {vendor.businessName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--wm-ink)]">Badge</span>
                        <input
                          className="wm-admin-input"
                          value={placement.badge[locale]}
                          onChange={(event) => updatePlacementCopy(index, "badge", event.target.value)}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--wm-ink)]">CTA label</span>
                        <input
                          className="wm-admin-input"
                          value={placement.ctaLabel[locale]}
                          onChange={(event) => updatePlacementCopy(index, "ctaLabel", event.target.value)}
                        />
                      </label>
                      <label className="grid gap-2 lg:col-span-2">
                        <span className="text-sm font-medium text-[var(--wm-ink)]">Sponsor note</span>
                        <textarea
                          className="wm-admin-textarea"
                          value={placement.note[locale]}
                          onChange={(event) => updatePlacementCopy(index, "note", event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--wm-ink)]">Target categories</span>
                        <input
                          className="wm-admin-input"
                          value={formatListValue(placement.targeting.categories)}
                          placeholder="venue, photography, catering"
                          onChange={(event) => updatePlacementTargetingList(index, "categories", event.target.value)}
                        />
                        <span className="text-xs text-[var(--wm-muted)]">Use comma-separated category slugs or labels.</span>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--wm-ink)]">Target keywords</span>
                        <input
                          className="wm-admin-input"
                          value={formatListValue(placement.targeting.keywords)}
                          placeholder="beach wedding, luxury, modern"
                          onChange={(event) => updatePlacementTargetingList(index, "keywords", event.target.value)}
                        />
                        <span className="text-xs text-[var(--wm-muted)]">Matched against the vendor search query and latest RFQ notes.</span>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--wm-ink)]">Target themes</span>
                        <input
                          className="wm-admin-input"
                          value={formatListValue(placement.targeting.themes)}
                          placeholder="classic, boho, modern"
                          onChange={(event) => updatePlacementTargetingList(index, "themes", event.target.value)}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--wm-ink)]">Target countries</span>
                        <input
                          className="wm-admin-input"
                          value={formatListValue(placement.targeting.countries)}
                          placeholder="mexico, united states, spain"
                          onChange={(event) => updatePlacementTargetingList(index, "countries", event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--wm-ink)]">Min budget</span>
                        <input
                          className="wm-admin-input"
                          type="number"
                          min={0}
                          value={placement.targeting.minBudget ?? ""}
                          onChange={(event) => updatePlacementTargetingNumber(index, "minBudget", event.target.value)}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--wm-ink)]">Max budget</span>
                        <input
                          className="wm-admin-input"
                          type="number"
                          min={0}
                          value={placement.targeting.maxBudget ?? ""}
                          onChange={(event) => updatePlacementTargetingNumber(index, "maxBudget", event.target.value)}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--wm-ink)]">Min guests</span>
                        <input
                          className="wm-admin-input"
                          type="number"
                          min={0}
                          value={placement.targeting.minGuestCount ?? ""}
                          onChange={(event) => updatePlacementTargetingNumber(index, "minGuestCount", event.target.value)}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--wm-ink)]">Max guests</span>
                        <input
                          className="wm-admin-input"
                          type="number"
                          min={0}
                          value={placement.targeting.maxGuestCount ?? ""}
                          onChange={(event) => updatePlacementTargetingNumber(index, "maxGuestCount", event.target.value)}
                        />
                      </label>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="mb-0 text-sm text-[var(--wm-muted)]">
                No sponsor slots yet. Add one to choose which vendor receives paid placement.
              </p>
            )}
          </div>
        </section>

        {renderBannerEditor(
          "profileBanner",
          "Profile banner",
          "Smaller campaign banner that renders on individual vendor profile pages above the tabbed content.",
          "Vendor profile campaign",
        )}

        <div className="d-flex justify-content-end">
          <button className="btn btn-primary" type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Saving..." : "Save vendor ads"}
          </button>
        </div>
      </form>
    </section>
  );
}
