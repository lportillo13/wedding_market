"use client";

import { useActionState, useEffect, useRef } from "react";
import UserAvatar from "@/components/UserAvatar";
import type { CloudinaryImage } from "@/types/images";
import { uploadProfileAvatar, type AvatarUploadState } from "./actions";

const initialState: AvatarUploadState = { ok: false, message: "" };

type AvatarFormLabels = {
  heading: string;
  description: string;
  fileLabel: string;
  helpText: string;
  submit: { label: string; pending: string };
};

type AvatarFormProps = {
  image: CloudinaryImage | null;
  name: string;
  labels: AvatarFormLabels;
};

export default function AvatarForm({ image, name, labels }: AvatarFormProps) {
  const [state, formAction, pending] = useActionState<AvatarUploadState, FormData>(uploadProfileAvatar, initialState);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.ok && formRef.current) {
      formRef.current.reset();
    }
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
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
          {state.message && (
            <div className={`small mt-3 ${state.ok ? "text-success" : "text-danger"}`}>{state.message}</div>
          )}
        </div>
      </div>
    </form>
  );
}
