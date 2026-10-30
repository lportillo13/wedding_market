"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabaseBrowser } from "@/lib/supabase/client";
import EditorialAuthLayout from "@/components/auth/EditorialAuthLayout";
import PasswordInput from "@/components/PasswordInput";
import { authFeedbackKey } from "@/lib/auth-feedback";

export default function ResetPasswordClient({ nextPath = "/account/profile" }: { nextPath?: string }) {
  const { dictionary } = useLanguage();
  const labels = dictionary.login;
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<ReturnType<typeof authFeedbackKey> | "passwordTooShort" | "passwordMismatch" | null>(null);
  const inFlight = useRef(false);
  const error = errorKey === "passwordTooShort" || errorKey === "passwordMismatch"
    ? labels[errorKey] : errorKey ? labels.feedback[errorKey] : null;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    setErrorKey(null);

    if (password.length < 8) {
      setErrorKey("passwordTooShort");
      return;
    }
    if (password !== confirmation) {
      setErrorKey("passwordMismatch");
      return;
    }

    inFlight.current = true;
    setLoading(true);
    try {
      const { error: updateError } = await supabaseBrowser.auth.updateUser({ password });
      if (updateError) throw updateError;
      const { error: signOutError } = await supabaseBrowser.auth.signOut();
      if (signOutError) throw signOutError;
      window.location.replace(`/login?${new URLSearchParams({ password_updated: "1", next: nextPath })}`);
    } catch (error) {
      setLoading(false);
      inFlight.current = false;
      setErrorKey(authFeedbackKey(error));
    }
  }

  return (
    <EditorialAuthLayout>
        <header className="wm-auth-editorial__heading">
          <p className="wm-auth-editorial__eyebrow">{labels.resetEyebrow}</p>
          <h1>{labels.newPasswordTitle}</h1>
          <p>{labels.newPasswordDescription}</p>
        </header>
          {error && <div className="wm-auth-error" role="alert">{error}</div>}

          <form onSubmit={onSubmit} aria-busy={loading}>
            <div className="wm-auth-form-group">
              <label htmlFor="new-password">{labels.newPasswordLabel}</label>
              <PasswordInput
                id="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                name="password"
                disabled={loading}
              />
            </div>
            <div className="wm-auth-form-group">
              <label htmlFor="confirm-password">{labels.confirmPasswordLabel}</label>
              <PasswordInput
                id="confirm-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                name="confirmation"
                disabled={loading}
              />
            </div>
            <button className="wm-auth-btn" type="submit" disabled={loading}>
              {loading ? labels.updatingPassword : labels.updatePassword}
            </button>
          </form>
          <div className="wm-auth-back">
            <Link className="wm-auth-text-link" href={`/forgot-password?${new URLSearchParams({ next: nextPath })}`}>{labels.resetSubmit}</Link>
          </div>
    </EditorialAuthLayout>
  );
}
