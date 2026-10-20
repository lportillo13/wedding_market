"use client";

import NavBar from "@/components/NavBar";
import AuthMenu from "@/components/AuthMenu";
import NotificationLink from "@/components/NotificationLink";
import {
  ACCOUNT_NOTIFICATION_TYPES,
  VENDOR_NOTIFICATION_TYPES,
} from "@/lib/notification-types";
import type { HeaderVendorCategory } from "@/components/VendorsMegaMenu";
import type { HeaderAccount } from "@/lib/header-account";

export default function NavBarContainer({
  vendorCategories,
  account,
}: {
  vendorCategories: HeaderVendorCategory[];
  account: HeaderAccount;
}) {
  const user = account.status === "authenticated" ? account.user : null;
  const isVendor = account.status === "authenticated" && account.isVendor;
  return (
    <NavBar
      authMenu={<AuthMenu account={account} />}
      user={user}
      accountUnavailable={account.status === "unavailable"}
      isAuthenticated={!!user}
      isVendor={isVendor}
      notificationLink={
        user ? (
          <NotificationLink
            userId={user.id}
            href={isVendor ? "/vendor/notifications" : "/account/notifications"}
            types={
              isVendor
                ? [...VENDOR_NOTIFICATION_TYPES]
                : [...ACCOUNT_NOTIFICATION_TYPES]
            }
          />
        ) : undefined
      }
      vendorCategories={vendorCategories}
    />
  );
}
