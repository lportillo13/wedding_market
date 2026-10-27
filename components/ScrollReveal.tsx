"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const show = (element: HTMLElement) => {
      element.setAttribute(REVEAL_ATTRIBUTE, "visible");
      observer?.unobserve(element);
    };

    // Keyboard users should never focus an element that is still visually hidden.
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      let pending = event.target.closest<HTMLElement>(`[${REVEAL_ATTRIBUTE}="pending"]`);
      while (pending) {
        show(pending);
        pending = pending.parentElement?.closest<HTMLElement>(`[${REVEAL_ATTRIBUTE}="pending"]`) ?? null;
      }
    };
    document.addEventListener("focusin", onFocus);

    const observeNewTargets = () => {
      getRevealTargets().forEach((element) => {
        if (element.getAttribute(REVEAL_ATTRIBUTE) === "visible") return;

        if (reducedMotionQuery.matches) {
          show(element);
          return;
        }

        const bounds = element.getBoundingClientRect();
        const isInInitialViewport = bounds.bottom > 0 && bounds.top < window.innerHeight * 0.9;

        if (isInInitialViewport) {
          show(element);
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
      document.removeEventListener("focusin", onFocus);
      observer?.disconnect();
      mutationObserver?.disconnect();
    };
  }, []);

  return null;
}
