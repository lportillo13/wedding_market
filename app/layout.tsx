import CommunityConsent from "@/components/safety/CommunityConsent";
import { COMMUNITY_TERMS_VERSION } from "@/shared/safety/copy";
import "../styles/bootstrap-theme.scss";
import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/vendor-public-profile.scss";
import "../styles/account-inbox.scss";
import "../styles/editorial-ui.scss";
import "../styles/founders-inspired.scss";
import "../styles/editorial-fonts.scss";
import "../styles/footer-and-consent.scss";
import NavBarContainer from "@/components/NavBarContainer";
import AuthStateSync from "@/components/AuthStateSync";
import PwaServiceWorkerRegistration from "@/components/PwaServiceWorkerRegistration";
import ScrollReveal from "@/components/ScrollReveal";
import SiteFooter from "@/components/SiteFooter";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_LANGUAGE, dictionaries, isSupportedLanguage, type SupportedLanguage } from "@/lib/i18n";
import { getRequestLanguage } from "@/lib/i18n/server";
import type { HeaderVendorCategory } from "@/components/VendorsMegaMenu";
import { loadHeaderAccount, type HeaderAccount } from "@/lib/header-account";

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
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4B352C",
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
  let needsCommunityConsent = false;
  let initialLanguage: SupportedLanguage | undefined;
  let vendorCategories = getFallbackVendorCategories();
  let account: HeaderAccount = { status: "unavailable" };

  try {
    const supabase = await createSupabaseServerClient();
    account = await loadHeaderAccount({
      getUser: () => supabase.auth.getUser(),
      isVendor: (userId, signal) => supabase.rpc("is_vendor", { _uid: userId }).abortSignal(signal),
    });
    const user = account.status === "authenticated" ? account.user : null;

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("language, community_terms_version").eq("id", user.id).abortSignal(AbortSignal.timeout(2000)).maybeSingle();

      needsCommunityConsent = profile?.community_terms_version !== COMMUNITY_TERMS_VERSION;
      if (profile && isSupportedLanguage(profile.language)) {
        initialLanguage = profile.language;
      }
    }

    const { data: categoryRows, error: categoryError } = await supabase
      .from("categories")
      .select("key, label")
      .order("id", { ascending: true })
      .abortSignal(AbortSignal.timeout(4000));

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
        <link rel="preload" href="/fonts/editorial/Acumin-Pro-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/editorial/GT-Super-Display-Light.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/editorial/Lucia-BT.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthStateSync />
        <PwaServiceWorkerRegistration />
        <ScrollReveal />
        <LanguageProvider initialLanguage={resolvedLanguage}>
          <div className="wm-site-shell">
            <NavBarContainer vendorCategories={vendorCategories} account={account} />
            <div className="wm-site-shell__content">{children}</div>
            <SiteFooter vendorCategories={vendorCategories} />
            {needsCommunityConsent ? <CommunityConsent /> : null}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
