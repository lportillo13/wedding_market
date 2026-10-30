"use client";

import NavBar from "@/components/NavBar";
import AuthMenu from "@/components/AuthMenu";
import {useCallback, useEffect, useState} from 'react';
import {getShortlistCount} from '@/lib/shortlist';
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
  const [shortlistCount, setShortlistCount] = useState(0);
  const [notificationSnapshot, setNotificationSnapshot] = useState({userId: '', count: 0});
  const notificationCount = notificationSnapshot.userId === user?.id ? notificationSnapshot.count : 0;
  const userId = user?.id;
  const onNotificationCountChange = useCallback((count: number) => setNotificationSnapshot({userId: userId ?? '', count}), [userId]);
  useEffect(() => {
    const sync = () => setShortlistCount(getShortlistCount());
    const frame = requestAnimationFrame(sync);
    window.addEventListener('wm-shortlist-changed', sync);
    return () => {cancelAnimationFrame(frame); window.removeEventListener('wm-shortlist-changed', sync);};
  }, []);
  return (
    <NavBar
      authMenu={<AuthMenu account={account} shortlistCount={shortlistCount} notificationCount={notificationCount} onNotificationCountChange={onNotificationCountChange} />}
      user={user}
      accountUnavailable={account.status === "unavailable"}
      isAuthenticated={!!user}
      isVendor={isVendor}
      shortlistCount={shortlistCount}
      notificationCount={notificationCount}
      vendorCategories={vendorCategories}
    />
  );
}
