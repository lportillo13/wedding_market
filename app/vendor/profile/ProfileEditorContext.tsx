"use client";

import { createContext, useContext, useEffect, useRef } from "react";

type SectionDraft = {
  dirty: boolean;
  saved: () => void;
  pending: (value: boolean) => void;
  changed?: () => void;
};

export const ProfileSectionContext = createContext<SectionDraft | null>(null);

export function useProfileSaveFeedback(
  state: { ok: boolean; message: string },
  pending: boolean,
) {
  const section = useContext(ProfileSectionContext);
  const lastState = useRef(state);
  const onSaved = section?.saved;
  const onPending = section?.pending;
  useEffect(() => {
    onPending?.(pending);
    return () => onPending?.(false);
  }, [onPending, pending]);
  useEffect(() => {
    if (state !== lastState.current) {
      lastState.current = state;
      if (state.ok) onSaved?.();
    }
  }, [onSaved, state]);
  return section?.dirty ?? false;
}
