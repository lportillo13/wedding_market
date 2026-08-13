"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ForgotPasswordClient({ recoveryError = false }: { recoveryError?: boolean }) {
  const { dictionary } = useLanguage();
  const labels = dictionary.login;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(recoveryError ? labels.recoveryExpired : null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSent(false);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
    const { error: resetError } = await supabaseBrowser.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo },
    );

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <main className="wm-auth-shell">
      <div className="wm-auth-card">
        <div className="wm-auth-card__header">
          <Link href="/" className="wm-auth-card__brand">Wedding Market</Link>
          <p className="wm-auth-card__eyebrow">{labels.resetEyebrow}</p>
          <h1 className="wm-auth-card__title">{labels.resetTitle}</h1>
        </div>

        <div className="wm-auth-card__body">
          <p className="wm-auth-description">{labels.resetDescription}</p>
          {error && <div className="wm-auth-error" role="alert">{error}</div>}
          {sent && <div className="wm-auth-success" role="status">{labels.resetSent}</div>}

          {!sent && (
            <form onSubmit={onSubmit}>
              <div className="wm-auth-form-group">
                <label htmlFor="recovery-email">{labels.emailLabel}</label>
                <input
                  id="recovery-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <button className="wm-auth-btn" type="submit" disabled={loading}>
                {loading ? labels.resetSubmitting : labels.resetSubmit}
              </button>
            </form>
          )}

          <div className="wm-auth-back">
            <Link className="wm-auth-text-link" href="/login">{labels.resetBack}</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
