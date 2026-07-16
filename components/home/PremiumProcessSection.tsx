"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { HomepageContent } from "@/lib/content/siteContent";

const PROCESS_IMAGES = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=80",
];

const PROCESS_COPY = {
  en: {
    eyebrow: "Member-style workflow",
    panels: [
      {
        tab: "Shortlist",
        title: "Build your",
        italic: "shortlist",
        summary: "Start with the vendors who fit your date, budget, style, and priorities.",
        highlights: ["Save favorites in one place", "Compare options without losing context", "Keep your partner aligned"],
      },
      {
        tab: "Request",
        title: "Send one",
        italic: "request",
        summary: "Share the essentials once and reach the vendors you want to compare.",
        highlights: ["Include date, category, and budget", "Route details to selected vendors", "Avoid repeating the same brief"],
      },
      {
        tab: "Track",
        title: "Track every",
        italic: "reply",
        summary: "Keep quotes, messages, and next steps organized from your account.",
        highlights: ["See conversations in one dashboard", "Review quotes side by side", "Move from inquiry to decision faster"],
      },
    ],
  },
  es: {
    eyebrow: "Flujo tipo membresía",
    panels: [
      {
        tab: "Guardar",
        title: "Crea tu",
        italic: "lista",
        summary: "Empieza con proveedores que encajan con tu fecha, presupuesto, estilo y prioridades.",
        highlights: ["Guarda favoritos en un solo lugar", "Compara opciones sin perder contexto", "Mantén a tu pareja alineada"],
      },
      {
        tab: "Solicitar",
        title: "Envía una",
        italic: "solicitud",
        summary: "Comparte lo esencial una vez y llega a los proveedores que quieres comparar.",
        highlights: ["Incluye fecha, categoría y presupuesto", "Envía detalles a proveedores seleccionados", "Evita repetir el mismo brief"],
      },
      {
        tab: "Seguir",
        title: "Sigue cada",
        italic: "respuesta",
        summary: "Mantén cotizaciones, mensajes y próximos pasos organizados desde tu cuenta.",
        highlights: ["Ve conversaciones en un solo panel", "Revisa cotizaciones lado a lado", "Pasa de consulta a decisión más rápido"],
      },
    ],
  },
} as const;

type PremiumProcessSectionProps = {
  plan: HomepageContent["plan"];
};

export default function PremiumProcessSection({ plan }: PremiumProcessSectionProps) {
  const { language } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const copy = PROCESS_COPY[language];
  const activePanel = copy.panels[activeIndex] ?? copy.panels[0];

  return (
    <section className="wm-home-premium-process" id="community">
      <div className="container">
        <div
          className="wm-home-premium-process__panel"
          style={{ backgroundImage: `url(${PROCESS_IMAGES[activeIndex] ?? PROCESS_IMAGES[0]})` }}
        >
          <div className="wm-home-premium-process__tabs" aria-label={copy.eyebrow}>
            {copy.panels.map((panel, index) => (
              <button
                key={panel.tab}
                type="button"
                className={`wm-home-premium-process__tab${index === activeIndex ? " is-active" : ""}`}
                onClick={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                aria-pressed={index === activeIndex}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {panel.tab}
              </button>
            ))}
          </div>

          <div className="wm-home-premium-process__content">
            <div className="wm-home-premium-process__headline">
              <p className="wm-home-premium-eyebrow">{copy.eyebrow}</p>
              <h2>
                {activePanel.title}
                <em>{activePanel.italic}</em>
              </h2>
            </div>

            <div className="wm-home-premium-process__details">
              <p className="wm-home-premium-eyebrow">{copy.eyebrow}</p>
              <h3>{plan.heading}</h3>
              <p>{activePanel.summary}</p>
              <ol className="wm-home-premium-process__steps">
                {activePanel.highlights.map((highlight, index) => (
                  <li key={highlight}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{highlight}</p>
                  </li>
                ))}
              </ol>
              <Link href={plan.ctaHref} className="wm-home-premium-button wm-home-premium-button--primary">
                {plan.ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
