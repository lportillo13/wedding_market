"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VendorBreadcrumb } from "@/types/vendor-profile";

type BreadcrumbsProps = {
  categories: VendorBreadcrumb[];
  vendorName: string;
};

export default function Breadcrumbs({ categories, vendorName }: BreadcrumbsProps) {
  const { dictionary, language } = useLanguage();
  const homeCrumb = { href: "/", label: language === "es" ? "Inicio" : "Home" };
  const vendorsCrumb = { href: "/vendors", label: dictionary.nav.vendors };

  const categoryLabelsByKey = useMemo(
    () =>
      new Map(
        dictionary.home.categories.items.map((item) => [item.slug.toLowerCase(), item.label]),
      ),
    [dictionary.home.categories.items],
  );

  const categoryCrumbs = categories.map((category) => {
    const key = category.key?.trim().toLowerCase() ?? null;
    const label = key ? categoryLabelsByKey.get(key) ?? category.label : category.label;

    return {
      href: key ? `/vendors?category=${encodeURIComponent(key)}` : undefined,
      label,
    };
  });

  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb small mb-0">
        <li className="breadcrumb-item">
          <Link href={homeCrumb.href}>{homeCrumb.label}</Link>
        </li>
        <li className="breadcrumb-item">
          <Link href={vendorsCrumb.href}>{vendorsCrumb.label}</Link>
        </li>
        {categoryCrumbs.map((crumb, index) => (
          <li className="breadcrumb-item" key={`category-${index}`}>
            {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
          </li>
        ))}
        <li className="breadcrumb-item active" aria-current="page">
          {vendorName}
        </li>
      </ol>
    </nav>
  );
}
