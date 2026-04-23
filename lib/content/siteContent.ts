import { dictionaries, type SupportedLanguage } from "@/lib/i18n";

export type HomepageHighlightItem = {
  title: string;
  description: string;
};

export type HomepageCategoryItem = {
  label: string;
  slug: string;
};

export type HomepageContent = {
  hero: {
    badge: string;
    title: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    imageUrl: string;
    imageAlt: string;
  };
  highlights: {
    heading: string;
    items: HomepageHighlightItem[];
  };
  categories: {
    heading: string;
    description: string;
    viewAll: string;
    spotlightLabel: string;
    seeVendors: string;
    items: HomepageCategoryItem[];
  };
  plan: {
    heading: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
};

export type BlogIndexContent = {
  kicker: string;
  title: string;
  subtitle: string;
  statsLabel: string;
  statsStoriesLabel: string;
  statsSampleLabel: string;
  statsIdeasValue: string;
  statsIdeasLabel: string;
  latestPostsLabel: string;
  latestPostsTitle: string;
  emptyState: string;
  readArticleLabel: string;
};

type LocalizedContentMap<T> = Partial<Record<SupportedLanguage, Partial<T>>>;

const DEFAULT_HOMEPAGE_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80";

export function getDefaultHomepageContent(language: SupportedLanguage): HomepageContent {
  const { home } = dictionaries[language];

  return {
    hero: {
      badge: home.hero.badge,
      title: home.hero.title,
      description: home.hero.description,
      primaryCtaLabel: home.hero.primaryCta,
      primaryCtaHref: "/rfq/new",
      secondaryCtaLabel: home.hero.secondaryCta,
      secondaryCtaHref: "/vendors",
      imageUrl: DEFAULT_HOMEPAGE_IMAGE,
      imageAlt:
        language === "es"
          ? "Pareja celebrando durante una recepcion de boda"
          : "Couple celebrating during a wedding reception",
    },
    highlights: {
      heading: home.highlights.heading,
      items: home.highlights.items.map((item) => ({
        title: item.title,
        description: item.description,
      })),
    },
    categories: {
      heading: home.categories.heading,
      description: home.categories.description,
      viewAll: home.categories.viewAll,
      spotlightLabel: home.categories.spotlightLabel,
      seeVendors: home.categories.seeVendors,
      items: home.categories.items.map((item) => ({
        label: item.label,
        slug: item.slug,
      })),
    },
    plan: {
      heading: home.plan.heading,
      description: home.plan.description,
      ctaLabel: home.plan.cta,
      ctaHref: "/shortlist",
    },
  };
}

export function getDefaultBlogIndexContent(language: SupportedLanguage): BlogIndexContent {
  if (language === "es") {
    return {
      kicker: "Editorial",
      title: "Historias de bodas, ideas de planeacion e inspiracion de diseno.",
      subtitle:
        "Explora articulos, consejos e historias para ayudarte a planear una celebracion con criterio y estilo.",
      statsLabel: "Dentro del blog",
      statsStoriesLabel: "Historias",
      statsSampleLabel: "Demos",
      statsIdeasValue: "Ideas",
      statsIdeasLabel: "Planeacion, decoracion y viajes",
      latestPostsLabel: "Ultimos posts",
      latestPostsTitle: "Mas inspiracion para tu boda",
      emptyState: "Todavia no hay historias publicadas. Vuelve pronto.",
      readArticleLabel: "Leer articulo",
    };
  }

  return {
    kicker: "Editorial",
    title: "Wedding stories, planning ideas, and design inspiration.",
    subtitle:
      "Browse articles, advice, and stories to help plan a celebration with clarity and style.",
    statsLabel: "Inside the journal",
    statsStoriesLabel: "Stories",
    statsSampleLabel: "Demos",
    statsIdeasValue: "Ideas",
    statsIdeasLabel: "Planning, decor, and travel",
    latestPostsLabel: "Latest Posts",
    latestPostsTitle: "More wedding inspiration",
    emptyState: "No stories have been published yet. Check back soon!",
    readArticleLabel: "Read article",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function readHighlightItems(value: unknown, fallback: HomepageHighlightItem[]): HomepageHighlightItem[] {
  if (!Array.isArray(value)) return fallback;

  const items = value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const title = typeof entry.title === "string" ? entry.title.trim() : "";
    const description = typeof entry.description === "string" ? entry.description.trim() : "";
    if (!title || !description) return [];
    return [{ title, description }];
  });

  return items.length > 0 ? items : fallback;
}

function readCategoryItems(value: unknown, fallback: HomepageCategoryItem[]): HomepageCategoryItem[] {
  if (!Array.isArray(value)) return fallback;

  const items = value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const label = typeof entry.label === "string" ? entry.label.trim() : "";
    const slug = typeof entry.slug === "string" ? entry.slug.trim() : "";
    if (!label || !slug) return [];
    return [{ label, slug }];
  });

  return items.length > 0 ? items : fallback;
}

function coerceLocalizedContent<T extends object>(
  value: unknown,
  language: SupportedLanguage
): Partial<T> | null {
  if (!isRecord(value)) {
    return null;
  }

  if ("en" in value || "es" in value) {
    const localized = value as LocalizedContentMap<T>;
    const preferred = localized[language];
    if (preferred && isRecord(preferred)) {
      return preferred as Partial<T>;
    }

    for (const fallbackLanguage of ["en", "es"] as const) {
      const fallback = localized[fallbackLanguage];
      if (fallback && isRecord(fallback)) {
        return fallback as Partial<T>;
      }
    }

    return null;
  }

  return value as Partial<T>;
}

function normalizeHomepageContent(rawValue: unknown, language: SupportedLanguage): HomepageContent {
  const fallback = getDefaultHomepageContent(language);
  const value = coerceLocalizedContent<HomepageContent>(rawValue, language);

  if (!value) {
    return fallback;
  }

  return {
    hero: {
      badge: readString(value.hero?.badge, fallback.hero.badge),
      title: readString(value.hero?.title, fallback.hero.title),
      description: readString(value.hero?.description, fallback.hero.description),
      primaryCtaLabel: readString(value.hero?.primaryCtaLabel, fallback.hero.primaryCtaLabel),
      primaryCtaHref: readString(value.hero?.primaryCtaHref, fallback.hero.primaryCtaHref),
      secondaryCtaLabel: readString(value.hero?.secondaryCtaLabel, fallback.hero.secondaryCtaLabel),
      secondaryCtaHref: readString(value.hero?.secondaryCtaHref, fallback.hero.secondaryCtaHref),
      imageUrl: readString(value.hero?.imageUrl, fallback.hero.imageUrl),
      imageAlt: readString(value.hero?.imageAlt, fallback.hero.imageAlt),
    },
    highlights: {
      heading: readString(value.highlights?.heading, fallback.highlights.heading),
      items: readHighlightItems(value.highlights?.items, fallback.highlights.items),
    },
    categories: {
      heading: readString(value.categories?.heading, fallback.categories.heading),
      description: readString(value.categories?.description, fallback.categories.description),
      viewAll: readString(value.categories?.viewAll, fallback.categories.viewAll),
      spotlightLabel: readString(value.categories?.spotlightLabel, fallback.categories.spotlightLabel),
      seeVendors: readString(value.categories?.seeVendors, fallback.categories.seeVendors),
      items: readCategoryItems(value.categories?.items, fallback.categories.items),
    },
    plan: {
      heading: readString(value.plan?.heading, fallback.plan.heading),
      description: readString(value.plan?.description, fallback.plan.description),
      ctaLabel: readString(value.plan?.ctaLabel, fallback.plan.ctaLabel),
      ctaHref: readString(value.plan?.ctaHref, fallback.plan.ctaHref),
    },
  };
}

function normalizeBlogIndexContent(rawValue: unknown, language: SupportedLanguage): BlogIndexContent {
  const fallback = getDefaultBlogIndexContent(language);
  const value = coerceLocalizedContent<BlogIndexContent>(rawValue, language);

  if (!value) {
    return fallback;
  }

  return {
    kicker: readString(value.kicker, fallback.kicker),
    title: readString(value.title, fallback.title),
    subtitle: readString(value.subtitle, fallback.subtitle),
    statsLabel: readString(value.statsLabel, fallback.statsLabel),
    statsStoriesLabel: readString(value.statsStoriesLabel, fallback.statsStoriesLabel),
    statsSampleLabel: readString(value.statsSampleLabel, fallback.statsSampleLabel),
    statsIdeasValue: readString(value.statsIdeasValue, fallback.statsIdeasValue),
    statsIdeasLabel: readString(value.statsIdeasLabel, fallback.statsIdeasLabel),
    latestPostsLabel: readString(value.latestPostsLabel, fallback.latestPostsLabel),
    latestPostsTitle: readString(value.latestPostsTitle, fallback.latestPostsTitle),
    emptyState: readString(value.emptyState, fallback.emptyState),
    readArticleLabel: readString(value.readArticleLabel, fallback.readArticleLabel),
  };
}

export function buildSiteContentTemplates() {
  return {
    "homepage.content": {
      en: getDefaultHomepageContent("en"),
      es: getDefaultHomepageContent("es"),
    },
    "blog.index.content": {
      en: getDefaultBlogIndexContent("en"),
      es: getDefaultBlogIndexContent("es"),
    },
  };
}

export { normalizeBlogIndexContent, normalizeHomepageContent };
