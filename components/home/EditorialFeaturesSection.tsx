"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { useId, useRef, useState } from "react";

const EDITORIAL_COPY = {
  en: {
    eyebrow: "A more considered way to plan",
    headingLine1: "Every detail.",
    headingLine2: "Beautifully connected.",
    tagline:
      "A place to discover wedding professionals, explore their work, and start a conversation about your celebration.",
  },
  es: {
    eyebrow: "Una forma más tranquila de planear",
    headingLine1: "Cada detalle.",
    headingLine2: "En perfecta sintonía.",
    tagline:
      "Un lugar para descubrir profesionales de bodas, conocer su trabajo y conversar sobre tu celebración.",
  },
} as const;

const PLATFORM_FEATURES = [
  {
    id: "discover",
    titleEn: "Discover vendors",
    titleEs: "Descubre proveedores",
    descriptionEn: "Explore wedding professionals by category, style, and budget.",
    descriptionEs: "Explora profesionales de bodas por categoría, estilo y presupuesto.",
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
    descriptionEn: "Keep the professionals you love in one place, ready for a closer look when you need it.",
    descriptionEs: "Reúne a los profesionales que más te gustan y vuelve a sus perfiles cuando lo necesites.",
    image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "plan",
    titleEn: "Plan with confidence",
    titleEs: "Planifica con confianza",
    descriptionEn: "Keep vendor conversations and proposals together, from the first question to your next decision.",
    descriptionEs: "Reúne conversaciones y propuestas, desde la primera pregunta hasta tu próxima decisión.",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
  },
] as const;

export default function EditorialFeaturesSection() {
  const { language } = useLanguage();
  const copy = EDITORIAL_COPY[language];
  const [activeIndex, setActiveIndex] = useState(0);
  const id = useId();
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = PLATFORM_FEATURES[activeIndex];
  const destinations = ["/vendors", "/rfq/new", "/shortlist", "/account/inbox"];
  const actionLabels = language === "es"
    ? ["Explorar proveedores", "Crear una solicitud", "Ver tus favoritos", "Ir a tus conversaciones"]
    : ["Explore vendors", "Start a request", "View your favourites", "Open your conversations"];

  return (
    <section className="wm-editorial-section" id="benefits">
      <div className="container">
        <div className="wm-editorial-section__header" data-reveal-group>
          <div className="wm-editorial-section__heading-col">
            <p className="wm-editorial-section__eyebrow">{copy.eyebrow}</p>
            <h2 className="wm-editorial-section__heading">
              <span className="wm-reveal-line"><span>{copy.headingLine1}</span></span>
              <span className="wm-reveal-line"><em>{copy.headingLine2}</em></span>
            </h2>
          </div>
          <div className="wm-editorial-section__tagline-col">
            <p className="wm-editorial-section__tagline">{copy.tagline}</p>
          </div>
        </div>

        <div className="wm-discovery" data-scroll-reveal>
          <div className="wm-discovery__media">
            {PLATFORM_FEATURES.map((feature, index) => <div key={feature.id} className={`wm-discovery__image${activeIndex === index ? " is-active" : ""}`} style={{ backgroundImage: `url(${feature.image})` }} aria-hidden="true" />)}
            <div className="wm-discovery__tabs" role="tablist" aria-label={language === "es" ? "Descubre Wedding Market" : "Discover Wedding Market"} aria-orientation="vertical">
              {PLATFORM_FEATURES.map((feature, index) => (
                <button key={feature.id} ref={(element) => { tabs.current[index] = element; }} type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={activeIndex === index} aria-controls={`${id}-panel`} tabIndex={activeIndex === index ? 0 : -1} onClick={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} onKeyDown={(event) => {
                  const next = event.key === "ArrowDown" ? (index + 1) % PLATFORM_FEATURES.length : event.key === "ArrowUp" ? (index + PLATFORM_FEATURES.length - 1) % PLATFORM_FEATURES.length : event.key === "Home" ? 0 : event.key === "End" ? PLATFORM_FEATURES.length - 1 : null;
                  if (next !== null) { event.preventDefault(); tabs.current[next]?.focus(); }
                }}>
                  <span className="wm-discovery__number">0{index + 1}</span>
                  {language === "es" ? feature.titleEs : feature.titleEn}
                  <span className="wm-discovery__indicator" aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <span className="wm-discovery__caption" aria-hidden="true">Wedding Market · {String(activeIndex + 1).padStart(2, "0")} / 04</span>
          </div>
          <div className="wm-discovery__panel" id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${activeIndex}`}>
            <div className="wm-discovery__panel-copy" key={active.id}>
              <p className="wm-editorial-eyebrow">{language === "es" ? "De la inspiración a la conexión" : "From inspiration to connection"}</p>
              <h3>{language === "es" ? active.titleEs : active.titleEn}<em>{language === "es" ? "a tu manera." : "your way."}</em></h3>
              <p>{language === "es" ? active.descriptionEs : active.descriptionEn}</p>
              <Link href={destinations[activeIndex]} className="wm-editorial-link">{actionLabels[activeIndex]} <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
