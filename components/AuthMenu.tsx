"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AuthDropdown from "@/components/AuthDropdown";
import GuestAuthActions from "@/components/GuestAuthActions";
import { supabaseBrowser } from "@/lib/supabase/client";

type AuthMenuState = {
  user: User | null;
  isVendor: boolean;
  ready: boolean;
};

export default function AuthMenu() {
  const [state, setState] = useState<AuthMenuState>({
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

  if (!state.ready) {
    return <div className="ms-auto" />;
  }

  if (!state.user) {
    return <GuestAuthActions />;
  }

  return <AuthDropdown user={state.user} isVendor={state.isVendor} />;
}
