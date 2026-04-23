"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AccountLayoutHeader() {
  const { dictionary } = useLanguage();
  const labels = dictionary.account.layout;
  const pathname = usePathname();

  const tabs = [
    { href: "/account/profile", label: labels.tabs.profile },
    { href: "/account/inbox", label: labels.tabs.inbox ?? "Inbox" },
    { href: "/account/reviews", label: labels.tabs.reviews },
  ];

  return (
    <header className="wm-account-header">
      <div className="container">
        <p className="wm-account-header__eyebrow">{labels.heading}</p>
        <h1 className="wm-account-header__title">My Account</h1>
        <nav aria-label="Account sections">
          <ul className="wm-account-tabs">
            {tabs.map((tab) => (
              <li
                key={tab.href}
                className={`wm-account-tab${pathname === tab.href ? " is-active" : ""}`}
              >
                <Link href={tab.href}>{tab.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
