"use client";

import ClientOnly from "@/components/ClientOnly";
import { useTranslation } from "@/contexts/LanguageContext";
import LocationForm from "./locationForm";

type Initial = {
  address: string;
  city: string;
  state: string;
  country: string;
  lat: number | null;
  lng: number | null;
  service_radius_km: number;
};

export default function LocationSection({ initial }: { initial: Initial }) {
  const t = useTranslation();

  return (
    <>
      <h2 className="mb-3">{t("vendorDashboard.location.heading")}</h2>
      <ClientOnly>
        <LocationForm initial={initial} />
      </ClientOnly>
    </>
  );
}
