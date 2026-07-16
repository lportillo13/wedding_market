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
    let animationFrame = 0;

    const updateActiveSection = () => {
      const activationLine = SCROLL_OFFSET + 24;
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

  const handleClick = (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    setActiveId(id);
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
