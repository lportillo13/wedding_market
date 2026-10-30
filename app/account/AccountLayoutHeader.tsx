"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { isHeaderLinkCurrent } from "@/lib/header-navigation";

export default function AccountLayoutHeader({clientWorkspace = true}: {clientWorkspace?: boolean}) {
  const { dictionary } = useLanguage();
  const labels = dictionary.account.layout;
  const pathname = usePathname();
  return <AccountHeaderContent pathname={pathname} labels={labels} clientWorkspace={clientWorkspace} />;
}

export function AccountHeaderContent({
  pathname,
  labels,
  clientWorkspace = true,
}: {
  pathname: string;
  clientWorkspace?: boolean;
  labels: {
    heading: string;
    navigation: string;
    tabs: { profile: string; inbox: string; reviews: string };
  };
}) {
  const tabs = [
    { href: "/account/profile", label: labels.tabs.profile },
    ...(clientWorkspace ? [
      { href: "/account/inbox", label: labels.tabs.inbox ?? "Inbox" },
      { href: "/account/reviews", label: labels.tabs.reviews },
    ] : []),
  ];

  return (
    <header className="wm-account-header">
      <div className="container">
        <p className="wm-account-header__eyebrow">{labels.heading}</p>
        <nav aria-label={labels.navigation}>
          <ul className="wm-account-tabs">
            {tabs.map((tab) => (
              <li
                key={tab.href}
                className={`wm-account-tab${isHeaderLinkCurrent(pathname, tab.href) ? " is-active" : ""}`}
              >
                <Link
                  href={tab.href}
                  aria-current={
                    isHeaderLinkCurrent(pathname, tab.href) ? "page" : undefined
                  }
                >
                  {tab.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
