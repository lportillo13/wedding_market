"use client";

import Link from "next/link";
import { useTranslation } from "@/contexts/LanguageContext";

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

  return (
    <>
      <p className="wm-shell-title mb-3">{t("vendorDashboard.heading")}</p>
      <ul className="nav nav-tabs mb-4">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab.key}>
            <Link className="nav-link" href={tab.href}>
              {t(`vendorDashboard.tabs.${tab.key}`)}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
