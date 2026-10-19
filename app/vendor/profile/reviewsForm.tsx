"use client";

import { useProfileAction } from "./useProfileAction";
import ProfileSaveBar from "./ProfileSaveBar";

import { useState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import { saveReviews, type FormMessageState } from "./actions";

type ReviewsInitial = {
  summary: string;
  googleBusinessProfileUrl: string;
};

type ReviewsFormProps = {
  initial: ReviewsInitial;
};

const initialState: FormMessageState = { ok: false, message: "" };

export default function ReviewsForm({ initial }: ReviewsFormProps) {
  const [state, formAction, isPending] = useProfileAction(saveReviews, initialState);
  const [summary, setSummary] = useState(initial.summary);
  const [googleUrl, setGoogleUrl] = useState(initial.googleBusinessProfileUrl);
  const t = useTranslation();

  return (
    <form action={formAction} data-profile-save>
      <div className="mb-3">
        <label className="form-label" htmlFor="review-summary">
          {t("vendorDashboard.profileReviews.summaryLabel")}
        </label>
        <textarea
          id="review-summary"
          name="review_summary"
          className="form-control"
          rows={4}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
        <div className="form-text">{t("vendorDashboard.profileReviews.summaryHelp")}</div>
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="google-review-url">
          {t("vendorDashboard.profileReviews.googleLinkLabel")}
        </label>
        <input
          id="google-review-url"
          name="google_business_profile_url"
          className="form-control"
          value={googleUrl}
          onChange={(event) => setGoogleUrl(event.target.value)}
        />
        <div className="form-text">{t("vendorDashboard.profileReviews.googleLinkHelp")}</div>
      </div>

      <ProfileSaveBar state={state} pending={isPending} label={t("vendorDashboard.profileReviews.save")} />
    </form>
  );
}
