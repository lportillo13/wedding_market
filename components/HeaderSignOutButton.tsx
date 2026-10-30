"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function HeaderSignOutButton({
  className,
  onSignedOut,
  icon,
}: {
  className?: string;
  onSignedOut?: () => void;
  icon?: ReactNode;
}) {
  const router = useRouter();
  const { language, dictionary } = useLanguage();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return (
    <>
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(false);
          try {
            await supabaseBrowser.auth.signOut();
            const response = await fetch("/auth/signout", {
              method: "POST",
              credentials: "same-origin",
            });
            if (!response.ok) throw new Error("Sign out failed");
            onSignedOut?.();
            router.push("/");
            router.refresh();
          } catch {
            setError(true);
          } finally {
            setPending(false);
          }
        }}
      >
        {icon}<span>{pending
          ? language === "es"
            ? "Cerrando sesión…"
            : "Signing out…"
          : dictionary.auth.logOut}</span>
      </button>
      {error ? (
        <p className="wm-header-signout-error" role="alert">
          {language === "es"
            ? "No se pudo cerrar la sesión. Inténtalo de nuevo."
            : "Unable to sign out. Please try again."}
        </p>
      ) : null}
    </>
  );
}
