"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WorkspaceFooter() {
  const { dictionary, language } = useLanguage();
  return (
    <footer className="wm-workspace-footer">
      <div className="container">
        <Link className="wm-workspace-footer__brand" href="/">
          Wedding Market
        </Link>
        <nav
          aria-label={
            language === "es" ? "Información legal" : "Legal information"
          }
        >
          <Link href="/terms">{dictionary.footer.legal.terms}</Link>
          <Link href="/privacy">{dictionary.footer.legal.privacy}</Link>
          <Link href="/account-deletion">
            {language === "es" ? "Eliminar cuenta" : "Account deletion"}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
