"use client";

import Link from "next/link";
import { useTranslation } from "@/contexts/LanguageContext";

export default function GuestAuthActions() {
  const t = useTranslation();

  return (
    <div className="d-flex align-items-center gap-2 ms-auto">
      <Link href="/login" className="btn btn-outline-secondary">
        {t("nav.logIn")}
      </Link>
    </div>
  );
}
