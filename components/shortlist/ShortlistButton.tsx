"use client";

import { useEffect, useState } from "react";
import { addToShortlist, inShortlist, removeFromShortlist } from "@/lib/shortlist";

export default function ShortlistButton({ vendorId }: { vendorId: string }) {
  const [added, setAdded] = useState<boolean>(false);

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
      {added ? "In shortlist ✔" : "Add to shortlist"}
    </button>
  );
}
