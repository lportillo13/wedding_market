"use client";

import { useLanguage } from "@/contexts/LanguageContext";

const EDITORIAL_COPY = {
  en: {
    eyebrow: "For couples · by design",
    headingLine1: "The marketplace built",
    headingLine2: "for your perfect day.",
    tagline:
      "A curated platform that connects you with the best wedding professionals — organised, reviewed, and ready to book.",
  },
  es: {
    eyebrow: "Para parejas · por diseño",
    headingLine1: "El marketplace creado",
    headingLine2: "para tu día perfecto.",
    tagline:
      "Una plataforma curada que te conecta con los mejores profesionales de bodas — organizados, verificados y listos para reservar.",
  },
} as const;

const PLATFORM_FEATURES = [
  {
    id: "discover",
    titleEn: "Discover vendors",
    titleEs: "Descubre proveedores",
    descriptionEn: "Browse hundreds of curated wedding professionals by category, style, and budget.",
    descriptionEs: "Explora cientos de profesionales de bodas por categoría, estilo y presupuesto.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "quotes",
    titleEn: "Request quotes",
    titleEs: "Solicita cotizaciones",
    descriptionEn: "Send a single request to multiple vendors and receive personalised quotes in one place.",
    descriptionEs: "Envía una solicitud a varios proveedores y recibe cotizaciones en un solo lugar.",
    image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "shortlist",
    titleEn: "Shortlist & compare",
    titleEs: "Guarda y compara",
    descriptionEn: "Save your favourites, share with your partner, and compare pricing side by side.",
    descriptionEs: "Guarda tus favoritos, compártelos con tu pareja y compara precios lado a lado.",
    image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "plan",
    titleEn: "Plan with confidence",
    titleEs: "Planifica con confianza",
    descriptionEn: "Manage vendor conversations, quotes, and timelines from one clean dashboard.",
    descriptionEs: "Gestiona conversaciones, cotizaciones y tiempos desde un solo panel.",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
  },
] as const;

export default function EditorialFeaturesSection() {
  const { language } = useLanguage();
  const copy = EDITORIAL_COPY[language];

  return (
    <section className="wm-editorial-section" id="benefits">
      <div className="container">
        <div className="wm-editorial-section__header">
          <div className="wm-editorial-section__heading-col">
            <p className="wm-editorial-section__eyebrow">{copy.eyebrow}</p>
            <h2 className="wm-editorial-section__heading">
              {copy.headingLine1}
              <br />
              <em>{copy.headingLine2}</em>
            </h2>
          </div>
          <div className="wm-editorial-section__tagline-col">
            <p className="wm-editorial-section__tagline">{copy.tagline}</p>
          </div>
        </div>

        <div className="wm-editorial-section__cards">
          {PLATFORM_FEATURES.map((feature) => (
            <article key={feature.id} className="wm-editorial-card">
              <div
                className="wm-editorial-card__image"
                style={{ backgroundImage: `url(${feature.image})` }}
                aria-hidden="true"
              />
              <div className="wm-editorial-card__body">
                <h3 className="wm-editorial-card__title">
                  {language === "es" ? feature.titleEs : feature.titleEn}
                </h3>
                <p className="wm-editorial-card__text">
                  {language === "es" ? feature.descriptionEs : feature.descriptionEn}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
