"use client";

import { useEffect, useRef, useState } from "react";
import { dictionaries, type SupportedLanguage } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LanguageDropdown() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div className="dropdown" ref={menuRef}>
      <button
        className="btn btn-outline-secondary dropdown-toggle wm-header-action"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {language.toUpperCase()}
      </button>
      <ul className={`dropdown-menu dropdown-menu-end${open ? " show" : ""}`}>
        {(Object.keys(dictionaries) as SupportedLanguage[]).map((code) => (
          <li key={code}>
            <button
              type="button"
              className={`dropdown-item${language === code ? " active" : ""}`}
              onClick={() => handleSelect(code)}
            >
              {code.toUpperCase()}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
