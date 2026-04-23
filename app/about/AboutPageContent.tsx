"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const aboutCopy = {
  en: {
    heroEyebrow: "About Wedding Market",
    heroTitleBefore: "We plan with",
    heroTitleAccent: "you",
    heroText:
      "Created for couples who want a calmer way to find trusted wedding professionals, compare real options, and move from inspiration to booking with clarity.",
    storyEyebrow: "Our Story",
    storyTitle: "Wedding Market",
    storyTitleAccent: "story.",
    storyLead:
      "Wedding planning should not feel like chasing strangers across the internet. Couples need confidence, vendors need serious inquiries, and every detail deserves a cleaner path.",
    storyBodyOne:
      "Wedding Market was built around that simple idea: bring the people, quotes, favorites, and conversations into one polished planning experience.",
    storyBodyTwo:
      "We connect couples with venues, photographers, planners, beauty teams, caterers, entertainment, decor specialists, and more, so the search feels curated instead of chaotic.",
    quote:
      "We wanted to create a planning space that respects the emotion of a wedding and the real work behind every vendor decision.",
    quoteBy: "Wedding Market team",
    missionEyebrow: "Our Mission",
    missionText:
      "To make wedding planning easier, clearer, and more beautiful for couples and the professionals who serve them.",
    missionTitle: "The curated",
    missionTitleAccent: "wedding marketplace.",
    missionBody:
      "From first search to final shortlist, Wedding Market gives couples a refined way to discover vendors, request quotes, and keep planning decisions organized.",
    previewCta: "Request quotes",
    stats: [
      { value: 6, suffix: "+", label: "Vendor categories" },
      { value: 1, suffix: "", label: "Shared planning workflow" },
      { value: 3, suffix: "", label: "Steps from search to quote" },
      { value: 24, suffix: "/7", label: "Access to your shortlist" },
    ],
    journalEyebrow: "Wedding Journal",
    journalTitle: "Planning",
    journalTitleAccent: "notes",
    viewArticles: "View all articles",
    joinEyebrow: "Begin with clarity",
    joinTitle: "For the stylish, the practical, and the deeply in love.",
    joinBody:
      "Start with vendors worth comparing and a request that gives them what they need to respond well.",
    joinCta: "Start a quote request",
  },
  es: {
    heroEyebrow: "Sobre Wedding Market",
    heroTitleBefore: "Planeamos",
    heroTitleAccent: "contigo",
    heroText:
      "Creado para parejas que quieren una forma mas tranquila de encontrar proveedores confiables, comparar opciones reales y pasar de la inspiracion a la reserva con claridad.",
    storyEyebrow: "Nuestra historia",
    storyTitle: "La historia de",
    storyTitleAccent: "Wedding Market.",
    storyLead:
      "Planear una boda no deberia sentirse como perseguir desconocidos por internet. Las parejas necesitan confianza, los proveedores necesitan solicitudes serias y cada detalle merece un camino mas claro.",
    storyBodyOne:
      "Wedding Market nace de esa idea simple: reunir personas, cotizaciones, favoritos y conversaciones en una experiencia de planeacion cuidada.",
    storyBodyTwo:
      "Conectamos parejas con lugares, fotografos, planners, equipos de belleza, catering, entretenimiento, decoracion y mas, para que la busqueda se sienta curada y no caotica.",
    quote:
      "Queremos crear un espacio de planeacion que respete la emocion de una boda y el trabajo real detras de cada decision.",
    quoteBy: "Equipo de Wedding Market",
    missionEyebrow: "Nuestra mision",
    missionText:
      "Hacer que la planeacion de bodas sea mas facil, clara y bonita para las parejas y los profesionales que las atienden.",
    missionTitle: "El marketplace",
    missionTitleAccent: "curado para bodas.",
    missionBody:
      "Desde la primera busqueda hasta la lista final, Wedding Market ofrece una forma refinada de descubrir proveedores, solicitar cotizaciones y organizar decisiones.",
    previewCta: "Solicitar cotizaciones",
    stats: [
      { value: 6, suffix: "+", label: "Categorias de proveedores" },
      { value: 1, suffix: "", label: "Flujo compartido de planeacion" },
      { value: 3, suffix: "", label: "Pasos de busqueda a cotizacion" },
      { value: 24, suffix: "/7", label: "Acceso a tus favoritos" },
    ],
    journalEyebrow: "Diario de bodas",
    journalTitle: "Notas de",
    journalTitleAccent: "planeacion",
    viewArticles: "Ver articulos",
    joinEyebrow: "Empieza con claridad",
    joinTitle: "Para quienes aman el estilo, el orden y cada detalle.",
    joinBody:
      "Empieza con proveedores que vale la pena comparar y una solicitud que les da lo necesario para responder bien.",
    joinCta: "Crear solicitud",
  },
} as const;

const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=82",
    label: "Couple walking after their ceremony",
  },
  {
    src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=82",
    label: "Wedding venue set for dinner",
  },
  {
    src: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=82",
    label: "Wedding photographer with couple",
  },
  {
    src: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=900&q=82",
    label: "Floral wedding table setting",
  },
  {
    src: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=82",
    label: "Bride and groom portrait",
  },
];

const journalItems = {
  en: [
    {
      href: "/blog",
      category: "Planning",
      date: "Guide",
      title: "How to compare wedding vendors without losing the thread",
      image: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=760&q=82",
    },
    {
      href: "/vendors",
      category: "Vendors",
      date: "Directory",
      title: "The vendor categories couples should shortlist first",
      image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=760&q=82",
    },
    {
      href: "/rfq/new",
      category: "Quotes",
      date: "Workflow",
      title: "What vendors need before they can send a useful quote",
      image: "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=760&q=82",
    },
    {
      href: "/shortlist",
      category: "Shortlist",
      date: "Tools",
      title: "A calmer way to keep favorites, quotes, and next steps together",
      image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=760&q=82",
    },
  ],
  es: [
    {
      href: "/blog",
      category: "Planeacion",
      date: "Guia",
      title: "Como comparar proveedores sin perder el hilo",
      image: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=760&q=82",
    },
    {
      href: "/vendors",
      category: "Proveedores",
      date: "Directorio",
      title: "Las categorias que conviene guardar primero",
      image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=760&q=82",
    },
    {
      href: "/rfq/new",
      category: "Cotizaciones",
      date: "Flujo",
      title: "Que necesita un proveedor para enviar una cotizacion util",
      image: "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=760&q=82",
    },
    {
      href: "/shortlist",
      category: "Favoritos",
      date: "Herramientas",
      title: "Una forma mas clara de reunir favoritos, precios y proximos pasos",
      image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=760&q=82",
    },
  ],
} as const;

function SplitWords({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((word, index) => (
        <span className="wm-about-split__mask" key={`${word}-${index}`}>
          <span className="wm-about-split__word" style={{ transitionDelay: `${index * 55}ms` }}>
            {word}
          </span>
        </span>
      ))}
    </>
  );
}

function AnimatedNumber({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        observer.disconnect();

        if (prefersReduced) {
          setDisplayValue(value);
          return;
        }

        const duration = 1200;
        const start = performance.now();

        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplayValue(Math.round(value * eased));

          if (progress < 1) {
            requestAnimationFrame(tick);
          }
        };

        requestAnimationFrame(tick);
      },
      { threshold: 0.45 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix ? <sup>{suffix}</sup> : null}
    </span>
  );
}

export default function AboutPageContent() {
  const { language } = useLanguage();
  const copy = aboutCopy[language];
  const articles = journalItems[language];

  const revealSelector = useMemo(
    () => [
      ".wm-about-reveal",
      ".wm-about-reveal-group > *",
      ".wm-about-split",
      ".wm-about-gallery__image",
    ].join(","),
    []
  );

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
    if (!elements.length) {
      return undefined;
    }

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [revealSelector]);

  return (
    <main className="wm-about-page">
      <section className="wm-about-heading wm-about-reveal-group">
        <p className="wm-about-eyebrow">{copy.heroEyebrow}</p>
        <h1>
          {copy.heroTitleBefore} <span>{copy.heroTitleAccent}</span>
        </h1>
        <p className="wm-about-heading__text">{copy.heroText}</p>
      </section>

      <section className="wm-about-gallery" aria-label="Wedding Market editorial gallery">
        {galleryImages.map((image, index) => (
          <div
            className="wm-about-gallery__image"
            key={image.src}
            aria-label={image.label}
            role="img"
            style={{
              backgroundImage: `url(${image.src})`,
              transitionDelay: `${index * 90}ms`,
            }}
          />
        ))}
      </section>

      <section className="wm-about-story">
        <div className="container">
          <div className="wm-about-story__intro wm-about-reveal-group">
            <p className="wm-about-eyebrow">{copy.storyEyebrow}</p>
            <div className="wm-about-story__grid">
              <div>
                <h2 className="wm-about-split">
                  <SplitWords text={copy.storyTitle} /> <em>{copy.storyTitleAccent}</em>
                </h2>
              </div>
              <div>
                <h3>{copy.storyLead}</h3>
                <p>{copy.storyBodyOne}</p>
              </div>
              <div>
                <p>{copy.storyBodyTwo}</p>
              </div>
            </div>
          </div>

          <div className="wm-about-story__images wm-about-reveal-group">
            <figure className="wm-about-quote">
              <Image
                src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=860&q=82"
                alt="Couple reviewing wedding plans at a table"
                width={860}
                height={645}
              />
              <blockquote>{copy.quote}</blockquote>
              <figcaption>{copy.quoteBy}</figcaption>
            </figure>
            <Image
              className="wm-about-story__feature"
              src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=82"
              alt="Outdoor wedding reception with flowers and lights"
              width={1400}
              height={875}
            />
          </div>
        </div>
      </section>

      <section className="wm-about-mission">
        <div className="wm-about-mission__intro wm-about-reveal-group">
          <p className="wm-about-eyebrow">{copy.missionEyebrow}</p>
          <h2>{copy.missionText}</h2>
        </div>

        <div className="wm-about-mission__module wm-about-reveal-group">
          <div className="wm-about-mission__copy">
            <h3>
              {copy.missionTitle} <em>{copy.missionTitleAccent}</em>
            </h3>
            <p>{copy.missionBody}</p>
            <Link href="/rfq/new" className="wm-about-button wm-about-button--light">
              <span>{copy.previewCta}</span>
              <span aria-hidden="true">-&gt;</span>
            </Link>
          </div>
          <div className="wm-about-stats">
            {copy.stats.map((stat) => (
              <div className="wm-about-stat" key={stat.label}>
                <strong>
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wm-about-journal">
        <div className="wm-about-journal__header wm-about-reveal-group">
          <div>
            <p className="wm-about-eyebrow">{copy.journalEyebrow}</p>
            <h2>
              {copy.journalTitle} <span>{copy.journalTitleAccent}</span>
            </h2>
          </div>
          <Link href="/blog" className="wm-about-journal__link">
            <span>{copy.viewArticles}</span>
            <span aria-hidden="true">-&gt;</span>
          </Link>
        </div>

        <div className="wm-about-journal__rail" aria-label={copy.journalEyebrow}>
          {articles.map((article, index) => (
            <article className="wm-about-article wm-about-reveal" key={article.title} style={{ transitionDelay: `${index * 80}ms` }}>
              <Link href={article.href}>
                <span className="wm-about-article__pill">View</span>
                <Image src={article.image} alt="" width={760} height={950} />
                <small>
                  {article.date} <span>- {article.category}</span>
                </small>
                <h3>{article.title}</h3>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="wm-about-join">
        <video className="wm-about-join__video" autoPlay muted playsInline loop aria-hidden="true">
          <source src="/hero/wedding-demo.mp4" type="video/mp4" />
        </video>
        <div className="wm-about-join__overlay" />
        <div className="wm-about-join__content wm-about-reveal-group">
          <p className="wm-about-eyebrow">{copy.joinEyebrow}</p>
          <h2>{copy.joinTitle}</h2>
          <p>{copy.joinBody}</p>
          <Link href="/rfq/new" className="wm-about-button wm-about-button--light">
            <span>{copy.joinCta}</span>
            <span aria-hidden="true">-&gt;</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
