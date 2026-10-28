"use client";

import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { addToShortlist, inShortlist, removeFromShortlist } from "@/lib/shortlist";
import HeaderIcon from '@/components/HeaderIcon';

type ShortlistButtonProps = {
  vendorId: string;
  className?: string;
  sizeClassName?: string;
  iconOnly?: boolean;
};

export default function ShortlistButton({
  vendorId,
  className = "",
  sizeClassName = "btn-sm",
  iconOnly = false,
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
      aria-pressed={added}
      aria-label={iconOnly ? added ? labels.inList : labels.add : undefined}
      title={iconOnly ? added ? labels.inList : labels.add : undefined}
      className={`btn ${added ? "btn-success" : "btn-outline-secondary"} ${sizeClassName} ${className}`.trim()}
      onClick={handleClick}
    >
      {iconOnly ? <HeaderIcon name="heart" /> : added ? `${labels.inList} ✓` : labels.add}
    </button>
  );
}
