"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabaseBrowser } from "@/lib/supabase/client";
import EditorialAuthLayout from "@/components/auth/EditorialAuthLayout";
import { authFeedbackKey } from "@/lib/auth-feedback";

export default function ForgotPasswordClient({ recoveryError = false, nextPath = "/account/profile" }: { recoveryError?: boolean; nextPath?: string }) {
  const { dictionary } = useLanguage();
  const labels = dictionary.login;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<ReturnType<typeof authFeedbackKey> | null>(recoveryError ? "recoveryExpired" : null);
  const [sent, setSent] = useState(false);
  const inFlight = useRef(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setErrorKey(null);
    setSent(false);

    try {
      const resetPath = `/reset-password?${new URLSearchParams({ next: nextPath })}`;
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(resetPath)}`;
      const { error: resetError } = await supabaseBrowser.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
      if (resetError) throw resetError;
      setSent(true);
    } catch (error) {
      setErrorKey(authFeedbackKey(error));
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }

  return (
    <EditorialAuthLayout>
        <header className="wm-auth-editorial__heading">
          <p className="wm-auth-editorial__eyebrow">{labels.resetEyebrow}</p>
          <h1>{labels.resetTitle}</h1>
          <p>{labels.resetDescription}</p>
        </header>
          {errorKey && <div className="wm-auth-error" role="alert">{labels.feedback[errorKey]}</div>}
          {sent && <div className="wm-auth-success" role="status">{labels.resetSent}</div>}

          {!sent && (
            <form onSubmit={onSubmit} aria-busy={loading}>
              <div className="wm-auth-form-group">
                <label htmlFor="recovery-email">{labels.emailLabel}</label>
                <input
                  id="recovery-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  name="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={loading}
                />
              </div>
              <button className="wm-auth-btn" type="submit" disabled={loading}>
                {loading ? labels.resetSubmitting : labels.resetSubmit}
              </button>
            </form>
          )}

          <div className="wm-auth-back">
            <Link className="wm-auth-text-link" href={`/login?${new URLSearchParams({ next: nextPath })}`}>{labels.resetBack}</Link>
          </div>
    </EditorialAuthLayout>
  );
}
