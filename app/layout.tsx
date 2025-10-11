import "../styles/bootstrap-theme.scss";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBarContainer from "@/components/NavBarContainer"; // ⬅️ add this
import { LanguageProvider } from "@/contexts/LanguageContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wedding Market",
  description: "Find and compare wedding vendors",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-bs-theme="light">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageProvider>
          <NavBarContainer /> {/* ⬅️ show header everywhere */}
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
