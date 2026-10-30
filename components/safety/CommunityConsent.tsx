"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname,useRouter } from "next/navigation";
import {isAccountEntry} from '@/features/auth/domain/access';
import { useLanguage } from "@/contexts/LanguageContext";
import { supabaseBrowser } from "@/lib/supabase/client";
import { safetyCopy } from "@/shared/safety/copy";
import { withDeadline } from "@/shared/resources/deadline";

export default function CommunityConsent({inline=false,onAccepted}:{inline?:boolean;onAccepted?:()=>void}={}) {
  const { language } = useLanguage();
  const labels = safetyCopy[language];
  const router = useRouter();
  const pathname=usePathname();
  const id = useId();
  const [accepted, setAccepted] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const interacted = useRef(false);
  const title = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (interacted.current) (expanded ? title.current : trigger.current)?.focus();
  }, [expanded]);

  function toggle() {
    interacted.current = true;
    setExpanded((value) => !value);
  }

  async function accept() {
    if (!checked || busy) return;
    setBusy(true);
    setError("");
    try {
      const { error: saveError } = await withDeadline((signal) =>
        supabaseBrowser.rpc("accept_community_terms").abortSignal(signal),
      );
      if (saveError) throw saveError;
      setAccepted(true);
      onAccepted?.();
      router.refresh();
    } catch {
      setError(labels.failed);
    } finally {
      setBusy(false);
    }
  }

  // Vendor review explicitly requests consent before its posting-protected save.
  if (accepted || (!inline && isAccountEntry(pathname))) return null;

  return (
    <aside className={`wm-community-notice${inline?' wm-community-notice--inline':''}`} aria-label={language === "es" ? "Términos de la comunidad" : "Community terms"}>
      {!inline&&!expanded ? (
        <button ref={trigger} type="button" className="wm-community-notice__trigger" aria-expanded={false} aria-controls={id} onClick={toggle}>
          <span aria-hidden="true">↗</span>
          {language === "es" ? "Revisar términos" : "Review terms"}
        </button>
      ) : null}
        <section hidden={!expanded} id={id} className="wm-community-notice__panel" aria-labelledby={`${id}-title`}>
          {!inline&&<button type="button" className="wm-community-notice__close" aria-label={language === "es" ? "Minimizar aviso de términos" : "Minimize terms notice"} onClick={toggle} disabled={busy}>
            <span aria-hidden="true">×</span>
          </button>}
          <p className="wm-community-notice__eyebrow">Wedding Market</p>
          <h2 ref={title} id={`${id}-title`} tabIndex={-1}>{inline?(language==='es'?'Antes de crear tu perfil':'Before creating your profile'):(language === "es" ? "Antes de conectar" : "Before you connect")}</h2>
          <p className="wm-community-notice__description" id={`${id}-description`}>{labels.consent}</p>
          <nav className="wm-community-notice__links" aria-label={language === "es" ? "Documentos de la comunidad" : "Community documents"}>
            {(["terms", "privacy", "community-guidelines"] as const).map((path, index) => (
              <Link key={path} href={`/${path}?lang=${language}`} target="_blank" rel="noopener noreferrer">
                {(language === "es" ? ["Términos", "Privacidad", "Normas de la Comunidad"] : ["Terms", "Privacy", "Community Guidelines"])[index]}
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
          <div aria-busy={busy}>
            <label className="wm-community-notice__agreement">
              <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} required disabled={busy} aria-describedby={`${id}-description`} />
              <span>{labels.accept}</span>
            </label>
            {error ? <p className="wm-community-notice__error" role="alert">{error}</p> : null}
            <button type="button" onClick={accept} className="wm-community-notice__submit" disabled={!checked || busy}>
              {busy ? (language === "es" ? "Guardando…" : "Saving…") : (language === "es" ? "Aceptar y continuar" : "Accept & continue")}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
    </aside>
  );
}
