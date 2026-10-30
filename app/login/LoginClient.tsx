"use client";

import Link from "next/link";
import PasswordInput from '@/components/PasswordInput';
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabaseBrowser } from "@/lib/supabase/client";
import EditorialAuthLayout from "@/components/auth/EditorialAuthLayout";
import { authFeedbackKey } from "@/lib/auth-feedback";
import {resolveLoginDestination} from '@/features/auth/domain/login-destination';
import AuthenticationMethods from '@/components/auth/AuthenticationMethods';
import type {AccessIntent} from '@/features/auth/domain/access';

export default function LoginClient({
  nextPath,
  passwordUpdated = false,
  callbackError = false,
  defaultWorkspace = true,
  intent='login',
}: {
  nextPath: string;
  passwordUpdated?: boolean;
  callbackError?: boolean;
  defaultWorkspace?: boolean;
  intent?:AccessIntent;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<"password" | null>(null);
  const [accessBusy,setAccessBusy]=useState(false);
  const inFlight = useRef(false);
  const [errorKey, setErrorKey] = useState<ReturnType<typeof authFeedbackKey> | "callbackError" | null>(callbackError ? "callbackError" : null);
  const { dictionary } = useLanguage();
  const labels = dictionary.login;
  const copy = labels.editorial;
  const recoveryHref = `/forgot-password?${new URLSearchParams({ next: nextPath })}`;

  useEffect(() => {
    const restoreFromHistory = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      inFlight.current = false;
      setPending(null);
    };
    window.addEventListener("pageshow", restoreFromHistory);
    return () => window.removeEventListener("pageshow", restoreFromHistory);
  }, []);

  async function onEmailPassword(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current || accessBusy) return;
    inFlight.current = true;
    setPending("password");
    setErrorKey(null);
    try {
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      const destination = await resolveLoginDestination(
        {nextPath, defaultWorkspace, userId: data.user?.id},
        async userId => {
          const {data: isVendor} = await supabaseBrowser.rpc('is_vendor', {_uid: userId});
          return Boolean(isVendor);
        },
      );
      window.location.replace(destination);
    } catch (error) {
      setErrorKey(authFeedbackKey(error));
      inFlight.current = false;
      setPending(null);
    }
  }

  return (
    <EditorialAuthLayout>
        <header className="wm-auth-editorial__heading">
          <p className="wm-auth-editorial__eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </header>
          {passwordUpdated && <div className="wm-auth-success" role="status">{labels.passwordUpdated}</div>}
          {errorKey && <div className="wm-auth-error" role="alert">{labels.feedback[errorKey]}</div>}
          <AuthenticationMethods intent={intent} nextPath={nextPath} defaultWorkspace={defaultWorkspace} disabled={pending!==null} onBusyChange={setAccessBusy}/>
          <form onSubmit={onEmailPassword} aria-busy={pending !== null || accessBusy}>
            <div className="wm-auth-form-group">
              <label htmlFor="login-email">{labels.emailLabel}</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                name="email"
                autoCapitalize="none"
                spellCheck={false}
                disabled={pending !== null || accessBusy}
              />
            </div>
            <div className="wm-auth-form-group">
              <label htmlFor="login-password">{labels.passwordLabel}</label>
              <PasswordInput
                id="login-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                name="password"
                disabled={pending !== null || accessBusy}
              />
              <div className="wm-auth-field-action">
                <Link href={recoveryHref}>{labels.forgotPassword}</Link>
              </div>
            </div>
            <button className="wm-auth-btn" type="submit" disabled={pending !== null || accessBusy}>
              {pending === "password" ? labels.submitting : copy.submit}
            </button>
          </form>


        <div className="wm-auth-editorial__register">
          <p>{labels.registerPrompt}</p>
          <div>
            <Link href="/signup?modal=create-account">{copy.coupleSignup}</Link>
            <Link href="/signup/vendor">{copy.vendorSignup}</Link>
          </div>
          <p className="wm-auth-editorial__free">{copy.free}</p>
        </div>
    </EditorialAuthLayout>
  );
}
