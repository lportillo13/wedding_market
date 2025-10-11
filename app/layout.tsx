import "../styles/bootstrap-theme.scss";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBarContainer from "@/components/NavBarContainer"; // ⬅️ add this
import { LanguageProvider } from "@/contexts/LanguageContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupportedLanguage, type SupportedLanguage } from "@/lib/i18n";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wedding Market",
  description: "Find and compare wedding vendors",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialLanguage: SupportedLanguage | undefined;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("language")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && isSupportedLanguage(profile.language)) {
      initialLanguage = profile.language;
    }
  }

  const htmlLang = initialLanguage ?? "en";

  return (
    <html lang={htmlLang} data-bs-theme="light">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageProvider key={initialLanguage ?? 'en'} initialLanguage={initialLanguage}>
          <NavBarContainer /> {/* ⬅️ show header everywhere */}
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
