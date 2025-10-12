"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { parseCloudinaryImage } from "@/lib/images";
import UserAvatar from "@/components/UserAvatar";
import { useTranslation } from "@/contexts/LanguageContext";

type AuthDropdownProps = {
  user: User;
  isVendor: boolean;
};

export default function AuthDropdown({ user, isVendor }: AuthDropdownProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const profileHref = isVendor ? "/vendor/profile" : "/account/profile";
  const t = useTranslation();
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const metadataFullName = metadata?.full_name;
  const metadataAvatar = metadata?.avatar_image;
  const fullName = useMemo(() => {
    const name = metadataFullName;
    return typeof name === "string" ? name : "";
  }, [metadataFullName]);
  const avatarImage = useMemo(() => parseCloudinaryImage(metadataAvatar), [metadataAvatar]);
  const displayName = fullName || user.email || t("auth.account");

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleFocusOut = (event: FocusEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.relatedTarget as Node)) {
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
        className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <UserAvatar image={avatarImage} name={displayName} size={32} />
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
        {isVendor && (
          <li>
            <Link className="dropdown-item" href="/vendor/rfqs">
              {t("auth.vendorRfqs")}
            </Link>
          </li>
        )}
        <li>
          <form action="/auth/signout" method="post">
            <button className="dropdown-item" type="submit" onClick={() => setOpen(false)}>
              {t("auth.logOut")}
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}
