import "../styles/bootstrap-theme.scss";
import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBarContainer from "@/components/NavBarContainer";
import AuthStateSync from "@/components/AuthStateSync";
import PwaServiceWorkerRegistration from "@/components/PwaServiceWorkerRegistration";
import SiteFooter from "@/components/SiteFooter";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_LANGUAGE, dictionaries, isSupportedLanguage, type SupportedLanguage } from "@/lib/i18n";
import { getRequestLanguage } from "@/lib/i18n/server";
import type { HeaderVendorCategory } from "@/components/VendorsMegaMenu";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  applicationName: "Wedding Market",
  title: "Wedding Market",
  description: "Encuentra y compara proveedores para bodas",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wedding Market",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#b8922a",
};

function getFallbackVendorCategories(): HeaderVendorCategory[] {
  const spanishLabels = new Map(dictionaries.es.home.categories.items.map((category) => [category.slug, category.label]));

  return dictionaries.en.home.categories.items.map((category) => ({
    key: category.slug,
    label: {
      en: category.label,
      es: spanishLabels.get(category.slug) ?? category.label,
    },
  }));
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let initialLanguage: SupportedLanguage | undefined;
  let vendorCategories = getFallbackVendorCategories();

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("language").eq("id", user.id).maybeSingle();

      if (profile && isSupportedLanguage(profile.language)) {
        initialLanguage = profile.language;
      }
    }

    const { data: categoryRows, error: categoryError } = await supabase
      .from("categories")
      .select("key, label")
      .order("id", { ascending: true });

    if (!categoryError) {
      const categoriesFromDatabase = (categoryRows ?? []).flatMap((row) => {
        const rawLabel =
          row && typeof row.label === "object" && row.label !== null
            ? (row.label as { en?: unknown; es?: unknown })
            : null;

        const enLabel = typeof rawLabel?.en === "string" ? rawLabel.en : null;
        const esLabel = typeof rawLabel?.es === "string" ? rawLabel.es : null;

        if (!row?.key || !enLabel || !esLabel) {
          return [];
        }

        return [{ key: row.key, label: { en: enLabel, es: esLabel } }];
      });

      if (categoriesFromDatabase.length > 0) {
        vendorCategories = categoriesFromDatabase;
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Supabase is unavailable for layout data; rendering with guest defaults.", error);
    }
  }

  const resolvedLanguage = await getRequestLanguage(initialLanguage ?? DEFAULT_LANGUAGE);

  return (
    <html lang={resolvedLanguage} data-bs-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthStateSync />
        <PwaServiceWorkerRegistration />
        <LanguageProvider initialLanguage={resolvedLanguage}>
          <div className="wm-site-shell">
            <NavBarContainer vendorCategories={vendorCategories} />
            <div className="wm-site-shell__content">{children}</div>
            <SiteFooter vendorCategories={vendorCategories} />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
