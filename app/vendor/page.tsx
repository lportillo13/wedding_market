"use client";

import { useTranslation } from "@/contexts/LanguageContext";

export default function VendorHome() {
  const t = useTranslation();

  return <div className="alert alert-info">{t("vendorDashboard.overview.welcome")}</div>;
}
