"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import type { CloudinaryImage } from "@/types/images";
import { uploadWithProgress } from "@/lib/client/uploads";

type AvatarFormLabels = {
  heading: string;
  description: string;
  fileLabel: string;
  helpText: string;
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
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<{ ok: boolean; message: string }>({ ok: false, message: "" });

  useEffect(() => {
    if (status.ok && formRef.current) {
      formRef.current.reset();
    }
  }, [status.ok]);

  async function handleSubmit(formData: FormData) {
    try {
      setPending(true);
      setProgress(0);
      setStatus({ ok: false, message: "" });
      formData.set("target", "client-avatar");
      formData.set("file", formData.get("avatar") as File);

      await uploadWithProgress<{ asset: CloudinaryImage }>("/api/uploads", formData, setProgress);
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
      action={handleSubmit}
      className="border rounded p-3 bg-body mb-4"
      encType="multipart/form-data"
    >
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
        <UserAvatar image={image} name={name} size={72} />
        <div className="flex-grow-1 w-100">
          <h2 className="h5 mb-1">{labels.heading}</h2>
          <p className="text-secondary small mb-3">{labels.description}</p>
          <label className="form-label" htmlFor="profile-avatar">
            {labels.fileLabel}
          </label>
          <input
            id="profile-avatar"
            name="avatar"
            type="file"
            className="form-control"
            accept="image/*"
            required
            disabled={pending}
          />
          <div className="form-text">{labels.helpText}</div>
          <button className="btn btn-outline-secondary mt-3" type="submit" disabled={pending}>
            {pending ? labels.submit.pending : labels.submit.label}
          </button>
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
            <div className={`small mt-3 ${status.ok ? "text-success" : "text-danger"}`}>{status.message}</div>
          )}
        </div>
      </div>
    </form>
  );
}
