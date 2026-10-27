"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/contexts/LanguageContext";
import { isHeaderLinkCurrent } from "@/lib/header-navigation";

const tabs = [
  { href: "/vendor", key: "overview" as const },
  { href: "/vendor/inbox", key: "inbox" as const },
  { href: "/vendor/profile", key: "profile" as const },
  { href: "/vendor/location", key: "location" as const },
  { href: "/vendor/categories", key: "categories" as const },
  { href: "/vendor/publish", key: "publish" as const },
];

export default function VendorDashboardHeader() {
  const t = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const activeHref = tabs.find(tab => tab.href !== '/vendor' && isHeaderLinkCurrent(pathname, tab.href))?.href ?? '/vendor';

  return (
    <>
      <p className="wm-shell-title mb-3">{t("vendorDashboard.heading")}</p>
      <nav className="wm-workspace-nav" aria-label={t("vendorDashboard.heading")}>
      <div className="wm-workspace-nav__mobile">
        <label className="visually-hidden" htmlFor="vendor-workspace-section">{t("vendorDashboard.heading")}</label>
        <select id="vendor-workspace-section" className="form-select" value={activeHref} onChange={event => router.push(event.target.value)}>
          {tabs.map(tab => <option key={tab.href} value={tab.href}>{t(`vendorDashboard.tabs.${tab.key}`)}</option>)}
        </select>
      </div>
      <ul className="nav nav-tabs wm-vendor-workspace-nav wm-workspace-nav__desktop">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab.key}>
            <Link className={`nav-link ${activeHref === tab.href ? "active" : ""}`} aria-current={activeHref === tab.href ? "page" : undefined} href={tab.href}>
              {t(`vendorDashboard.tabs.${tab.key}`)}
            </Link>
          </li>
        ))}
      </ul>
      </nav>
    </>
  );
}
