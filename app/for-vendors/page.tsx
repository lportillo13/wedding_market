import type { Metadata } from "next";
import { getRequestLanguage } from "@/lib/i18n/server";
import VendorLanding from "@/features/vendor-marketing/VendorLanding";

export async function generateMetadata(): Promise<Metadata> {
  const es = (await getRequestLanguage()) === "es";
  return {
    title: es ? "Para profesionales de bodas | Wedding Market" : "For wedding professionals | Wedding Market",
    description: es
      ? "Presenta tu negocio, recibe solicitudes y organiza tus conversaciones y cotizaciones para bodas en Costa Rica."
      : "Showcase your business, receive wedding inquiries and keep conversations and proposals together. Join Wedding Market for weddings in Costa Rica.",
    alternates: { canonical: "https://thewedmarket.com/for-vendors" },
  };
}

export default function ForVendorsPage() {
  return <VendorLanding />;
}
