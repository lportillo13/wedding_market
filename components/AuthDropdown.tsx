"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { HeaderUser } from "@/lib/header-account";
import Link from "next/link";
import HeaderSignOutButton from "./HeaderSignOutButton";
import { parseCloudinaryImage } from "@/lib/images";
import UserAvatar from "@/components/UserAvatar";
import { useTranslation } from "@/contexts/LanguageContext";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { CloudinaryImage } from "@/types/images";
import type {ReactNode} from 'react';
import HeaderIcon from './HeaderIcon';
import NotificationLink from './NotificationLink';
import {ACCOUNT_NOTIFICATION_TYPES, VENDOR_NOTIFICATION_TYPES} from '@/shared/notifications/events';

type AuthDropdownProps = {
  user: HeaderUser;
  isVendor: boolean;
  shortlistCount?: number;
  notificationCount?: number;
  onNotificationCountChange?: (count: number) => void;
};

export default function AuthDropdown({ user, isVendor, shortlistCount = 0, notificationCount = 0, onNotificationCountChange }: AuthDropdownProps) {
  const [open, setOpen] = useState(false);
  const [vendorLogoUrl, setVendorLogoUrl] = useState<string | null>(null);
  const [vendorBusinessName, setVendorBusinessName] = useState<string | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useId();
  const pathname = usePathname();
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
    <div className="dropdown ms-auto wm-account-menu" ref={menuRef}>
      <button
        ref={triggerRef}
        className="btn btn-outline-secondary dropdown-toggle wm-header-action wm-account-menu__trigger"
        type="button"
        aria-label={`${t('auth.account')}: ${displayName}${notificationCount > 0 ? `. ${notificationCount} ${t('nav.notificationsUnreadLabel')}` : ''}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <UserAvatar
          image={vendorAvatarImage || avatarImage}
          name={displayName}
          size={32}
        />
        {notificationCount > 0 && <span className="wm-account-activity-dot" aria-hidden="true" />}
      </button>
      <ul
        id={menuId}
        className={`dropdown-menu dropdown-menu-end${open ? " show" : ""}`}
      >
        <AccountMenuContent displayName={displayName} avatar={<UserAvatar image={vendorAvatarImage || avatarImage} name={displayName} size={32} />}
          isVendor={isVendor} shortlistCount={shortlistCount}
          notifications={<NotificationLink userId={user.id} href={isVendor ? '/vendor/notifications' : '/account/notifications'} types={isVendor ? [...VENDOR_NOTIFICATION_TYPES] : [...ACCOUNT_NOTIFICATION_TYPES]} variant="menu" onUnreadCountChange={onNotificationCountChange} />}
          onSignedOut={() => setOpen(false)} />
      </ul>
    </div>
  );
}

export function AccountMenuContent({displayName, avatar, isVendor, shortlistCount = 0, notifications, onSignedOut}: {
  displayName: string; avatar: ReactNode; isVendor: boolean; shortlistCount?: number; notifications: ReactNode; onSignedOut?: () => void;
}) {
  const t = useTranslation();
  const link = (href: string, label: string, icon: 'user' | 'heart' | 'grid', count = 0) => <li><Link className="dropdown-item wm-account-menu__item" href={href}>
    <HeaderIcon name={icon} /><span>{label}</span>{count > 0 && <span className="wm-account-menu__count">{count > 99 ? '99+' : count}</span>}
  </Link></li>;
  return <>
    <li className="wm-account-menu__identity">{avatar}<div><strong>{displayName}</strong><span>{isVendor ? t('header.vendorSpace') : t('auth.account')}</span></div></li>
    {isVendor && link('/vendor', t('footer.vendorLinks.dashboard'), 'grid')}
    {link(isVendor ? '/vendor/profile' : '/account/profile', t('auth.profile'), 'user')}
    {isVendor ? link('/account/profile', t('auth.personalProfile'), 'user') : link('/shortlist', t('nav.shortlist'), 'heart', shortlistCount)}
    <li>{notifications}</li>
    {!isVendor && <li className="wm-account-menu__section"><Link className="dropdown-item wm-account-menu__item" href="/rfq/new"><HeaderIcon name="calendar" /><span>{t('nav.requestQuotes')}</span><HeaderIcon name="arrow" /></Link></li>}
    <li className="wm-account-menu__section"><HeaderSignOutButton className="dropdown-item wm-account-menu__item" icon={<HeaderIcon name="logout" />} onSignedOut={onSignedOut} /></li>
  </>;
}
