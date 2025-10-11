"use client";

import { useActionState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import { setPublishStatus, type PubState } from "./actions";

export default function PublishForm({ initial }: { initial: { is_published: boolean; slug?: string } }) {
  const [state, formAction, pending] = useActionState<PubState, FormData>(setPublishStatus, { ok: false, message: "" });
  const published = typeof state.published === "boolean" ? state.published : initial.is_published;
  const t = useTranslation();

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
          {published ? t("vendorDashboard.publish.status.published") : t("vendorDashboard.publish.status.unpublished")}
        </label>
      </div>

      {state.message && (
        <div className={`alert ${state.ok ? "alert-success" : "alert-danger"} mb-3`} role="alert">
          {state.message}
        </div>
      )}

      <button className="btn btn-primary" disabled={pending}>
        {pending ? t("vendorDashboard.publish.saving") : t("vendorDashboard.publish.save")}
      </button>

      {published && initial.slug && (
        <a className="btn btn-link ms-2" href={`/vendors/${initial.slug}`} target="_blank" rel="noreferrer">
          {t("vendorDashboard.publish.viewPublic")}
        </a>
      )}
    </form>
  );
}
