"use client";

import { useActionState, useState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import { saveAvailability, type FormMessageState } from "./actions";

type AvailabilityInitial = {
  en: string;
  es: string;
};

type AvailabilityFormProps = {
  initial: AvailabilityInitial;
};

const initialState: FormMessageState = { ok: false, message: "" };

export default function AvailabilityForm({ initial }: AvailabilityFormProps) {
  const [state, formAction, isPending] = useActionState(saveAvailability, initialState);
  const [form, setForm] = useState(initial);
  const t = useTranslation();

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <form action={formAction}>
      <div className="mb-3">
        <label className="form-label" htmlFor="availability-en">
          {t("vendorDashboard.profileAvailability.noteEnLabel")}
        </label>
        <textarea
          id="availability-en"
          name="availability_en"
          className="form-control"
          rows={3}
          value={form.en}
          onChange={onChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="availability-es">
          {t("vendorDashboard.profileAvailability.noteEsLabel")}
        </label>
        <textarea
          id="availability-es"
          name="availability_es"
          className="form-control"
          rows={3}
          value={form.es}
          onChange={onChange}
        />
      </div>

      {state.message ? (
        <div className={`alert ${state.ok ? "alert-success" : "alert-danger"}`} role="status">
          {state.message}
        </div>
      ) : null}

      <button className="btn btn-primary" disabled={isPending}>
        {isPending
          ? t("vendorDashboard.profileAvailability.saving")
          : t("vendorDashboard.profileAvailability.save")}
      </button>
    </form>
  );
}
