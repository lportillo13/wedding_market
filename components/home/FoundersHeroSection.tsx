"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HomepageContent } from "@/lib/content/siteContent";
import { resolveMediaUrl } from "@/lib/media-url";
import { useLanguage } from "@/contexts/LanguageContext";
import HeaderIcon from '@/components/HeaderIcon';

const HERO_YOUTUBE_EMBED_URL =
  "https://www.youtube-nocookie.com/embed/JgzkqjnsIvM?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=JgzkqjnsIvM&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0";

type VendorLogoItem = {
  id: string;
  label: string;
  slug?: string | null;
  carouselImageUrl?: string | null;
  imageUrl?: string | null;
};

type FoundersHeroSectionProps = {
  hero: HomepageContent["hero"];
};

function getVendorLogoInitials(label: string) {
  const words = label
    .replace(/\d+/g, "")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
  return initials || label.slice(0, 2).toUpperCase();
}

function shouldRenderLogoAsText(imageUrl: string | null | undefined) {
  return !imageUrl || imageUrl.includes("api.dicebear.com");
}

function shuffleVendorLogos(logos: VendorLogoItem[]) {
  const shuffled = [...logos];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function mergeVendorLogos(...logoGroups: VendorLogoItem[][]) {
  const logosById = new Map<string, VendorLogoItem>();
  for (const group of logoGroups) {
    for (const logo of group) logosById.set(logo.id, logo);
  }
  return Array.from(logosById.values());
}

function pickCarouselLogos(logos: VendorLogoItem[], preferredVendorId: string) {
  const preferredLogo = logos.find((logo) =>
    [logo.slug, logo.label].some((value) => value?.toLowerCase().includes(preferredVendorId.toLowerCase())),
  );
  const randomLogos = shuffleVendorLogos(
    preferredLogo ? logos.filter((logo) => logo.id !== preferredLogo.id) : logos,
  ).slice(0, preferredLogo ? 13 : 14);

  if (!preferredLogo) return randomLogos;

  const insertAt = Math.floor(Math.random() * (randomLogos.length + 1));
  return [...randomLogos.slice(0, insertAt), preferredLogo, ...randomLogos.slice(insertAt)];
}

export default function FoundersHeroSection({ hero }: FoundersHeroSectionProps) {
  const { language } = useLanguage();
  const [vendorLogos, setVendorLogos] = useState<VendorLogoItem[]>([]);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const frame = requestAnimationFrame(() => setVideoPlaying(!motion.matches));
    const onMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) setVideoPlaying(false);
    };
    motion.addEventListener("change", onMotionChange);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", onMotionChange);
    };
  }, []);

  useEffect(() => {
    const mapVendorLogos = (items: Array<{
      id: string;
      business_name: string;
      slug?: string | null;
      carousel_logo_url?: string | null;
      logo_url?: string | null;
      logo_image?: { url?: string } | null;
    }>) =>
      items.map((vendor) => ({
        id: vendor.id,
        label: vendor.business_name,
        slug: vendor.slug,
        carouselImageUrl: vendor.carousel_logo_url,
        imageUrl: vendor.logo_url ?? vendor.logo_image?.url ?? null,
      }));

    async function loadVendorLogos() {
      try {
        const [vendorPoolResponse, preferredVendorResponse] = await Promise.all([
          fetch("/api/vendors?pageSize=50", { cache: "no-store" }),
          fetch("/api/vendors?q=blue-sky-photography&pageSize=5", { cache: "no-store" }),
        ]);
        if (!vendorPoolResponse.ok) return;

        const vendorPoolData = (await vendorPoolResponse.json()) as {
          items: Parameters<typeof mapVendorLogos>[0];
        };
        const preferredVendorData = preferredVendorResponse.ok
          ? ((await preferredVendorResponse.json()) as typeof vendorPoolData)
          : { items: [] };
        const logos = mergeVendorLogos(
          mapVendorLogos(vendorPoolData.items),
          mapVendorLogos(preferredVendorData.items),
        );

        if (logos.length > 0) setVendorLogos(pickCarouselLogos(logos, "blue-sky-photography"));
      } catch {
        // The carousel stays hidden when vendor data is unavailable.
      }
    }

    void loadVendorLogos();
  }, []);

  function scrollToDetails(event: React.MouseEvent<HTMLAnchorElement>) {
    const section = document.getElementById("benefits");
    if (!section) return;
    event.preventDefault();
    section.focus({ preventScroll: true });
    // Leave the destination clear of the persistent header and reveal transforms.
    const headerBottom = document.querySelector(".wm-site-header")?.getBoundingClientRect().bottom ?? 0;
    window.scrollTo({
      top: Math.max(0, section.offsetTop - headerBottom - 16),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  return (
    <section className="wm-founders-hero" aria-labelledby="wm-founders-hero-title" data-home-hero>
      <div className="wm-founders-hero__poster" style={{ backgroundImage: `url(${hero.imageUrl})` }} aria-hidden="true" />
      {videoPlaying && <iframe
        className="wm-founders-hero__video"
        src={HERO_YOUTUBE_EMBED_URL}
        title="Muted wedding hero background video"
        allow="autoplay; encrypted-media"
        aria-hidden="true"
        tabIndex={-1}
      />}

      <div className="wm-founders-hero__content">
        <p className="wm-founders-hero__eyebrow">{language === "es" ? "Celebra en Costa Rica" : "Celebrate in Costa Rica"}</p>
        <h1 id="wm-founders-hero-title">
          {hero.title ? hero.title.split("\n").map((line, index) => index === 0 ? <span key={index}>{line}</span> : <em key={index}>{line}</em>) : (
            <>
              Where love
              <em>meets perfection</em>
            </>
          )}
        </h1>
        <p className="wm-founders-hero__description">
          {hero.description ??
            "Discover wedding professionals and bring your quotes and conversations together."}
        </p>
        <div className="wm-founders-hero__links"><Link href={hero.primaryCtaHref ?? "/vendors"} className="wm-founders-hero__cta">
          <span>{hero.primaryCtaLabel ?? "Explore Vendors"}</span>
          <span className="wm-founders-hero__cta-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M5 12h13" />
              <path d="m13 7 5 5-5 5" />
            </svg>
          </span>
        </Link>
        <Link href={hero.secondaryCtaHref ?? "/vendors"} className="wm-founders-hero__secondary">{hero.secondaryCtaLabel}</Link></div>
      </div>

      {vendorLogos.length > 0 && (
        <div className="wm-founders-hero__logo-slider" aria-label="Featured wedding vendors">
          <div className="wm-founders-hero__logo-track">
            {[...vendorLogos, ...vendorLogos].map((logo, index) => (
              <span
                key={`${logo.id}-${index}`}
                className="wm-founders-hero__logo wm-founders-hero__logo--vendor"
                aria-hidden={index >= vendorLogos.length}
              >
                {shouldRenderLogoAsText(logo.carouselImageUrl ?? logo.imageUrl) ? (
                  <span className="wm-founders-hero__vendor-initials" aria-label={logo.label}>
                    {getVendorLogoInitials(logo.label)}
                  </span>
                ) : logo.carouselImageUrl ?? logo.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveMediaUrl(logo.carouselImageUrl ?? logo.imageUrl)}
                    alt={logo.label}
                    className="wm-founders-hero__vendor-img"
                  />
                ) : null}
              </span>
            ))}
          </div>
        </div>
      )}

      <button type="button" className="wm-founders-hero__motion" onClick={() => setVideoPlaying((playing) => !playing)} aria-label={language === "es" ? videoPlaying ? "Pausar video de fondo" : "Reproducir video de fondo" : videoPlaying ? "Pause background video" : "Play background video"}>
        <HeaderIcon name={videoPlaying ? 'pause' : 'play'} fill="currentColor" stroke="none" />
        <span className="wm-founders-hero__motion-label">{language === "es" ? videoPlaying ? "Pausar video" : "Ver video" : videoPlaying ? "Pause video" : "Play video"}</span>
      </button>
      <a href="#benefits" className="wm-founders-hero__scroll-cue" onClick={scrollToDetails} aria-label={language === "es" ? "Desplazarse a la siguiente sección" : "Scroll to the next section"}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
