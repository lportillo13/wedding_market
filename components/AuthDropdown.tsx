"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import HeaderSignOutButton from "./HeaderSignOutButton";
import { parseCloudinaryImage } from "@/lib/images";
import UserAvatar from "@/components/UserAvatar";
import { useTranslation } from "@/contexts/LanguageContext";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { CloudinaryImage } from "@/types/images";

type AuthDropdownProps = {
  user: User;
  isVendor: boolean;
};

export default function AuthDropdown({ user, isVendor }: AuthDropdownProps) {
  const [open, setOpen] = useState(false);
  const [vendorLogoUrl, setVendorLogoUrl] = useState<string | null>(null);
  const [vendorBusinessName, setVendorBusinessName] = useState<string | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useId();
  const pathname = usePathname();
  const profileHref = isVendor ? "/vendor/profile" : "/account/profile";
  const t = useTranslation();
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const metadataFullName = metadata?.full_name;
  const metadataAvatar = metadata?.avatar_image;
  const fullName = useMemo(() => {
    const name = metadataFullName;
    return typeof name === "string" ? name : "";
  }, [metadataFullName]);
  const avatarImage = useMemo(
    () => parseCloudinaryImage(metadataAvatar),
    [metadataAvatar],
  );
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
  const displayName =
    vendorBusinessName || fullName || user.email || t("auth.account");

  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

      setVendorLogoUrl(
        typeof data?.logo_url === "string" ? data.logo_url : null,
      );
      setVendorBusinessName(
        typeof data?.business_name === "string" ? data.business_name : null,
      );
    }

    void loadVendorHeaderData().catch(() => {
      // Keep the account menu usable when optional vendor details are offline.
    });

    return () => {
      cancelled = true;
    };
  }, [isVendor, user.id]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleFocusOut = (event: FocusEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.relatedTarget as Node)
      ) {
        setOpen(false);
      }
    };

    const currentMenu = menuRef.current;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    currentMenu?.addEventListener("focusout", handleFocusOut);
    currentMenu?.addEventListener("keydown", handleEscape);

    return () => {
      currentMenu?.removeEventListener("focusout", handleFocusOut);
      currentMenu?.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="dropdown ms-auto" ref={menuRef}>
      <button
        ref={triggerRef}
        className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2 wm-header-action"
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <UserAvatar
          image={vendorAvatarImage || avatarImage}
          name={displayName}
          size={32}
        />
        <span className="text-truncate" style={{ maxWidth: 160 }}>
          {displayName}
        </span>
      </button>
      <ul
        id={menuId}
        className={`dropdown-menu dropdown-menu-end${open ? " show" : ""}`}
      >
        <li>
          <Link className="dropdown-item" href={profileHref}>
            {t("auth.profile")}
          </Link>
        </li>
        <li>
          <Link
            className="dropdown-item"
            href={isVendor ? "/vendor/notifications" : "/account/notifications"}
          >
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
          <HeaderSignOutButton
            className="dropdown-item"
            onSignedOut={() => setOpen(false)}
          />
        </li>
      </ul>
    </div>
  );
}
