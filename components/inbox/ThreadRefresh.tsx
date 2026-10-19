"use client";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

/** Refresh visible conversations without reloading the page or clearing drafts. */
export default function ThreadRefresh() {
  const router = useRouter();
  const [pending, transition] = useTransition();
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden && !pending) transition(() => router.refresh());
    };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [router, pending]);
  return null;
}
