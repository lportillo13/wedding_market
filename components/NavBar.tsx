"use client";

import type { ReactNode } from "react";
import type { HeaderUser } from "@/lib/header-account";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getShortlistCount } from "@/lib/shortlist";
import {
  getHeaderAccountLinks,
  isHeaderLinkCurrent,
} from "@/lib/header-navigation";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import HeaderSignOutButton from "./HeaderSignOutButton";
import HeaderIcon from "./HeaderIcon";
import HeaderLanguageSwitch from "./HeaderLanguageSwitch";
import HeaderBotanicalAccent from "./HeaderBotanicalAccent";
import HeaderAccountRetry from "./HeaderAccountRetry";
import VendorsMegaMenu, { type HeaderVendorCategory } from "./VendorsMegaMenu";

type NavBarProps = {
  authMenu?: ReactNode;
  isAuthenticated?: boolean;
  isVendor?: boolean;
  notificationLink?: ReactNode;
  vendorCategories: HeaderVendorCategory[];
  user?: HeaderUser | null;
  accountUnavailable?: boolean;
};
export default function NavBar({
  authMenu,
  isAuthenticated = false,
  isVendor = false,
  notificationLink,
  vendorCategories,
  user,
  accountUnavailable = false,
}: NavBarProps) {
  const pathname = usePathname() ?? "/";
  const { language, dictionary } = useLanguage();
  const t = useTranslation();
  const labels = dictionary.header;
  const [count, setCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [allCategories, setAllCategories] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const focusSearch = useRef(false);
  const menuId = useId();
  const close = useCallback(() => setMenuOpen(false), []);
  const name =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : dictionary.auth.account;
  const accountLinks = getHeaderAccountLinks(isVendor);

  useEffect(() => {
    const sync = () => setCount(getShortlistCount());
    const frame = requestAnimationFrame(sync);
    window.addEventListener("wm-shortlist-changed", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wm-shortlist-changed", sync);
    };
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(close);
    return () => cancelAnimationFrame(frame);
  }, [pathname, close]);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1200px)");
    const onResize = () => {
      if (query.matches) close();
    };
    query.addEventListener("change", onResize);
    return () => query.removeEventListener("change", onResize);
  }, [close]);
  useEffect(() => {
    const element = dialog.current;
    if (!menuOpen || !element) {
      element?.close();
      return;
    }
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onBackdrop = (event: MouseEvent) => {
      if (event.target !== element) return;
      const rect = element.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        close();
    };
    element.addEventListener("click", onBackdrop);
    element.showModal();
    (focusSearch.current ? searchInput.current : closeButton.current)?.focus({
      preventScroll: true,
    });
    return () => {
      element.removeEventListener("click", onBackdrop);
      element.close();
      document.body.style.overflow = overflow;
      returnFocus.current?.focus({ preventScroll: true });
    };
  }, [menuOpen, close]);
  function open(trigger: HTMLButtonElement, search = false) {
    returnFocus.current = trigger;
    focusSearch.current = search;
    setAllCategories(false);
    setMenuOpen(true);
  }
  const brand = (
    <>
      <span className="wm-site-header__wordmark">{dictionary.nav.brand}</span>
      <span className="wm-site-header__tagline">{labels.tagline}</span>
    </>
  );
  return (
    <header
      className={`wm-site-header${pathname === "/" ? " wm-site-header--home" : ""}`}
    >
      <div className="container wm-site-header__inner">
        <Link href="/" className="wm-site-header__brand">
          {brand}
        </Link>
        <nav
          className="wm-site-header__desktop-nav"
          aria-label={labels.primaryNavigation}
        >
          <ul>
            <VendorsMegaMenu categories={vendorCategories} />
            <li>
              <Link
                href="/about"
                aria-current={
                  isHeaderLinkCurrent(pathname, "/about") ? "page" : undefined
                }
              >
                {dictionary.nav.about}
              </Link>
            </li>
            <li>
              <Link
                href="/blog"
                aria-current={
                  isHeaderLinkCurrent(pathname, "/blog") ? "page" : undefined
                }
              >
                {dictionary.nav.blog}
              </Link>
            </li>
          </ul>
        </nav>
        <div className="wm-site-header__desktop-actions">
          <HeaderLanguageSwitch compact />
          {!accountUnavailable && !isVendor ? (
            <Link href="/rfq/new" className="wm-site-header__cta">
              {dictionary.nav.requestQuotes}
              <HeaderIcon name="arrow" width="16" height="16" />
            </Link>
          ) : null}
          {isAuthenticated ? (
            <Link
              href={isVendor ? "/vendor/inbox" : "/account/inbox"}
              className="wm-site-header__icon"
              aria-label={
                isVendor
                  ? dictionary.auth.vendorRfqs
                  : dictionary.nav.myRequests
              }
              title={
                isVendor
                  ? dictionary.auth.vendorRfqs
                  : dictionary.nav.myRequests
              }
            >
              <HeaderIcon name="inbox" />
            </Link>
          ) : null}
          {notificationLink}
          {isAuthenticated && !isVendor ? (
            <Link
              href="/shortlist"
              className="wm-site-header__icon"
              aria-label={`${dictionary.nav.shortlist}${count ? ` (${count})` : ""}`}
            >
              <HeaderIcon name="heart" />
              {count > 0 ? (
                <span className="wm-site-header__count">
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </Link>
          ) : null}
          <div className="wm-site-header__auth">
            {authMenu}
          </div>
        </div>
        <div className="wm-site-header__mobile-actions">
          <button
            type="button"
            className="wm-site-header__icon"
            aria-label={labels.search}
            aria-controls={menuId}
            aria-haspopup="dialog"
            onClick={(event) => open(event.currentTarget, true)}
          >
            <HeaderIcon name="search" />
          </button>
          <button
            type="button"
            className="wm-site-header__menu-button"
            aria-label={labels.openMenu}
            aria-controls={menuId}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={(event) => open(event.currentTarget)}
          >
            <HeaderIcon name="menu" />
            <span>{labels.menu}</span>
          </button>
        </div>
      </div>
      <dialog
        ref={dialog}
        id={menuId}
        className="wm-mobile-navigation"
        aria-label={labels.primaryNavigation}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <div className="wm-mobile-navigation__shell">
          <div className="wm-mobile-navigation__top">
            <HeaderBotanicalAccent />
            <Link href="/" className="wm-site-header__brand" onClick={close}>
              {brand}
            </Link>
            <button
              ref={closeButton}
              type="button"
              className="wm-site-header__icon"
              aria-label={labels.closeMenu}
              onClick={close}
            >
              <HeaderIcon name="close" />
            </button>
          </div>
          <div className="wm-mobile-navigation__body">
            <form
              className="wm-header-search"
              action="/vendors"
              method="get"
              role="search"
            >
              <HeaderIcon name="search" />
              <input
                ref={searchInput}
                type="search"
                name="q"
                autoComplete="off"
                placeholder={labels.searchPlaceholder}
                aria-label={labels.search}
              />
              <button type="submit" aria-label={labels.search}>
                <HeaderIcon name="arrow" />
              </button>
            </form>
            <nav aria-label={labels.explore}>
              <Link
                className="wm-mobile-navigation__primary"
                href="/vendors"
                onClick={close}
                aria-current={
                  pathname.startsWith("/vendors") ? "page" : undefined
                }
              >
                {dictionary.nav.vendors}
                <HeaderIcon name="arrow" />
              </Link>
              <div className="wm-mobile-navigation__section-heading">
                <span>{labels.categories}</span>
                {vendorCategories.length > 6 ? (
                  <button
                    type="button"
                    aria-expanded={allCategories}
                    aria-controls={`${menuId}-categories`}
                    onClick={() => setAllCategories((value) => !value)}
                  >
                    {allCategories
                      ? labels.hideCategories
                      : labels.showCategories}
                    <HeaderIcon name="chevron" width="14" height="14" />
                  </button>
                ) : null}
              </div>
              <div
                className="wm-mobile-navigation__categories"
                id={`${menuId}-categories`}
              >
                {(allCategories
                  ? vendorCategories
                  : vendorCategories.slice(0, 6)
                ).map((category) => (
                  <Link
                    key={category.key}
                    href={`/vendors?category=${encodeURIComponent(category.key)}`}
                    onClick={close}
                  >
                    {category.label[language]}
                    <HeaderIcon name="arrow" width="14" height="14" />
                  </Link>
                ))}
              </div>
              {!isVendor ? (
                <Link
                  className="wm-mobile-navigation__row"
                  href="/shortlist"
                  onClick={close}
                >
                  <HeaderIcon name="heart" />
                  <span>{dictionary.nav.shortlist}</span>
                  {count > 0 ? (
                    <span className="wm-mobile-navigation__badge">
                      {count > 99 ? "99+" : count}
                    </span>
                  ) : null}
                  <HeaderIcon name="arrow" width="16" height="16" />
                </Link>
              ) : null}
              <div className="wm-mobile-navigation__explore">
                <Link
                  href="/about"
                  onClick={close}
                  aria-current={
                    isHeaderLinkCurrent(pathname, "/about") ? "page" : undefined
                  }
                >
                  {dictionary.nav.about}
                </Link>
                <Link
                  href="/blog"
                  onClick={close}
                  aria-current={
                    isHeaderLinkCurrent(pathname, "/blog") ? "page" : undefined
                  }
                >
                  {dictionary.nav.blog}
                </Link>
              </div>
            </nav>
            <div
              className={`wm-mobile-navigation__account${!accountUnavailable && !isAuthenticated ? " wm-mobile-navigation__account--guest" : ""}`}
            >
              {accountUnavailable ? (
                <HeaderAccountRetry />
              ) : isAuthenticated ? (
                <>
                  <Link
                    href={isVendor ? "/vendor" : "/account/profile"}
                    className="wm-mobile-navigation__identity"
                    onClick={close}
                  >
                    <span aria-hidden="true">
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <strong>{name}</strong>
                      <span>
                        {isVendor ? labels.vendorSpace : labels.myWedding}
                      </span>
                    </div>
                    <HeaderIcon name="arrow" />
                  </Link>
                  <nav aria-label={labels.account}>
                    {accountLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="wm-mobile-navigation__row"
                        onClick={close}
                        aria-current={
                          isHeaderLinkCurrent(pathname, link.href)
                            ? "page"
                            : undefined
                        }
                      >
                        <HeaderIcon name={link.icon} />
                        <span>{t(link.label)}</span>
                        <HeaderIcon name="arrow" width="16" height="16" />
                      </Link>
                    ))}
                  </nav>
                  <HeaderSignOutButton
                    className="wm-mobile-navigation__signout"
                    onSignedOut={close}
                  />
                </>
              ) : (
                <>
                  <strong>{labels.guestTitle}</strong>
                  <p>{labels.guestDescription}</p>
                  <div className="wm-mobile-navigation__guest-actions">
                    <Link href="/login" onClick={close}>
                      {dictionary.nav.logIn}
                    </Link>
                    <Link href="/signup" onClick={close}>
                      {labels.signUp}
                      <HeaderIcon name="arrow" width="15" height="15" />
                    </Link>
                  </div>
                </>
              )}
            </div>
            {!accountUnavailable && !isAuthenticated ? (
              <Link
                href="/signup/vendor"
                className="wm-mobile-navigation__vendor-join"
                onClick={close}
              >
                <span>{labels.joinVendors}</span>
                {labels.joinAction}
                <HeaderIcon name="arrow" width="15" height="15" />
              </Link>
            ) : null}
          </div>
          <div className="wm-mobile-navigation__footer">
            <Link
              href={
                accountUnavailable
                  ? "/vendors"
                  : isVendor
                    ? "/vendor/inbox"
                    : "/rfq/new"
              }
              className="wm-site-header__cta"
              onClick={close}
            >
              {accountUnavailable
                ? dictionary.nav.vendors
                : isVendor
                  ? dictionary.auth.vendorRfqs
                  : dictionary.nav.requestQuotes}
              <HeaderIcon name="arrow" width="18" height="18" />
            </Link>
            <div className="wm-mobile-navigation__language">
              <span>{dictionary.languageSelector.label}</span>
              <HeaderLanguageSwitch />
            </div>
          </div>
        </div>
      </dialog>
    </header>
  );
}
