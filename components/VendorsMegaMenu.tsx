"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ChangeEvent, type FocusEvent, type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export type HeaderVendorCategory = {
  key: string;
  label: {
    en: string;
    es: string;
  };
};

type VendorSuggestion = {
  slug: string;
  business_name: string;
  categories?: string[] | null;
};

type VendorsMegaMenuProps = {
  categories: HeaderVendorCategory[];
  closeMobileNav?: () => void;
};

function normalizeTerm(value: string) {
  return value.trim();
}

export default function VendorsMegaMenu({ categories, closeMobileNav }: VendorsMegaMenuProps) {
  const router = useRouter();
  const { dictionary, language } = useLanguage();
  const pathname = usePathname();
  const labels = dictionary.nav.vendorsMenu;
  const menuId = useId();
  const rootRef = useRef<HTMLLIElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<VendorSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const localizedCategories = useMemo(
    () =>
      categories.map((category) => ({
        key: category.key,
        label: language === "en" ? category.label.en : category.label.es,
      })),
    [categories, language],
  );

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    const normalized = normalizeTerm(query);
    if (!isOpen || normalized.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/vendors/suggest?q=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Suggestion request failed (${response.status})`);
        }

        const payload = (await response.json()) as { items?: VendorSuggestion[] };
        setSuggestions(payload.items ?? []);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, query]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 992px)").matches) {
      clearCloseTimeout();
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 992px)").matches) {
      clearCloseTimeout();
      closeTimeoutRef.current = window.setTimeout(() => {
        setIsOpen(false);
        closeTimeoutRef.current = null;
      }, 1000);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLLIElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const selected = suggestions[activeIndex];
      if (selected) {
        router.push(`/vendors/${selected.slug}`);
      }
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const closeAll = () => {
    clearCloseTimeout();
    setIsOpen(false);
    closeMobileNav?.();
  };

  return (
    <li
      className={`nav-item vendors-mega-nav${isOpen ? " is-open" : ""}`}
      ref={rootRef}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="nav-link vendors-mega-toggle btn btn-link"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={handleToggle}
      >
        <span>{dictionary.nav.vendors}</span>
        <span className={`vendors-mega-caret${isOpen ? " is-open" : ""}`} aria-hidden="true">
          ▾
        </span>
      </button>

      <div
        id={menuId}
        className={`vendors-mega-panel${isOpen ? " is-open" : ""}`}
        role="group"
        aria-label={labels.panelLabel}
      >
        <div className="vendors-mega-grid">
          <section className="vendors-mega-search">
            <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
              <div>
                <div className="vendors-mega-eyebrow">{labels.searchEyebrow}</div>
                <h3 className="h5 mb-1">{labels.searchHeading}</h3>
                <p className="text-secondary mb-0">{labels.searchDescription}</p>
              </div>
              <Link href="/vendors" className="btn btn-outline-secondary btn-sm" onClick={closeAll}>
                {labels.browseAll}
              </Link>
            </div>

            <div className="position-relative mt-3">
              <input
                type="search"
                className="form-control form-control-lg"
                placeholder={labels.searchPlaceholder}
                value={query}
                onChange={handleSearchChange}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
                aria-label={labels.searchPlaceholder}
                aria-autocomplete="list"
                aria-controls={`${menuId}-suggestions`}
                aria-activedescendant={activeIndex >= 0 ? `${menuId}-suggestion-${activeIndex}` : undefined}
              />

              {(loading || suggestions.length > 0 || normalizeTerm(query).length >= 2) && (
                <div className="vendors-suggestion-list shadow-sm" id={`${menuId}-suggestions`} role="listbox">
                  {loading ? <div className="vendors-suggestion-empty">{labels.loading}</div> : null}
                  {!loading && suggestions.length > 0
                    ? suggestions.map((suggestion, index) => {
                        const categoryText = (suggestion.categories ?? [])
                          .map((categoryKey) => localizedCategories.find((item) => item.key === categoryKey)?.label ?? categoryKey)
                          .slice(0, 2)
                          .join(" • ");

                        return (
                          <Link
                            key={suggestion.slug}
                            id={`${menuId}-suggestion-${index}`}
                            href={`/vendors/${suggestion.slug}`}
                            className={`vendors-suggestion-item${index === activeIndex ? " is-active" : ""}`}
                            role="option"
                            aria-selected={index === activeIndex}
                            onClick={closeAll}
                            onMouseEnter={() => setActiveIndex(index)}
                          >
                            <span className="vendors-suggestion-name">{suggestion.business_name}</span>
                            {categoryText ? <span className="vendors-suggestion-meta">{categoryText}</span> : null}
                          </Link>
                        );
                      })
                    : null}
                  {!loading && suggestions.length === 0 && normalizeTerm(query).length >= 2 ? (
                    <div className="vendors-suggestion-empty">{labels.noResults}</div>
                  ) : null}
                </div>
              )}
            </div>
          </section>

          <section className="vendors-mega-categories">
            <div className="vendors-mega-eyebrow">{labels.categoriesEyebrow}</div>
            <h3 className="h5 mb-3">{labels.categoriesHeading}</h3>
            <div className="vendors-category-grid">
              {localizedCategories.map((category) => (
                <Link
                  key={category.key}
                  href={`/vendors?category=${encodeURIComponent(category.key)}`}
                  className="vendors-category-link"
                  onClick={closeAll}
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </li>
  );
}
