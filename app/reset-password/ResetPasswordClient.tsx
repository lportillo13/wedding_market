"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ResetPasswordClient() {
  const { dictionary } = useLanguage();
  const labels = dictionary.login;
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(labels.passwordTooShort);
      return;
    }
    if (password !== confirmation) {
      setError(labels.passwordMismatch);
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabaseBrowser.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    await supabaseBrowser.auth.signOut();
    window.location.replace("/login?password_updated=1");
  }

  return (
    <main className="wm-auth-shell">
      <div className="wm-auth-card">
        <div className="wm-auth-card__header">
          <Link href="/" className="wm-auth-card__brand">Wedding Market</Link>
          <p className="wm-auth-card__eyebrow">{labels.resetEyebrow}</p>
          <h1 className="wm-auth-card__title">{labels.newPasswordTitle}</h1>
        </div>

        <div className="wm-auth-card__body">
          <p className="wm-auth-description">{labels.newPasswordDescription}</p>
          {error && <div className="wm-auth-error" role="alert">{error}</div>}

          <form onSubmit={onSubmit}>
            <div className="wm-auth-form-group">
              <label htmlFor="new-password">{labels.newPasswordLabel}</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="wm-auth-form-group">
              <label htmlFor="confirm-password">{labels.confirmPasswordLabel}</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <button className="wm-auth-btn" type="submit" disabled={loading}>
              {loading ? labels.updatingPassword : labels.updatePassword}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
