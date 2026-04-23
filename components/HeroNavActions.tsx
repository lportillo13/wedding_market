"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AuthDropdown from "@/components/AuthDropdown";
import LanguageDropdown from "@/components/LanguageDropdown";
import NotificationLink from "@/components/NotificationLink";
import { ACCOUNT_NOTIFICATION_TYPES, VENDOR_NOTIFICATION_TYPES } from "@/lib/notifications";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useTranslation } from "@/contexts/LanguageContext";
import { getShortlistCount } from "@/lib/shortlist";

type AuthState = {
  user: User | null;
  isVendor: boolean;
  ready: boolean;
};

export default function HeroNavActions() {
  const t = useTranslation();
  const [state, setState] = useState<AuthState>({ user: null, isVendor: false, ready: false });
  const [shortlistCount, setShortlistCount] = useState(() =>
    typeof window !== "undefined" ? getShortlistCount() : 0
  );

  // Track shortlist count changes
  useEffect(() => {
    const sync = () => setShortlistCount(getShortlistCount());
    window.addEventListener("wm-shortlist-changed", sync);
    return () => window.removeEventListener("wm-shortlist-changed", sync);
  }, []);

  // Auth state — identical pattern to NavBarContainer
  useEffect(() => {
    let active = true;

    const syncVendorFlag = async (user: User) => {
      try {
        const { data: isVendor } = await supabaseBrowser.rpc("is_vendor", { _uid: user.id });
        if (!active) return;
        setState((current) =>
          current.user?.id === user.id
            ? { ...current, isVendor: !!isVendor, ready: true }
            : current
        );
      } catch {
        if (!active) return;
        setState((current) =>
          current.user?.id === user.id
            ? { ...current, isVendor: false, ready: true }
            : current
        );
      }
    };

    const syncUser = (nextUser: User | null) => {
      if (!nextUser) {
        if (active) setState({ user: null, isVendor: false, ready: true });
        return;
      }
      if (active) {
        setState((current) => ({
          user: nextUser,
          isVendor: current.user?.id === nextUser.id ? current.isVendor : false,
          ready: current.user?.id === nextUser.id,
        }));
      }
      void syncVendorFlag(nextUser);
    };

    void supabaseBrowser.auth
      .getSession()
      .then(({ data }) => {
        if (active) syncUser(data.session?.user ?? null);
      })
      .catch(() => {
        if (active) syncUser(null);
      });

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Still resolving auth — render nothing so there's no flash
  if (!state.ready) {
    return <div className="wm-founders-hero__actions" />;
  }

  // ── Authenticated ──────────────────────────────────────────────────────────
  if (state.user) {
    return (
      <div className="wm-founders-hero__actions wm-navbar-actions d-flex align-items-center gap-2">
        {/* Request quotes — clients only */}
        {!state.isVendor && (
          <Link href="/rfq/new" className="btn btn-primary btn-sm wm-header-action">
            {t("nav.requestQuotes")}
          </Link>
        )}

        {/* Notification bell */}
        <NotificationLink
          userId={state.user.id}
          href={state.isVendor ? "/vendor/notifications" : "/account/notifications"}
          types={state.isVendor ? [...VENDOR_NOTIFICATION_TYPES] : [...ACCOUNT_NOTIFICATION_TYPES]}
        />

        {/* Shortlist heart — clients only */}
        {!state.isVendor && (
          <Link
            href="/shortlist"
            className="btn btn-outline-secondary btn-sm position-relative d-inline-flex align-items-center justify-content-center wm-header-action wm-header-action--icon"
            aria-label={t("nav.shortlist")}
            title={t("nav.shortlist")}
            style={{ padding: 0 }}
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
              <path d="m12 21-1.4-1.3C5.4 14.9 2 11.8 2 8a5 5 0 0 1 9.1-2.9L12 6.3l.9-1.2A5 5 0 0 1 22 8c0 3.8-3.4 6.9-8.6 11.7z" />
            </svg>
            <span className="visually-hidden">{t("nav.shortlist")}</span>
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {shortlistCount}
              <span className="visually-hidden">{t("nav.shortlistCountLabel")}</span>
            </span>
          </Link>
        )}

        {/* User dropdown */}
        <AuthDropdown user={state.user} isVendor={state.isVendor} />
      </div>
    );
  }

  // ── Guest ──────────────────────────────────────────────────────────────────
  return (
    <div className="wm-founders-hero__actions d-flex align-items-center gap-2">
      <LanguageDropdown />
      <Link href="/login" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">
        <span className="wm-founders-hero__login-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <circle cx="12" cy="8" r="3.25" />
            <path d="M5.5 19c1.35-3.1 3.5-4.65 6.5-4.65S17.15 15.9 18.5 19" />
          </svg>
        </span>
        <span>{t("nav.logIn")}</span>
      </Link>
      <Link href="/signup" className="btn btn-primary btn-sm">
        {t("nav.signUp")}
      </Link>
    </div>
  );
}
