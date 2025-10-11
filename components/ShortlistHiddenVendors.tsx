// components/ShortlistHiddenVendors.tsx
"use client";
import { useEffect, useRef } from "react";

export default function ShortlistHiddenVendors() {
  const ref = useRef<HTMLInputElement>(null);

  const readShortlist = () => {
    // Try common keys; adapt if your key differs
    const raw = localStorage.getItem("wm-shortlist") ?? localStorage.getItem("shortlist");
    try {
      const ids = raw ? JSON.parse(raw) : [];
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const setValue = () => {
      const ids = readShortlist();
      if (ref.current) ref.current.value = JSON.stringify(ids.slice(0, 10)); // enforce max invites = 10
    };
    setValue();

    // Update when your app fires changes
    const handler = () => setValue();
    window.addEventListener("wm-shortlist-changed", handler);
    return () => window.removeEventListener("wm-shortlist-changed", handler);
  }, []);

  return <input ref={ref} type="hidden" name="vendor_ids_json" defaultValue="[]" />;
}
