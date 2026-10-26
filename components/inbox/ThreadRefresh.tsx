"use client";
import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { INBOX_THREAD_REFRESH_MS, RefreshGate } from "@/shared/resources/refresh-gate";

/** Refresh visible conversations without reloading the page or clearing drafts. */
export default function ThreadRefresh() {
  const router = useRouter();
  const [pending, transition] = useTransition();
  const gate = useRef(new RefreshGate());
  useEffect(() => { if (!pending) gate.current.finish(); }, [pending]);
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden && navigator.onLine && gate.current.begin(Date.now())) transition(() => router.refresh());
    };
    const timer = window.setInterval(refresh, INBOX_THREAD_REFRESH_MS);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);
  return null;
}
