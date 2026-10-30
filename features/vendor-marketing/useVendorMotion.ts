"use client";

import { useEffect, type RefObject } from "react";

// Content stays visible without JavaScript. Only nearby, offscreen elements
// become reveal targets; long sections and the sticky studio never transform.
export function useVendorMotion(root: RefObject<HTMLElement | null>, paused: boolean) {
  useEffect(() => {
    const page = root.current;
    if (!page) return;
    const targets = Array.from(page.querySelectorAll<HTMLElement>("[data-vendor-reveal]"));
    const show = (target: HTMLElement) => { target.dataset.reveal = "visible"; };
    if (paused) {
      targets.forEach((target) => { target.removeAttribute("data-reveal"); });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      targets.forEach(show);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -5% 0px", threshold: 0.05 });
    targets.forEach((target) => {
      if (target.dataset.reveal === "visible") return;
      if (target.getBoundingClientRect().top < window.innerHeight * .95) show(target);
      else { target.dataset.reveal = "pending"; observer.observe(target); }
    });
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      let target = event.target.closest<HTMLElement>("[data-vendor-reveal]");
      while (target && page.contains(target)) {
        show(target);
        observer.unobserve(target);
        target = target.parentElement?.closest<HTMLElement>("[data-vendor-reveal]") ?? null;
      }
    };
    page.addEventListener("focusin", onFocus);
    return () => { observer.disconnect(); page.removeEventListener("focusin", onFocus); };
  }, [root, paused]);
}
