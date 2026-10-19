import type { TranslationKey } from "./i18n";

export type HeaderAccountLink = {
  href: string;
  label: TranslationKey;
  icon: "user" | "inbox" | "bell" | "grid";
};
export function getHeaderAccountLinks(isVendor: boolean): HeaderAccountLink[] {
  return isVendor
    ? [
        {
          href: "/vendor",
          label: "footer.vendorLinks.dashboard",
          icon: "grid",
        },
        { href: "/vendor/inbox", label: "auth.vendorRfqs", icon: "inbox" },
        { href: "/vendor/profile", label: "auth.profile", icon: "user" },
        {
          href: "/vendor/notifications",
          label: "auth.notifications",
          icon: "bell",
        },
      ]
    : [
        { href: "/account/inbox", label: "nav.myRequests", icon: "inbox" },
        { href: "/account/profile", label: "auth.profile", icon: "user" },
        {
          href: "/account/notifications",
          label: "auth.notifications",
          icon: "bell",
        },
      ];
}
export function isHeaderLinkCurrent(pathname: string, href: string) {
  return (
    pathname === href || (href !== "/vendor" && pathname.startsWith(`${href}/`))
  );
}
