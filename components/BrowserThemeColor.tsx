"use client";

import { useEffect } from "react";
import { BROWSER_THEME } from "@/lib/browser-theme";

const COVER_SELECTOR = ".wm-founders-hero, .wm-profile-editorial, .wm-boutique-hero:not(.wm-boutique-hero--empty)";

export default function BrowserThemeColor({ pathname, isCoverPage, menuOpen }: {
  pathname: string;
  isCoverPage: boolean;
  menuOpen: boolean;
}) {
  useEffect(() => {
    const content = document.querySelector(".wm-site-shell__content");
    let frame = 0;
    function sync() {
      frame = 0;
      const hasCover = isCoverPage && !!content?.querySelector(COVER_SELECTOR);
      const color = hasCover && !menuOpen ? BROWSER_THEME.cover : BROWSER_THEME.paper;
      const meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (meta && meta.content !== color) meta.content = color;
    }
    sync();
    // Boutique details and fitting forms change without changing the pathname.
    // Observe only cover-page child additions/removals, never scroll or attributes.
    const observer = isCoverPage && !menuOpen && content ? new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(sync);
    }) : null;
    if (observer && content) observer.observe(content, { childList: true, subtree: true });
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname, isCoverPage, menuOpen]);

  return null;
}
