"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useProfileSaveFeedback } from "./ProfileEditorContext";

export default function ProfileSaveBar({
  state,
  pending,
  label,
  disabled,
}: {
  state: { ok: boolean; message: string };
  pending: boolean;
  label?: string;
  disabled?: boolean;
}) {
  const { language } = useLanguage();
  const dirty = useProfileSaveFeedback(state, pending);
  const es = language === "es";
  return (
    <div className="wm-profile-savebar">
      <div
        className="wm-profile-savebar__feedback"
        role="status"
        aria-live="polite"
      >
        {pending
          ? es
            ? "Guardando cambios…"
            : "Saving changes…"
          : dirty
            ? es
              ? "Cambios sin guardar en esta sección"
              : "Unsaved changes in this section"
            : state.message
              ? state.ok
                ? es
                  ? "Cambios guardados"
                  : "Changes saved"
                : state.message
              : es
                ? "Guarda esta sección antes de salir."
                : "Save this section before leaving."}
        {!pending && dirty && state.message && !state.ok ? (
          <span className="text-danger d-block small">{state.message}</span>
        ) : null}
      </div>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={pending || disabled}
      >
        {pending
          ? es
            ? "Guardando…"
            : "Saving…"
          : (label ?? (es ? "Guardar cambios" : "Save changes"))}
        {!pending ? <span aria-hidden="true"> ↗︎</span> : null}
      </button>
    </div>
  );
}
