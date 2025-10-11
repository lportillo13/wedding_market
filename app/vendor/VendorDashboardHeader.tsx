"use client";

import Link from "next/link";
import { useTranslation } from "@/contexts/LanguageContext";

const tabs = [
  { href: "/vendor", key: "overview" as const },
  { href: "/vendor/rfqs", key: "rfqs" as const },
  { href: "/vendor/quotes", key: "quotes" as const },
  { href: "/vendor/profile", key: "profile" as const },
  { href: "/vendor/location", key: "location" as const },
  { href: "/vendor/categories", key: "categories" as const },
  { href: "/vendor/publish", key: "publish" as const },
];

export default function VendorDashboardHeader() {
  const t = useTranslation();

  return (
    <>
      <h1 className="mb-3">{t("vendorDashboard.heading")}</h1>
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
