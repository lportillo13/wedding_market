"use client";

import { useActionState, useEffect, useState } from "react";
import type { SaveState } from "./actions";
import { saveProfile } from "./actions";

type FormShape = {
  slug: string;
  business_name: string;
  bio_en: string;
  bio_es: string;
};

const actionInitial: SaveState = { ok: false, message: "" };

export default function ProfileForm({ initial }: { initial: FormShape }) {
  const [state, formAction, isPending] = useActionState(saveProfile, actionInitial);
  const [form, setForm] = useState<FormShape>(initial);

  // If the server sends new props (after save/revalidate), sync them
  useEffect(() => {
    setForm(initial);
  }, [initial]);

  // If the server action changed the slug, reflect it
  useEffect(() => {
    if (state.ok && state.slug) setForm((prev) => ({ ...prev, slug: state.slug }));
  }, [state.ok, state.slug]);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <form action={formAction} suppressHydrationWarning>
      <div className="mb-3">
        <label className="form-label">Business name</label>
        <input
          name="business_name"
          className={`form-control ${state.fieldErrors?.business_name ? "is-invalid" : ""}`}
          value={form.business_name}
          onChange={onChange}
          required
        />
        {state.fieldErrors?.business_name && (
          <div className="invalid-feedback">{state.fieldErrors.business_name}</div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label">Slug</label>
        <input
          name="slug"
          className={`form-control ${state.fieldErrors?.slug ? "is-invalid" : ""}`}
          value={form.slug}
          onChange={onChange}
          placeholder="my-amazing-vendor"
        />
        {state.fieldErrors?.slug && <div className="invalid-feedback">{state.fieldErrors.slug}</div>}
        <div className="form-text">Only letters, numbers and hyphens.</div>
      </div>

      <div className="mb-3">
        <label className="form-label">Bio (EN)</label>
        <textarea
          name="bio_en"
          className="form-control"
          rows={4}
          value={form.bio_en}
          onChange={onChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Bio (ES)</label>
        <textarea
          name="bio_es"
          className="form-control"
          rows={4}
          value={form.bio_es}
          onChange={onChange}
        />
      </div>

      {state.message && (
        <div className={`alert ${state.ok ? "alert-success" : "alert-danger"}`} role="alert">
          {state.message}
        </div>
      )}

      <button className="btn btn-primary" disabled={isPending}>
        {isPending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
