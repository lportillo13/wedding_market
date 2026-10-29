"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/** Keep cover navigation transparent until it meets its sticky header offset. */
export default function HeroSectionNav({ children, className, coverSelector, enabled = true, as: Element = 'div', label }: {
  children: ReactNode;
  className: string;
  coverSelector: string;
  enabled?: boolean;
  as?: 'div' | 'nav';
  label?: string;
}) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [solid, setSolid] = useState(!enabled);
  const previousSolid = useRef(!enabled);
  const attach = useCallback((element: HTMLElement | null) => { elementRef.current = element; }, []);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const scope = element.closest('main');
    const header = document.querySelector('.wm-site-header');
    const cover = scope?.querySelector(coverSelector);
    let frame = 0;
    let disposed = false;
    const sync = () => {
      frame = 0;
      if (disposed) return;
      const offset = Number.parseFloat(getComputedStyle(element).top) || 0;
      const next = !enabled || !scope?.querySelector(coverSelector) || element.getBoundingClientRect().top <= offset + 1;
      if (next !== previousSolid.current) {
        previousSolid.current = next;
        setSolid(next);
      }
    };
    const schedule = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(sync);
    };
    sync();
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    if (header) observer.observe(header);
    if (cover) observer.observe(cover);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [coverSelector, enabled]);

  return <Element ref={attach} className={className} aria-label={label} data-hero-state={solid ? 'solid' : 'cover'}>{children}</Element>;
}
