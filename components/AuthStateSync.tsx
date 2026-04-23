"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AuthStateSync() {
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        startTransition(() => {
          router.refresh();
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
