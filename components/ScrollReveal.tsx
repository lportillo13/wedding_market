"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_SELECTOR = "main > section, main > article, [data-scroll-reveal]";
const REVEAL_ATTRIBUTE = "data-wm-scroll-reveal";

function getRevealTargets(): HTMLElement[] {
  const targets = new Set<HTMLElement>();

  document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((element) => {
    if (!element.closest(".wm-about-page")) {
      targets.add(element);
    }
  });

  document.querySelectorAll<HTMLElement>("main").forEach((main) => {
    if (main.matches(".wm-about-page") || main.querySelector(":scope > section, :scope > article")) {
      return;
    }

    targets.add(main);
  });

  return Array.from(targets);
}

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const show = (element: HTMLElement) => {
      element.setAttribute(REVEAL_ATTRIBUTE, "visible");
      observer?.unobserve(element);
    };

    const observeNewTargets = () => {
      getRevealTargets().forEach((element) => {
        if (element.hasAttribute(REVEAL_ATTRIBUTE)) return;

        if (reducedMotionQuery.matches) {
          element.setAttribute(REVEAL_ATTRIBUTE, "visible");
          return;
        }

        element.setAttribute(REVEAL_ATTRIBUTE, "pending");
        observer?.observe(element);
      });
    };

    if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
      getRevealTargets().forEach(show);
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) show(entry.target as HTMLElement);
          });
        },
        {
          rootMargin: "0px 0px -8% 0px",
          threshold: 0.01,
        },
      );

      observeNewTargets();

      mutationObserver = new MutationObserver(observeNewTargets);
      mutationObserver.observe(document.querySelector(".wm-site-shell__content") ?? document.body, {
        childList: true,
        subtree: true,
      });
    }

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      getRevealTargets().forEach(show);
      observer?.disconnect();
      mutationObserver?.disconnect();
    };

    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

    return () => {
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
      observer?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [pathname]);

  return null;
}
