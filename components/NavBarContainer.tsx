"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import NavBar from "@/components/NavBar";
import AuthDropdown from "@/components/AuthDropdown";
import GuestAuthActions from "@/components/GuestAuthActions";
import NotificationLink from "@/components/NotificationLink";
import { ACCOUNT_NOTIFICATION_TYPES, VENDOR_NOTIFICATION_TYPES } from "@/lib/notification-types";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { HeaderVendorCategory } from "@/components/VendorsMegaMenu";

type NavBarContainerState = {
  user: User | null;
  isVendor: boolean;
  ready: boolean;
};

export default function NavBarContainer({ vendorCategories }: { vendorCategories: HeaderVendorCategory[] }) {
  const pathname = usePathname();
  const [state, setState] = useState<NavBarContainerState>({
    user: null,
    isVendor: false,
    ready: false,
  });

  useEffect(() => {
    let active = true;

    const syncVendorFlag = async (user: User) => {
      try {
        const { data: isVendor } = await supabaseBrowser.rpc("is_vendor", { _uid: user.id });
        if (!active) return;
        setState((current) =>
          current.user?.id === user.id ? { ...current, isVendor: !!isVendor, ready: true } : current
        );
      } catch {
        if (!active) return;
        setState((current) =>
          current.user?.id === user.id ? { ...current, isVendor: false, ready: true } : current
        );
      }
    };

    const syncUser = (nextUser: User | null) => {
      if (!nextUser) {
        if (active) {
          setState({ user: null, isVendor: false, ready: true });
        }
        return;
      }

      if (active) {
        setState((current) => {
          const sameUser = current.user?.id === nextUser.id;
          return {
            user: nextUser,
            isVendor: sameUser ? current.isVendor : false,
            ready: sameUser,
          };
        });
      }

      void syncVendorFlag(nextUser);
    };

    void supabaseBrowser.auth
      .getSession()
      .then(({ data }) => {
        if (active) {
          syncUser(data.session?.user ?? null);
        }
      })
      .catch(() => {
        if (active) {
          syncUser(null);
        }
      });

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const authMenu = !state.ready ? (
    <div className="ms-auto" />
  ) : state.user ? (
    <AuthDropdown user={state.user} isVendor={state.isVendor} />
  ) : (
    <GuestAuthActions />
  );

  if (pathname === "/") {
    return null;
  }

  return (
    <NavBar
      authMenu={authMenu}
      isAuthenticated={state.ready && !!state.user}
      isVendor={state.ready && state.isVendor}
      notificationLink={
        state.ready && state.user ? (
          <NotificationLink
            userId={state.user.id}
            href={state.isVendor ? "/vendor/notifications" : "/account/notifications"}
            types={state.isVendor ? [...VENDOR_NOTIFICATION_TYPES] : [...ACCOUNT_NOTIFICATION_TYPES]}
          />
        ) : undefined
      }
      vendorCategories={vendorCategories}
    />
  );
}
