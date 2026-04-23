"use client";

import { useMemo, useState, FormEvent } from "react";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import { saveCategories } from "../_actions";

type CategoryLabel = { en?: string | null; es?: string | null } | null | undefined;
type Cat = { key: string; label?: CategoryLabel };
type FamilyCopy = { en: string; es: string };
type FamilyDefinition = {
  id: string;
  title: FamilyCopy;
  description: FamilyCopy;
  keywords: string[];
};
type CategoryOption = { key: string; label: string; searchText: string };
type CategoryFamily = FamilyDefinition & { items: CategoryOption[] };

const FAMILY_DEFINITIONS: FamilyDefinition[] = [
  {
    id: "media",
    title: { en: "Media", es: "Medios" },
    description: {
      en: "Photo, film, and content capture specialties.",
      es: "Especialidades de foto, video y contenido.",
    },
    keywords: ["photo", "photography", "video", "videography", "film", "cinema", "content", "media"],
  },
  {
    id: "planning-design",
    title: { en: "Planning & Design", es: "Planeacion y diseno" },
    description: {
      en: "Coordination, creative direction, styling, and production.",
      es: "Coordinacion, direccion creativa, estilismo y produccion.",
    },
    keywords: ["planner", "planning", "coord", "design", "stylist", "styling", "production"],
  },
  {
    id: "beauty-fashion",
    title: { en: "Beauty & Fashion", es: "Belleza y moda" },
    description: {
      en: "Hair, makeup, attire, tailoring, and personal styling.",
      es: "Peinado, maquillaje, vestuario, ajustes y estilismo.",
    },
    keywords: ["beauty", "hair", "makeup", "make-up", "groom", "dress", "tux", "suit", "fashion"],
  },
  {
    id: "music-entertainment",
    title: { en: "Music & Entertainment", es: "Musica y entretenimiento" },
    description: {
      en: "DJs, bands, live performers, MCs, and guest entertainment.",
      es: "DJs, bandas, artistas en vivo y entretenimiento.",
    },
    keywords: ["music", "dj", "band", "entertainment", "perform", "mc", "audio"],
  },
  {
    id: "food-drink",
    title: { en: "Food & Drink", es: "Comida y bebida" },
    description: {
      en: "Catering, cakes, desserts, bars, and beverage service.",
      es: "Banquete, pasteles, postres, barras y bebidas.",
    },
    keywords: ["catering", "bar", "cake", "dessert", "drink", "beverage", "food", "bakery"],
  },
  {
    id: "floral-decor",
    title: { en: "Floral & Decor", es: "Flores y decoracion" },
    description: {
      en: "Florals, rentals, installations, lighting, and decor details.",
      es: "Flores, rentals, instalaciones, iluminacion y decoracion.",
    },
    keywords: ["flor", "flower", "floral", "decor", "rental", "lighting", "table", "balloon"],
  },
  {
    id: "venue-travel",
    title: { en: "Venues & Travel", es: "Lugares y viajes" },
    description: {
      en: "Venues, destination support, accommodations, and hosting spaces.",
      es: "Lugares, apoyo de destino, hospedaje y espacios.",
    },
    keywords: ["venue", "hotel", "resort", "estate", "travel", "destination", "lodging"],
  },
  {
    id: "transport-services",
    title: { en: "Transport & Guest Services", es: "Transporte y servicios al invitado" },
    description: {
      en: "Transportation, logistics, guest support, and event-day operations.",
      es: "Transporte, logistica, soporte al invitado y operacion.",
    },
    keywords: ["transport", "limo", "car", "bus", "shuttle", "guest", "valet", "security"],
  },
];

const OTHER_FAMILY: FamilyDefinition = {
  id: "other-services",
  title: { en: "Other Services", es: "Otros servicios" },
  description: {
    en: "Specialties that do not fit a main service family.",
    es: "Especialidades que no encajan en una familia principal.",
  },
  keywords: [],
};

function getCopy(copy: FamilyCopy, language: "en" | "es") {
  return language === "es" ? copy.es : copy.en;
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function resolveLabel(category: Cat, language: "en" | "es") {
  if (typeof category.label === "object" && category.label) {
    return language === "es"
      ? category.label.es ?? category.label.en ?? category.key
      : category.label.en ?? category.label.es ?? category.key;
  }

  return category.key;
}

function assignFamily(option: CategoryOption) {
  const family = FAMILY_DEFINITIONS.find((candidate) =>
    candidate.keywords.some((keyword) => option.searchText.includes(keyword)),
  );

  return family ?? OTHER_FAMILY;
}

export default function CategoriesForm({ allCats, selected }: { allCats: Cat[]; selected: string[] }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const t = useTranslation();
  const { language } = useLanguage();
  const [selectedKeys, setSelectedKeys] = useState<string[]>(selected);

  const families = useMemo<CategoryFamily[]>(() => {
    const familyMap = new Map<string, CategoryFamily>();
    for (const definition of [...FAMILY_DEFINITIONS, OTHER_FAMILY]) {
      familyMap.set(definition.id, { ...definition, items: [] });
    }

    for (const category of allCats) {
      const label = resolveLabel(category, language);
      const option = {
        key: category.key,
        label,
        searchText: normalizeValue(`${category.key} ${label}`),
      };
      const family = assignFamily(option);
      familyMap.get(family.id)?.items.push(option);
    }

    return [...familyMap.values()]
      .map((family) => ({
        ...family,
        items: [...family.items].sort((left, right) => left.label.localeCompare(right.label)),
      }))
      .filter((family) => family.items.length > 0);
  }, [allCats, language]);

  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const selectedLabels = useMemo(
    () =>
      families
        .flatMap((family) => family.items)
        .filter((item) => selectedSet.has(item.key))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [families, selectedSet],
  );
  const [activeFamilyId, setActiveFamilyId] = useState<string>("all");
  const activeFamily = families.find((family) => family.id === activeFamilyId) ?? families[0] ?? null;
  const visibleItems = activeFamilyId === "all" ? families.flatMap((family) => family.items) : activeFamily?.items ?? [];

  function toggleCategory(key: string) {
    setSelectedKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function toggleFamily(family: CategoryFamily) {
    const familyKeys = family.items.map((item) => item.key);
    const shouldClear = familyKeys.every((key) => selectedSet.has(key));

    setSelectedKeys((current) => {
      if (shouldClear) {
        return current.filter((key) => !familyKeys.includes(key));
      }

      const next = new Set(current);
      for (const key of familyKeys) {
        next.add(key);
      }
      return [...next];
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const fd = new FormData(e.currentTarget);
      await saveCategories(fd);
      setMsg(t("vendorDashboard.categories.success"));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {selectedKeys.map((key) => (
        <input key={key} type="hidden" name="categories" value={key} />
      ))}

      <div className="mb-4">
        <div className="form-text mb-2">{t("vendorDashboard.categories.instructions")}</div>
        <p className="wm-category-picker__lead">{t("vendorDashboard.categories.helper")}</p>

        <div className="wm-category-picker__summary">
          <div>
            <div className="wm-category-picker__summary-label">{t("vendorDashboard.categories.selectedServices")}</div>
            <div className="wm-category-picker__summary-count">{selectedKeys.length}</div>
          </div>
          <div className="wm-category-picker__summary-chips">
            {selectedLabels.length > 0 ? (
              selectedLabels.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="wm-category-chip wm-category-chip--selected"
                  onClick={() => toggleCategory(item.key)}
                >
                  {item.label}
                </button>
              ))
            ) : (
              <span className="wm-category-picker__empty">{t("vendorDashboard.categories.noSelection")}</span>
            )}
          </div>
        </div>

        <div className="wm-category-picker__workspace">
          <div className="wm-category-filter-tabs" role="tablist" aria-label={t("vendorDashboard.categories.browseByGroup")}>
            <button
              type="button"
              className={`wm-category-filter-tab${activeFamilyId === "all" ? " is-active" : ""}`}
              aria-pressed={activeFamilyId === "all"}
              onClick={() => setActiveFamilyId("all")}
            >
              {t("vendorDashboard.categories.allServices")}
            </button>
            {families.map((family) => (
              <button
                key={family.id}
                type="button"
                className={`wm-category-filter-tab${activeFamilyId === family.id ? " is-active" : ""}`}
                aria-pressed={activeFamilyId === family.id}
                onClick={() => setActiveFamilyId(family.id)}
              >
                {getCopy(family.title, language)}
              </button>
            ))}
          </div>

          <section className="wm-category-picker__panel">
            <div className="wm-category-picker__panel-header">
              <div>
                <div className="wm-category-picker__panel-label">{t("vendorDashboard.categories.specialtiesLabel")}</div>
                <h3 className="wm-category-picker__panel-title">
                  {activeFamilyId === "all" || !activeFamily
                    ? t("vendorDashboard.categories.allServices")
                    : getCopy(activeFamily.title, language)}
                </h3>
                {activeFamilyId !== "all" && activeFamily ? (
                  <p className="wm-category-picker__panel-description">{getCopy(activeFamily.description, language)}</p>
                ) : null}
              </div>
              {activeFamily && activeFamilyId !== "all" ? (
                <button
                  type="button"
                  className="wm-category-picker__panel-action"
                  onClick={() => toggleFamily(activeFamily)}
                >
                  {activeFamily.items.every((item) => selectedSet.has(item.key))
                    ? t("vendorDashboard.categories.clear")
                    : t("vendorDashboard.categories.selectAll")}
                </button>
              ) : null}
            </div>

            <div className="wm-category-picker__chip-grid">
              {visibleItems.map((item) => {
                const pressed = selectedSet.has(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`wm-category-chip${pressed ? " wm-category-chip--selected" : ""}`}
                    aria-pressed={pressed}
                    onClick={() => toggleCategory(item.key)}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
      <button className="btn btn-primary" disabled={busy}>
        {busy ? t("vendorDashboard.categories.saving") : t("vendorDashboard.categories.save")}
      </button>
      {msg && <div className="alert alert-success mt-3">{msg}</div>}
      {err && <div className="alert alert-danger mt-3">{err}</div>}
    </form>
  );
}
