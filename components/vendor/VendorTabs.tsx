"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState, type MouseEvent } from "react";

export type VendorTab = {
  id: string;
  label: string;
};

type VendorTabsProps = {
  sections: readonly VendorTab[];
  className?: string;
};

const SCROLL_OFFSET = 120;

export default function VendorTabs({ sections, className }: VendorTabsProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0]!.target.id);
        }
      },
      {
        rootMargin: `-${SCROLL_OFFSET}px 0px -60% 0px`,
        threshold: [0, 0.25, 0.5, 1],
      }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [sections]);

  const handleClick = (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - (SCROLL_OFFSET - 20);
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const tabs = useMemo(() => sections, [sections]);

  return (
    <div className={className}>
      <nav className="nav nav-underline justify-content-start gap-3 py-3" aria-label="Secciones del proveedor">
        {tabs.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={handleClick(section.id)}
            className={clsx("nav-link text-nowrap", {
              active: activeId === section.id,
            })}
            aria-current={activeId === section.id ? "page" : undefined}
          >
            {section.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
