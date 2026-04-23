"use client";

import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { addToShortlist, inShortlist, removeFromShortlist } from "@/lib/shortlist";

type ShortlistButtonProps = {
  vendorId: string;
  className?: string;
  sizeClassName?: string;
};

export default function ShortlistButton({
  vendorId,
  className = "",
  sizeClassName = "btn-sm",
}: ShortlistButtonProps) {
  const [added, setAdded] = useState<boolean>(false);
  const { dictionary } = useLanguage();
  const labels = dictionary.shortlistButton;

  useEffect(() => {
    const sync = () => setAdded(inShortlist(vendorId));
    sync();
    window.addEventListener("wm-shortlist-changed", sync);
    return () => window.removeEventListener("wm-shortlist-changed", sync);
  }, [vendorId]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (added) removeFromShortlist(vendorId);
    else addToShortlist(vendorId);
  };

  return (
    <button
      type="button"
      className={`btn ${added ? "btn-success" : "btn-outline-secondary"} ${sizeClassName} ${className}`.trim()}
      onClick={handleClick}
    >
      {added ? `${labels.inList} ✓` : labels.add}
    </button>
  );
}
