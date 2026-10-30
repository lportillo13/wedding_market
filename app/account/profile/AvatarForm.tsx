"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import type { CloudinaryImage } from "@/types/images";
import { uploadWithProgress } from "@/lib/client/uploads";

type AvatarFormLabels = {
  heading: string;
  description: string;
  fileLabel: string;
  helpText: string;
  chooseLabel: string;
  optionalHint: string;
  messages: {
    updated: string;
    uploadFailed: string;
  };
  submit: { label: string; pending: string };
};

type AvatarFormProps = {
  image: CloudinaryImage | null;
  name: string;
  labels: AvatarFormLabels;
};

export default function AvatarForm({ image, name, labels }: AvatarFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<{ ok: boolean; message: string }>({ ok: false, message: "" });

  async function handleSubmit(formData: FormData) {
    if (pending) return;
    try {
      setPending(true);
      setProgress(0);
      setStatus({ ok: false, message: "" });
      formData.set("target", "client-avatar");
      formData.set("file", formData.get("avatar") as File);

      await uploadWithProgress<{ asset: CloudinaryImage }>("/api/uploads", formData, setProgress);
      formRef.current?.reset();
      setFileName("");
      setStatus({ ok: true, message: labels.messages.updated });
      router.refresh();
    } catch (error) {
      setStatus({
        ok: false,
        message: error instanceof Error ? error.message : labels.messages.uploadFailed,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(new FormData(event.currentTarget));
      }}
      className="wm-profile-photo"
      encType="multipart/form-data"
      aria-busy={pending}
      aria-labelledby="profile-photo-heading"
    >
        <UserAvatar image={image} name={name} size={68} className="wm-profile-photo__avatar" />
        <div className="wm-profile-photo__content">
          <h2 id="profile-photo-heading">{labels.heading}</h2>
          <p>{labels.description}</p>
          <label className="visually-hidden" htmlFor="profile-avatar">
            {labels.fileLabel}
          </label>
          <input
            ref={inputRef}
            id="profile-avatar"
            name="avatar"
            type="file"
            className="wm-profile-photo__input"
            tabIndex={-1}
            accept="image/*"
            required
            disabled={pending}
            aria-describedby="profile-photo-help"
            onChange={(event) => {
              setFileName(event.currentTarget.files?.[0]?.name ?? "");
              setStatus({ ok: false, message: "" });
            }}
          />
          <div className="wm-profile-photo__actions">
            <button className="wm-profile-photo__choose" type="button" disabled={pending} onClick={() => inputRef.current?.click()}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h5l2-3h4l2 3h5v13H3z" /><circle cx="12" cy="13" r="4" /></svg>
              {labels.chooseLabel}
            </button>
            <span id="profile-photo-help">{labels.optionalHint}</span>
          </div>
          {fileName && <div className="wm-profile-photo__selection">
            <span>{fileName}</span>
            <button className="wm-profile-button wm-profile-button--outline" type="submit" disabled={pending}>
              {pending ? labels.submit.pending : labels.submit.label}
            </button>
            <p>{labels.helpText}</p>
          </div>}
          {pending ? (
            <div className="mt-3">
              <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${progress}%` }}>
                  {progress}%
                </div>
              </div>
            </div>
          ) : null}
          {status.message && (
            <div className={`small mt-3 ${status.ok ? "text-success" : "text-danger"}`} role={status.ok ? "status" : "alert"}>{status.message}</div>
          )}
        </div>
    </form>
  );
}
