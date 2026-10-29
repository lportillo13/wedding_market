"use client";

import clsx from "clsx";
import HeaderIcon from "@/components/HeaderIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { getVendorNavigationHeight } from '@/features/vendors/client/viewport';

export type VendorTab = {
  id: string;
  label: string;
};

type VendorTabsProps = {
  sections: readonly VendorTab[];
  className?: string;
};

function getScrollOffset() {
  return getVendorNavigationHeight() + 20;
}

function getMenuPlacement(button: HTMLButtonElement, count: number) {
  const bounds = button.getBoundingClientRect();
  const below = window.innerHeight - bounds.bottom;
  const above = bounds.top;
  const up = below < Math.min(count * 44 + 16, 352) && above > below;
  return { up, maxHeight: Math.max(44, Math.min(352, window.innerHeight * .6, (up ? above : below) - 16)) };
}

export default function VendorTabs({ sections, className }: VendorTabsProps) {
  const { dictionary } = useLanguage();
  const moreLabel = dictionary.vendorPublic.tabs.more;
  const menuId = useId();
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const [visibleCount, setVisibleCount] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState({ up: false, maxHeight: 352 });
  const navigationRef = useRef<HTMLElement | null>(null);
  const measurementRef = useRef<HTMLDivElement | null>(null);
  const overflowRef = useRef<HTMLDivElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const measuredCountRef = useRef(0);

  useLayoutEffect(() => {
    const navigation = navigationRef.current;
    const measurement = measurementRef.current;
    if (!navigation || !measurement) return;
    let disposed = false;
    const measure = () => {
      if (disposed || navigation.clientWidth === 0) return;
      const widths = Array.from(measurement.children, (item) => item.getBoundingClientRect().width);
      const linkWidths = widths.slice(0, sections.length);
      const gap = Number.parseFloat(getComputedStyle(navigation).columnGap) || 0;
      const available = navigation.clientWidth - 1;
      const allLinksWidth = linkWidths.reduce((total, width) => total + width, 0) + gap * Math.max(0, sections.length - 1);
      let count = sections.length;
      if (allLinksWidth > available) {
        let used = widths[sections.length] ?? 0;
        count = 0;
        for (const width of linkWidths) {
          if (used + gap + width > available) break;
          used += gap + width;
          count += 1;
        }
      }
      if (count !== measuredCountRef.current) {
        measuredCountRef.current = count;
        setVisibleCount(count);
        setMoreOpen(false);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(navigation);
    Array.from(measurement.children).forEach((item) => observer.observe(item));
    void document.fonts.ready.then(measure);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [sections, moreLabel]);

  useEffect(() => {
    if (!moreOpen) return;
    let animationFrame = 0;
    const close = () => setMoreOpen(false);
    const onScroll = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        const button = moreButtonRef.current;
        if (!button) return;
        const next = getMenuPlacement(button, sections.length - visibleCount);
        setMenuPlacement((current) => current.up === next.up && Math.abs(current.maxHeight - next.maxHeight) < 1 ? current : next);
      });
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !overflowRef.current?.contains(event.target)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        moreButtonRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", close);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [moreOpen, sections.length, visibleCount]);

  useEffect(() => {
    let animationFrame = 0;

    const updateActiveSection = () => {
      const activationLine = getScrollOffset() + 24;
      let nextActiveId = sections[0]?.id ?? "";

      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= activationLine) {
          nextActiveId = section.id;
        }
      });

      setActiveId(nextActiveId);
      animationFrame = 0;
    };

    const handleScroll = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [sections]);

  const handleClick =
    (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const el = document.getElementById(id);
      if (!el) return;
      if (overflowRef.current?.contains(event.currentTarget)) moreButtonRef.current?.focus({ preventScroll: true });
      setMoreOpen(false);
      setActiveId(id);
      const y =
        el.getBoundingClientRect().top + window.scrollY - getScrollOffset();
      window.scrollTo({
        top: y,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    };

  const visibleTabs = sections.slice(0, visibleCount);
  const overflowTabs = sections.slice(visibleCount);
  const activeOverflowTab = overflowTabs.find((section) => section.id === activeId);

  const toggleMore = () => {
    if (!moreOpen && moreButtonRef.current) setMenuPlacement(getMenuPlacement(moreButtonRef.current, overflowTabs.length));
    setMoreOpen((open) => !open);
  };

  return (
    <div className={clsx("wm-vendor-tabs", className)}>
      <nav
        ref={navigationRef}
        className="nav nav-underline justify-content-start"
        aria-label={dictionary.vendorPublic.editorial.navigation}
      >
        {visibleTabs.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={handleClick(section.id)}
            className={clsx("nav-link text-nowrap", {
              active: activeId === section.id,
            })}
            aria-current={activeId === section.id ? "location" : undefined}
          >
            {section.label}
          </a>
        ))}
        {overflowTabs.length > 0 && <div
          className="wm-vendor-tabs__overflow"
          ref={overflowRef}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setMoreOpen(false);
          }}
        >
          <button
            ref={moreButtonRef}
            className={clsx("nav-link wm-vendor-tabs__more", { active: Boolean(activeOverflowTab) })}
            type="button"
            aria-label={activeOverflowTab ? `${moreLabel}: ${activeOverflowTab.label}` : moreLabel}
            aria-expanded={moreOpen}
            aria-controls={menuId}
            onClick={toggleMore}
          >
            {moreLabel}<HeaderIcon name="chevron" aria-hidden="true" />
          </button>
          <div
            id={menuId}
            className={clsx("wm-vendor-tabs__menu", { "wm-vendor-tabs__menu--up": menuPlacement.up })}
            style={{ maxHeight: menuPlacement.maxHeight }}
            hidden={!moreOpen}
          >
            {overflowTabs.map((section) => <a
              key={section.id}
              href={`#${section.id}`}
              className={clsx("nav-link", { active: activeId === section.id })}
              aria-current={activeId === section.id ? "location" : undefined}
              onClick={handleClick(section.id)}
            >{section.label}</a>)}
          </div>
        </div>}
      </nav>
      <div className="wm-vendor-tabs__measure" ref={measurementRef} aria-hidden="true">
        {sections.map((section) => <span className="nav-link text-nowrap" key={section.id}>{section.label}</span>)}
        <span className="nav-link wm-vendor-tabs__more">{moreLabel}<HeaderIcon name="chevron" /></span>
      </div>
    </div>
  );
}
