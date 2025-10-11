"use client";

import { useActionState, useEffect, useState } from "react";
import { setPublishStatus, type PubState } from "./actions";

export default function PublishForm({ initial }: { initial: { is_published: boolean; slug?: string } }) {
  const [state, formAction, pending] = useActionState<PubState, FormData>(setPublishStatus, { ok: false, message: "" });
  const [checked, setChecked] = useState(initial.is_published);

  useEffect(() => {
    if (state.ok && typeof state.published === "boolean") {
      setChecked(state.published);
    }
  }, [state.ok, state.published]);

  return (
    <form action={formAction} className="border rounded p-3">
      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="publishSwitch"
          name="publish"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="publishSwitch">
          {checked ? "Published (visible in catalog)" : "Unpublished (hidden from catalog)"}
        </label>
      </div>

      {state.message && (
        <div className={`alert ${state.ok ? "alert-success" : "alert-danger"} mb-3`} role="alert">
          {state.message}
        </div>
      )}

      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>

      {checked && initial.slug && (
        <a className="btn btn-link ms-2" href={`/vendors/${initial.slug}`} target="_blank">
          View public page
        </a>
      )}
    </form>
  );
}
