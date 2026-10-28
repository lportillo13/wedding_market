"use client";

import clsx from "clsx";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
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

export default function VendorTabs({ sections, className }: VendorTabsProps) {
  const { dictionary } = useLanguage();
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const navigationRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const navigation = navigationRef.current;
    const activeLink = navigation?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!navigation || !activeLink) return;
    const navigationBounds = navigation.getBoundingClientRect();
    const linkBounds = activeLink.getBoundingClientRect();
    if (linkBounds.left < navigationBounds.left || linkBounds.right > navigationBounds.right) {
      navigation.scrollTo({
        left: navigation.scrollLeft + linkBounds.left - navigationBounds.left - (navigation.clientWidth - linkBounds.width) / 2,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  }, [activeId]);

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

  const tabs = useMemo(() => sections, [sections]);

  return (
    <div className={className}>
      <nav
        ref={navigationRef}
        className="nav nav-underline justify-content-start gap-3 py-3"
        aria-label={dictionary.vendorPublic.editorial.navigation}
      >
        {tabs.map((section) => (
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
      </nav>
    </div>
  );
}
