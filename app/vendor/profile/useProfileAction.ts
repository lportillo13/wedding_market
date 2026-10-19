"use client";

import { useActionState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { runProfileAction } from "@/lib/client/profile-actions";

export function useProfileAction<
  State extends { ok: boolean; message: string },
>(
  action: (previous: State, data: FormData) => Promise<State>,
  initial: Awaited<State>,
) {
  const { language } = useLanguage();
  const failure =
    language === "es"
      ? "No se pudo guardar. Tus cambios siguen aquí. Inténtalo de nuevo."
      : "Unable to save. Your edits are still here. Please try again.";
  const guarded = useCallback(
    (previous: State, data: FormData) =>
      runProfileAction(action, previous, data, failure),
    [action, failure],
  );
  return useActionState<State, FormData>(guarded, initial);
}
