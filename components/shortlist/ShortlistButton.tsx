"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { addToShortlist, inShortlist, removeFromShortlist } from "@/lib/shortlist";

export default function ShortlistButton({ vendorId }: { vendorId: string }) {
  const [added, setAdded] = useState<boolean>(false);
  const { dictionary } = useLanguage();
  const labels = dictionary.shortlistButton;

  useEffect(() => {
    const sync = () => setAdded(inShortlist(vendorId));
    sync();
    window.addEventListener("wm-shortlist-changed", sync);
    return () => window.removeEventListener("wm-shortlist-changed", sync);
  }, [vendorId]);

  return (
    <button
      type="button"
      className={`btn ${added ? "btn-success" : "btn-outline-secondary"} btn-sm`}
      onClick={() => {
        if (added) removeFromShortlist(vendorId);
        else addToShortlist(vendorId);
      }}
    >
      {added ? `${labels.inList} ✔` : labels.add}
    </button>
  );
}
