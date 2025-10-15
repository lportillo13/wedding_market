import Link from "next/link";
import type { VendorBreadcrumb } from "@/types/vendor-profile";

type BreadcrumbsProps = {
  categories: VendorBreadcrumb[];
  location: {
    city: string | null;
    region: string | null;
    country: string | null;
  };
  vendorName: string;
};

export default function Breadcrumbs({ categories, location, vendorName }: BreadcrumbsProps) {
  const homeCrumb = { href: "/", label: "Home" };
  const vendorsCrumb = { href: "/vendors", label: "Vendors" };

  const categoryCrumbs = categories.map((category) => ({
    href: category.slug ? `/vendors/category/${category.slug}` : undefined,
    label: category.label,
  }));

  const regionCrumbs = [location.region, location.city].filter(Boolean) as string[];

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
        {regionCrumbs.map((crumb, index) => (
          <li className="breadcrumb-item text-capitalize" key={`region-${index}`}>
            {crumb}
          </li>
        ))}
        <li className="breadcrumb-item active" aria-current="page">
          {vendorName}
        </li>
      </ol>
    </nav>
  );
}
