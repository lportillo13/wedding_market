"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { parseCloudinaryImage } from "@/lib/images";
import { supportedLanguages, type SupportedLanguage } from "@/lib/i18n";
import UserAvatar from "@/components/UserAvatar";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { CloudinaryImage } from "@/types/images";

type AuthDropdownProps = {
  user: User;
  isVendor: boolean;
};

export default function AuthDropdown({ user, isVendor }: AuthDropdownProps) {
  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [vendorLogoUrl, setVendorLogoUrl] = useState<string | null>(null);
  const [vendorBusinessName, setVendorBusinessName] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const profileHref = isVendor ? "/vendor/profile" : "/account/profile";
  const t = useTranslation();
  const { language, setLanguage } = useLanguage();
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const metadataFullName = metadata?.full_name;
  const metadataAvatar = metadata?.avatar_image;
  const fullName = useMemo(() => {
    const name = metadataFullName;
    return typeof name === "string" ? name : "";
  }, [metadataFullName]);
  const avatarImage = useMemo(() => parseCloudinaryImage(metadataAvatar), [metadataAvatar]);
  const vendorAvatarImage = useMemo<CloudinaryImage | null>(() => {
    if (!vendorLogoUrl) {
      return null;
    }

    return {
      url: vendorLogoUrl,
      public_id: vendorLogoUrl,
      width: 32,
      height: 32,
      format: "webp",
    };
  }, [vendorLogoUrl]);
  const displayName = vendorBusinessName || fullName || user.email || t("auth.account");

  const handleLanguageSelect = (value: SupportedLanguage) => {
    setLanguage(value);
    setLanguageOpen(false);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setLanguageOpen(false);
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLanguageOpen(false);
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setLanguageOpen(false);
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;

    async function loadVendorHeaderData() {
      if (!isVendor) {
        setVendorLogoUrl(null);
        setVendorBusinessName(null);
        return;
      }

      const { data } = await supabaseBrowser
        .from("vendors")
        .select("business_name, logo_url")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      setVendorLogoUrl(typeof data?.logo_url === "string" ? data.logo_url : null);
      setVendorBusinessName(typeof data?.business_name === "string" ? data.business_name : null);
    }

    void loadVendorHeaderData();

    return () => {
      cancelled = true;
    };
  }, [isVendor, user.id]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleFocusOut = (event: FocusEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.relatedTarget as Node)) {
        setLanguageOpen(false);
        setOpen(false);
      }
    };

    const currentMenu = menuRef.current;
    currentMenu?.addEventListener("focusout", handleFocusOut);

    return () => currentMenu?.removeEventListener("focusout", handleFocusOut);
  }, [open]);

  return (
    <div className="dropdown ms-auto" ref={menuRef}>
      <button
        className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2 wm-header-action"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <UserAvatar image={vendorAvatarImage || avatarImage} name={displayName} size={32} />
        <span className="text-truncate" style={{ maxWidth: 160 }}>
          {displayName}
        </span>
      </button>
      <ul className={`dropdown-menu dropdown-menu-end${open ? " show" : ""}`}>
        <li>
          <Link className="dropdown-item" href={profileHref}>
            {t("auth.profile")}
          </Link>
        </li>
        <li>
          <Link className="dropdown-item" href={isVendor ? "/vendor/notifications" : "/account/notifications"}>
            {t("auth.notifications")}
          </Link>
        </li>
        {isVendor && (
          <li>
            <Link className="dropdown-item" href="/vendor/inbox">
              {t("auth.vendorRfqs")}
            </Link>
          </li>
        )}
        <li>
          <button
            className="dropdown-item d-flex align-items-center justify-content-between"
            type="button"
            aria-expanded={languageOpen}
            onClick={() => setLanguageOpen((prev) => !prev)}
          >
            <span>{t("languageSelector.label")}</span>
            <span className={`auth-dropdown-caret${languageOpen ? " is-open" : ""}`} aria-hidden="true">
              ▾
            </span>
          </button>
        </li>
        {languageOpen &&
          supportedLanguages.map((code) => (
            <li key={code}>
              <button
                className={`dropdown-item auth-dropdown-subitem${language === code ? " active" : ""}`}
                type="button"
                onClick={() => handleLanguageSelect(code)}
              >
                {code === "en" ? t("languageSelector.english") : t("languageSelector.spanish")}
              </button>
            </li>
          ))}
        <li>
          <button
            className="dropdown-item"
            type="button"
            disabled={signingOut}
            onClick={async () => {
              setOpen(false);
              setSigningOut(true);
              try {
                await supabaseBrowser.auth.signOut();
                const response = await fetch("/auth/signout", {
                  method: "POST",
                  credentials: "same-origin",
                });

                if (!response.ok) {
                  throw new Error("Failed to complete sign out on the server.");
                }

                window.location.assign("/");
                return;
              } finally {
                setSigningOut(false);
              }
            }}
          >
            {signingOut ? "Signing out..." : t("auth.logOut")}
          </button>
        </li>
      </ul>
    </div>
  );
}
