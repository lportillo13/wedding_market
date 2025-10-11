"use client";

import { useActionState } from "react";
import { setPublishStatus, type PubState } from "./actions";

export default function PublishForm({ initial }: { initial: { is_published: boolean; slug?: string } }) {
  const [state, formAction, pending] = useActionState<PubState, FormData>(setPublishStatus, { ok: false, message: "" });
  const published = typeof state.published === "boolean" ? state.published : initial.is_published;

  return (
    <form action={formAction} className="border rounded p-3">
      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="publishSwitch"
          name="publish"
          checked={published}
          onChange={() => {}}
        />
        <label className="form-check-label" htmlFor="publishSwitch">
          {published ? "Published (visible in catalog)" : "Unpublished (hidden from catalog)"}
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

      {published && initial.slug && (
        <a className="btn btn-link ms-2" href={`/vendors/${initial.slug}`} target="_blank" rel="noreferrer">
          View public page
        </a>
      )}
    </form>
  );
}
