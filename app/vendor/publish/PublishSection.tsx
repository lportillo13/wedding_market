"use client";

import { useTranslation } from "@/contexts/LanguageContext";
import PublishForm from "./publishForm";

type Initial = { is_published: boolean; slug?: string };

export default function PublishSection({ initial }: { initial: Initial }) {
  const t = useTranslation();

  return (
    <>
      <h2 className="mb-3">{t("vendorDashboard.publish.heading")}</h2>
      <p className="text-muted">{t("vendorDashboard.publish.description")}</p>
      <PublishForm initial={initial} />
    </>
  );
}
