"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import { uploadWithProgress } from "@/lib/client/uploads";
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from "@/lib/media-url";
import { saveTeam, type FormMessageState } from "./actions";

type TeamMemberInitial = {
  name: string;
  title: string;
  bio: string;
  headshotUrl: string;
  respondsWithinHours: string;
};

type TeamFormProps = {
  initial: TeamMemberInitial[];
};

const initialState: FormMessageState = { ok: false, message: "" };

type TeamMemberState = TeamMemberInitial & {
  clientId: string;
  uploadPending: boolean;
  uploadProgress: number;
  uploadSelection: string[];
  uploadMessage: string;
  uploadOk: boolean;
};

function createMember(from?: TeamMemberInitial): TeamMemberState {
  const randomId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return {
    clientId: randomId,
    name: from?.name ?? "",
    title: from?.title ?? "",
    bio: from?.bio ?? "",
    headshotUrl: from?.headshotUrl ?? "",
    respondsWithinHours: from?.respondsWithinHours ?? "",
    uploadPending: false,
    uploadProgress: 0,
    uploadSelection: [],
    uploadMessage: "",
    uploadOk: false,
  };
}

function ProgressBar({ pending, progress }: { pending: boolean; progress: number }) {
  if (!pending && progress <= 0) return null;
  return (
    <div className="mt-2">
      <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${progress}%` }}>
          {progress}%
        </div>
      </div>
    </div>
  );
}

function UploadMeta({
  pending,
  progress,
  selection,
}: {
  pending: boolean;
  progress: number;
  selection: string[];
}) {
  if (!pending && selection.length === 0) return null;
  return (
    <div className="wm-vendor-media-status">
      <div className="d-flex align-items-center justify-content-between gap-3">
        <div className="min-w-0">
          <div className="fw-semibold text-dark">
            {pending ? "Uploading headshot" : `Selected ${selection.length} file${selection.length === 1 ? "" : "s"}`}
          </div>
          {selection.length > 0 ? <div className="small text-secondary text-truncate">{selection.join(", ")}</div> : null}
        </div>
        <div className="wm-vendor-media-status__badge">{progress}%</div>
      </div>
      <ProgressBar pending={pending || progress > 0} progress={progress} />
    </div>
  );
}

export default function TeamForm({ initial }: TeamFormProps) {
  const [state, formAction, isPending] = useActionState(saveTeam, initialState);
  const [members, setMembers] = useState<TeamMemberState[]>(initial.map((member) => createMember(member)));
  const t = useTranslation();

  function updateMember(index: number, field: keyof TeamMemberInitial, value: string) {
    setMembers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function patchMember(index: number, patch: Partial<TeamMemberState>) {
    setMembers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function addMember() {
    setMembers((prev) => [...prev, createMember()]);
  }

  function removeMember(index: number) {
    setMembers((prev) => prev.filter((_, idx) => idx !== index));
  }

  function moveMember(index: number, direction: number) {
    setMembers((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [current] = next.splice(index, 1);
      next.splice(target, 0, current);
      return next;
    });
  }

  async function uploadHeadshot(index: number, file: File) {
    try {
      patchMember(index, {
        uploadPending: true,
        uploadProgress: 0,
        uploadSelection: [file.name],
        uploadMessage: "",
        uploadOk: false,
      });

      const payload = new FormData();
      payload.set("target", "vendor-team-headshot");
      payload.set("file", file);
      const response = await uploadWithProgress<{ asset?: { url?: string } }>(
        "/api/uploads",
        payload,
        (progress) => patchMember(index, { uploadProgress: progress })
      );

      patchMember(index, {
        headshotUrl: response.asset?.url ?? "",
        uploadPending: false,
        uploadProgress: 0,
        uploadSelection: [],
        uploadMessage: "Headshot uploaded.",
        uploadOk: true,
      });
    } catch (error) {
      patchMember(index, {
        uploadPending: false,
        uploadProgress: 0,
        uploadMessage: error instanceof Error ? error.message : "Upload failed.",
        uploadOk: false,
      });
    }
  }

  const payload = useMemo(
    () =>
      JSON.stringify(
        members.map((member) => ({
          name: member.name,
          title: member.title,
          bio: member.bio,
          headshotUrl: member.headshotUrl,
          respondsWithinHours: member.respondsWithinHours,
        }))
      ),
    [members]
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="team" value={payload} />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h5 mb-0">{t("vendorDashboard.profileTeam.heading")}</h3>
        <button type="button" className="btn btn-outline-primary" onClick={addMember}>
          {t("vendorDashboard.profileTeam.add")}
        </button>
      </div>

      {members.length === 0 ? (
        <p className="text-muted">{t("vendorDashboard.profileTeam.empty")}</p>
      ) : (
        <div className="d-flex flex-column gap-4">
          {members.map((member, index) => (
            <div className="card" key={member.clientId}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h4 className="h6 mb-0">
                    {t("vendorDashboard.profileTeam.memberTitle").replace("{index}", String(index + 1))}
                  </h4>
                  <div className="btn-group" role="group" aria-label="Reorder team member">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => moveMember(index, -1)}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => moveMember(index, 1)}
                      disabled={index === members.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeMember(index)}
                    >
                      {t("vendorDashboard.profileTeam.remove")}
                    </button>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-lg-4">
                    <div className="wm-vendor-media-card h-100">
                      <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                        <div>
                          <h5 className="h6 mb-1">{t("vendorDashboard.profileTeam.headshotLabel")}</h5>
                          <p className="small text-muted mb-0">Upload a polished member photo from your device.</p>
                        </div>
                      </div>

                      {member.headshotUrl ? (
                        <div className="wm-vendor-media-preview wm-vendor-media-preview--thumb mb-3">
                          <Image
                            src={resolveMediaUrl(member.headshotUrl)}
                            alt={member.name || "Team member"}
                            width={180}
                            height={180}
                            unoptimized={shouldRenderUnoptimizedMedia(member.headshotUrl)}
                            className="rounded"
                            style={{ maxWidth: "180px", height: "auto" }}
                          />
                        </div>
                      ) : (
                        <p className="text-muted small mb-3">No headshot uploaded yet.</p>
                      )}

                      <div className="mb-2">
                        <input
                          id={`team-headshot-${member.clientId}`}
                          className="form-control"
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void uploadHeadshot(index, file);
                            }
                          }}
                        />
                      </div>
                      <UploadMeta
                        pending={member.uploadPending}
                        progress={member.uploadProgress}
                        selection={member.uploadSelection}
                      />
                      {member.uploadMessage ? (
                        <div className={`alert ${member.uploadOk ? "alert-success" : "alert-danger"} mt-3 mb-0`} role="status">
                          {member.uploadMessage}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="col-12 col-lg-8">
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label" htmlFor={`team-name-${member.clientId}`}>
                          {t("vendorDashboard.profileTeam.nameLabel")}
                        </label>
                        <input
                          id={`team-name-${member.clientId}`}
                          className="form-control"
                          value={member.name}
                          onChange={(event) => updateMember(index, "name", event.target.value)}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label" htmlFor={`team-title-${member.clientId}`}>
                          {t("vendorDashboard.profileTeam.titleLabel")}
                        </label>
                        <input
                          id={`team-title-${member.clientId}`}
                          className="form-control"
                          value={member.title}
                          onChange={(event) => updateMember(index, "title", event.target.value)}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label" htmlFor={`team-bio-${member.clientId}`}>
                          {t("vendorDashboard.profileTeam.bioLabel")}
                        </label>
                        <textarea
                          id={`team-bio-${member.clientId}`}
                          className="form-control"
                          rows={3}
                          value={member.bio}
                          onChange={(event) => updateMember(index, "bio", event.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label" htmlFor={`team-response-${member.clientId}`}>
                          {t("vendorDashboard.profileTeam.responseLabel")}
                        </label>
                        <input
                          id={`team-response-${member.clientId}`}
                          className="form-control"
                          value={member.respondsWithinHours}
                          onChange={(event) => updateMember(index, "respondsWithinHours", event.target.value)}
                          placeholder={t("vendorDashboard.profileTeam.responsePlaceholder")}
                        />
                        <div className="form-text">{t("vendorDashboard.profileTeam.responseHelp")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {state.message ? (
        <div className={`alert ${state.ok ? "alert-success" : "alert-danger"} mt-4`} role="status">
          {state.message}
        </div>
      ) : null}

      <button className="btn btn-primary mt-3" disabled={isPending}>
        {isPending ? t("vendorDashboard.profileTeam.saving") : t("vendorDashboard.profileTeam.save")}
      </button>
    </form>
  );
}
