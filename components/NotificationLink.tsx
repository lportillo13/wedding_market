"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import NotificationOpenLink from "@/components/NotificationOpenLink";
import { getLanguageLocale } from "@/lib/i18n";
import {
  parseQuoteAnsweredNotificationData,
  parseThreadReplyNotificationData,
  parseVendorNewRequestNotificationData,
  parseVendorQuoteAcceptedNotificationData,
  type NotificationType,
} from "@/shared/notifications/events";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import HeaderIcon from './HeaderIcon';

type NotificationLinkProps = {
  userId: string;
  href: string;
  types: NotificationType[];
  variant?: 'button' | 'menu';
  onUnreadCountChange?: (count: number) => void;
};

type NotificationListItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: unknown;
  read_at: string | null;
  created_at: string;
};

function buildThreadKey(rfqId: string, vendorId: string) {
  return `${rfqId}__${vendorId}`;
}

function trimLine(text: string | null | undefined, maxLength = 88) {
  if (!text) return null;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function formatNotificationTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getNotificationHref(notification: NotificationListItem, fallbackHref: string) {
  const quoteData = parseQuoteAnsweredNotificationData(notification.data);
  const requestData = parseVendorNewRequestNotificationData(notification.data);
  const acceptedData = parseVendorQuoteAcceptedNotificationData(notification.data);
  const replyData = parseThreadReplyNotificationData(notification.data);

  if (notification.type === "quote_answered" && quoteData) {
    return `/account/inbox/${encodeURIComponent(`${quoteData.rfqId}__${quoteData.vendorId}`)}`;
  }

  if (notification.type === "vendor_new_request" && requestData) {
    return `/vendor/inbox/${encodeURIComponent(buildThreadKey(requestData.rfqId, requestData.vendorId))}`;
  }

  if (notification.type === "vendor_quote_accepted" && acceptedData) {
    return `/vendor/inbox/${encodeURIComponent(buildThreadKey(acceptedData.rfqId, acceptedData.vendorId))}`;
  }

  if (notification.type === "thread_reply" && replyData) {
    const threadKey = buildThreadKey(replyData.rfqId, replyData.vendorId);
    return fallbackHref.startsWith("/vendor")
      ? `/vendor/inbox/${encodeURIComponent(threadKey)}`
      : `/account/inbox/${encodeURIComponent(threadKey)}`;
  }

  return fallbackHref;
}

function getNotificationPreview(notification: NotificationListItem) {
  const replyData = parseThreadReplyNotificationData(notification.data);
  return trimLine(replyData?.messagePreview || notification.body) || notification.body || notification.title;
}

export default function NotificationLink({ userId, href, types, variant = 'button', onUnreadCountChange }: NotificationLinkProps) {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { dictionary, language } = useLanguage();
  const locale = getLanguageLocale(language);
  const typeKey = [...types].sort().join("|");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const labels = dictionary.nav;

  useEffect(() => {
    let active = true;
    let inFlight = false;
    let connected = false;
    let lastLoad = 0;
    let pendingTimer: ReturnType<typeof setTimeout> | undefined;
    const selectedTypes = typeKey.split("|") as NotificationType[];
    const loadNotifications = async () => {
      if (!active || document.visibilityState !== "visible" || inFlight) return;
      if (Date.now() - lastLoad < 5000) {
        if (!pendingTimer) pendingTimer = setTimeout(() => { pendingTimer = undefined; void loadNotifications(); }, 5000);
        return;
      }
      inFlight = true;
      lastLoad = Date.now();

      const [{ count: unreadCount, error: countError }, { data, error: listError }] = await Promise.all([
        supabaseBrowser
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("recipient_id", userId)
          .in("type", selectedTypes)
          .is("deleted_at", null)
          .is("read_at", null),
        variant === 'menu' ? Promise.resolve({data: [], error: null}) : supabaseBrowser
          .from("notifications")
          .select("id, type, title, body, data, read_at, created_at")
          .eq("recipient_id", userId)
          .in("type", selectedTypes)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      inFlight = false;
      if (!active) return;

      if (countError || listError) {
        setIsLoading(false);
        return;
      }

      setCount(unreadCount ?? 0);
      onUnreadCountChange?.(unreadCount ?? 0);
      setItems((data ?? []) as NotificationListItem[]);
      setIsLoading(false);
    };

    void loadNotifications();

    const channel = supabaseBrowser
      .channel(`wm-notifications-${userId}-${typeKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        () => {
          void loadNotifications();
        }
      )
      .subscribe((status) => {
        connected = status === "SUBSCRIBED";
        if (connected) void loadNotifications();
      });

    const intervalId = window.setInterval(() => {
      if (!connected || Date.now() - lastLoad >= 300000) void loadNotifications();
    }, 60000);

    const handleFocus = () => {
      void loadNotifications();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadNotifications();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      void supabaseBrowser.removeChannel(channel);
      window.clearInterval(intervalId);
      if (pendingTimer) clearTimeout(pendingTimer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [typeKey, userId, variant, onUnreadCountChange]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationOpened = (notificationId: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === notificationId && !item.read_at
          ? { ...item, read_at: new Date().toISOString() }
          : item
      )
    );
    setCount((current) => Math.max(0, current - 1));
    setIsOpen(false);
  };

  const badgeLabel = count > 99 ? "99+" : String(count);

  if (variant === 'menu') return <Link href={href} className="dropdown-item wm-account-menu__item">
    <HeaderIcon name="bell" /><span>{labels.notifications}</span>
    {count > 0 && <span className="wm-account-menu__count">{badgeLabel}<span className="visually-hidden"> {labels.notificationsUnreadLabel}</span></span>}
  </Link>;

  return (
    <div ref={dropdownRef} className="wm-notification-dropdown">
      <button
        type="button"
        className={`btn btn-outline-secondary btn-sm position-relative d-inline-flex align-items-center justify-content-center wm-header-action wm-header-action--icon ${isOpen ? "wm-notification-dropdown__trigger--open" : ""}`}
        aria-label={labels.notifications}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title={labels.notifications}
        style={{ padding: 0 }}
        onClick={() => setIsOpen((current) => !current)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        <span className="visually-hidden">{labels.notifications}</span>
        {count > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ minWidth: 20, height: 20, fontSize: 11, lineHeight: "20px", padding: "0 6px" }}
          >
            {badgeLabel}
            <span className="visually-hidden">{labels.notificationsUnreadLabel}</span>
          </span>
        )}
      </button>

      {isOpen ? (
        <div className="wm-notification-dropdown__panel" role="dialog" aria-label={labels.notifications}>
          <div className="wm-notification-dropdown__header">
            <div>
              <p className="wm-notification-dropdown__eyebrow mb-1">{labels.notifications}</p>
              <h2 className="wm-notification-dropdown__title mb-0">{labels.notifications}</h2>
            </div>
            {count > 0 ? <span className="wm-notification-dropdown__count">{badgeLabel}</span> : null}
          </div>

          <div className="wm-notification-dropdown__list">
            {isLoading ? (
              <div className="wm-notification-dropdown__state">{labels.notificationsLoading}</div>
            ) : items.length ? (
              items.map((notification) => {
                const actionHref = getNotificationHref(notification, href);
                const preview = getNotificationPreview(notification);

                return (
                  <NotificationOpenLink
                    key={notification.id}
                    href={actionHref}
                    notificationId={notification.id}
                    unread={!notification.read_at}
                    className={`wm-notification-dropdown__item ${notification.read_at ? "" : "wm-notification-dropdown__item--unread"}`}
                    onOpened={handleNotificationOpened}
                  >
                    <div className="wm-notification-dropdown__item-topline">
                      <span className="wm-notification-dropdown__item-title">{notification.title}</span>
                      {!notification.read_at ? <span className="wm-notification-dropdown__item-dot" aria-hidden="true" /> : null}
                    </div>
                    <p className="wm-notification-dropdown__item-body mb-0">{preview}</p>
                    <span className="wm-notification-dropdown__item-time">
                      {formatNotificationTime(notification.created_at, locale)}
                    </span>
                  </NotificationOpenLink>
                );
              })
            ) : (
              <div className="wm-notification-dropdown__state">{labels.notificationsEmpty}</div>
            )}
          </div>

          <div className="wm-notification-dropdown__footer">
            <Link href={href} className="wm-notification-dropdown__footer-link" onClick={() => setIsOpen(false)}>
              {labels.notificationsViewAll}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
