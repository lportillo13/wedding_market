"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const MAGAZINE_COPY = {
  en: {
    eyebrow: "The Wedding Market · Digital magazine",
    issue: "Issue 01 · The art of celebration",
    title: "A little inspiration for",
    titleAccent: "your biggest day.",
    description:
      "Discover considered venues, design stories, planning advice, and the thoughtful details that make a celebration feel entirely your own.",
    cta: "Read the magazine",
    imageCta: "Open The Wedding Market digital magazine",
    coverLabel: "The digital edition",
    coverIssue: "Volume 01",
    imageAlt: "An open luxury wedding magazine beside a tablet displaying an elegant wedding venue",
  },
  es: {
    eyebrow: "The Wedding Market · Revista digital",
    issue: "Edición 01 · El arte de celebrar",
    title: "Un poco de inspiración para",
    titleAccent: "tu gran día.",
    description:
      "Descubre lugares especiales, historias de diseño, consejos de planeación y los detalles que hacen que una celebración se sienta totalmente tuya.",
    cta: "Leer la revista",
    imageCta: "Abrir la revista digital de The Wedding Market",
    coverLabel: "La edición digital",
    coverIssue: "Volumen 01",
    imageAlt: "Una revista de bodas de lujo abierta junto a una tableta con un elegante lugar para bodas",
  },
} as const;

export default function DigitalMagazineSection() {
  const { language } = useLanguage();
  const copy = MAGAZINE_COPY[language];

  return (
    <section className="wm-home-magazine" aria-labelledby="wm-home-magazine-title">
      <div className="container">
        <div className="wm-home-magazine__layout">
          <div className="wm-home-magazine__copy">
            <p className="wm-home-magazine__eyebrow">{copy.eyebrow}</p>
            <p className="wm-home-magazine__issue">{copy.issue}</p>
            <h2 id="wm-home-magazine-title">
              {copy.title}
              <em>{copy.titleAccent}</em>
            </h2>
            <p className="wm-home-magazine__description">{copy.description}</p>
            <Link href="/blog" className="wm-home-magazine__cta">
              <span>{copy.cta}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </Link>
          </div>

          <Link href="/blog" className="wm-home-magazine__media" aria-label={copy.imageCta}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/magazine/digital-magazine-editorial.webp" alt={copy.imageAlt} />
            <span className="wm-home-magazine__cover-mark" aria-hidden="true">
              <span>{copy.coverLabel}</span>
              <strong>{copy.coverIssue}</strong>
            </span>
            <span className="wm-home-magazine__media-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
