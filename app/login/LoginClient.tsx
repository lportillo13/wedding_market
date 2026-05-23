"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabaseBrowser } from "@/lib/supabase/client";

async function resolveLoginDestination(nextPath: string, userId?: string) {
  if (nextPath !== "/account/profile") {
    return nextPath;
  }

  if (!userId) {
    return nextPath;
  }

  const { data: isVendor } = await supabaseBrowser.rpc("is_vendor", { _uid: userId });
  return isVendor ? "/vendor/profile" : "/account/profile";
}

export default function LoginClient({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { dictionary } = useLanguage();
  const labels = dictionary.login;

  async function onEmailPassword(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setErr(null);
    const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }

    const destination = await resolveLoginDestination(nextPath, data.user?.id);
    window.location.replace(destination);
  }

  async function onGoogle() {
    setErr(null);
    await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
  }

  return (
    <main className="wm-auth-shell">
      <div className="wm-auth-card">
        <div className="wm-auth-card__header">
          <Link href="/" className="wm-auth-card__brand">Wedding Market</Link>
          <p className="wm-auth-card__eyebrow">Welcome back</p>
          <h1 className="wm-auth-card__title">{labels.title}</h1>
        </div>

        <div className="wm-auth-card__body">
          {err && <div className="wm-auth-error">{err}</div>}

          <form onSubmit={onEmailPassword}>
            <div className="wm-auth-form-group">
              <label htmlFor="login-email">{labels.emailLabel}</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="wm-auth-form-group">
              <label htmlFor="login-password">{labels.passwordLabel}</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button className="wm-auth-btn" type="submit" disabled={loading}>
              {loading ? labels.submitting : labels.submit}
            </button>
          </form>

          <div className="wm-auth-divider">or</div>

          <button className="wm-auth-btn wm-auth-btn--ghost" type="button" onClick={onGoogle}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.964L3.964 7.3C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            {labels.google}
          </button>
        </div>

        <div className="wm-auth-footer">
          Don&apos;t have an account?{" "}
          <Link href="/signup">Create one</Link>
        </div>
      </div>
    </main>
  );
}
