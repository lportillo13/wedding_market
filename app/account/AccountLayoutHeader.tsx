"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AccountLayoutHeader() {
  const { dictionary } = useLanguage();
  const labels = dictionary.account.layout;

  const tabs = [
    { href: "/account/profile", label: labels.tabs.profile },
    { href: "/account/rfqs", label: labels.tabs.rfqs },
    { href: "/account/quotes", label: labels.tabs.quotes },
    { href: "/account/reviews", label: labels.tabs.reviews },
  ];

  return (
    <div className="container py-4" style={{ maxWidth: 960 }}>
      <h1 className="mb-3">{labels.heading}</h1>
      <ul className="nav nav-tabs mb-4">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab.href}>
            <Link className="nav-link" href={tab.href}>
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
