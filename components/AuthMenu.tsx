"use client";

import AuthDropdown from "@/components/AuthDropdown";
import GuestAuthActions from "@/components/GuestAuthActions";
import HeaderAccountRetry from "@/components/HeaderAccountRetry";
import type { HeaderAccount } from "@/lib/header-account";

export default function AuthMenu({ account }: { account: HeaderAccount }) {
  if (account.status === "unavailable") return <HeaderAccountRetry compact />;
  if (account.status === "guest") return <GuestAuthActions />;
  return <AuthDropdown user={account.user} isVendor={account.isVendor} />;
}
