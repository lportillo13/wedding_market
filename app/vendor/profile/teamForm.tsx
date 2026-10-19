"use client";

import { useProfileAction } from "./useProfileAction";
import ProfileSaveBar from "./ProfileSaveBar";

import Image from "next/image";
import { useMemo, useState, useId } from "react";
import { useTranslation, useLanguage } from "@/contexts/LanguageContext";
import { uploadWithProgress } from "@/lib/client/uploads";
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from "@/lib/media-url";
import { saveTeam, type FormMessageState } from "./actions";

type TeamMemberInitial = {
  name: string;
  title: string;
  titleEs?: string;
  bio: string;
  bioEs?: string;
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

function createMember(
  from?: TeamMemberInitial,
  stableId?: string,
): TeamMemberState {
  const randomId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return {
    clientId: stableId ?? randomId,
    name: from?.name ?? "",
    title: from?.title ?? "",
    titleEs: from?.titleEs ?? "",
    bio: from?.bio ?? "",
    bioEs: from?.bioEs ?? "",
    headshotUrl: from?.headshotUrl ?? "",
    respondsWithinHours: from?.respondsWithinHours ?? "",
    uploadPending: false,
    uploadProgress: 0,
    uploadSelection: [],
    uploadMessage: "",
    uploadOk: false,
  };
}

function ProgressBar({
  pending,
  progress,
}: {
  pending: boolean;
  progress: number;
}) {
  if (!pending && progress <= 0) return null;
  return (
    <div className="mt-2">
      <div
        className="progress"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="progress-bar progress-bar-striped progress-bar-animated"
          style={{ width: `${progress}%` }}
        >
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
            {pending
              ? "Uploading headshot"
              : `Selected ${selection.length} file${selection.length === 1 ? "" : "s"}`}
          </div>
          {selection.length > 0 ? (
            <div className="small text-secondary text-truncate">
              {selection.join(", ")}
            </div>
          ) : null}
        </div>
        <div className="wm-vendor-media-status__badge">{progress}%</div>
      </div>
      <ProgressBar pending={pending || progress > 0} progress={progress} />
    </div>
  );
}

export default function TeamForm({ initial }: TeamFormProps) {
  const [state, formAction, isPending] = useProfileAction(
    saveTeam,
    initialState,
  );
  const formId = useId();
  const [removed, setRemoved] = useState<{
    member: TeamMemberState;
    index: number;
  } | null>(null);
  const { language } = useLanguage();
  const es = language === "es";
  const [members, setMembers] = useState<TeamMemberState[]>(
    initial.map((member, index) => createMember(member, `${formId}-${index}`)),
  );
  const t = useTranslation();

  function updateMember(
    index: number,
    field: keyof TeamMemberInitial,
    value: string,
  ) {
    setMembers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function patchMember(clientId: string, patch: Partial<TeamMemberState>) {
    setMembers((prev) =>
      prev.map((member) =>
        member.clientId === clientId ? { ...member, ...patch } : member,
      ),
    );
  }

  function addMember() {
    const member = createMember();
    setMembers((prev) => [...prev, member]);
    requestAnimationFrame(() =>
      document.getElementById(`team-name-${member.clientId}`)?.focus(),
    );
  }

  function removeMember(index: number) {
    setRemoved({ member: members[index], index });
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

  async function uploadHeadshot(clientId: string, file: File) {
    try {
      patchMember(clientId, {
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
        (progress) => patchMember(clientId, { uploadProgress: progress }),
      );

      patchMember(clientId, {
        headshotUrl: response.asset?.url ?? "",
        uploadPending: false,
        uploadProgress: 0,
        uploadSelection: [],
        uploadMessage: es
          ? "Foto subida. Guarda para añadirla al perfil."
          : "Photo uploaded. Save to add it to your profile.",
        uploadOk: true,
      });
    } catch (error) {
      patchMember(clientId, {
        uploadPending: false,
        uploadProgress: 0,
        uploadMessage:
          error instanceof Error ? error.message : "Upload failed.",
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
          titleEs: member.titleEs,
          bio: member.bio,
          bioEs: member.bioEs,
          headshotUrl: member.headshotUrl,
          respondsWithinHours: member.respondsWithinHours,
        })),
      ),
    [members],
  );

  return (
    <form action={formAction} data-profile-save>
      <input type="hidden" name="team" value={payload} />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h5 mb-0">{t("vendorDashboard.profileTeam.heading")}</h3>
        <button
          type="button"
          data-profile-change
          className="btn btn-outline-primary"
          disabled={members.length >= 50}
          onClick={addMember}
        >
          {t("vendorDashboard.profileTeam.add")}
        </button>
      </div>

      {removed ? (
        <div className="wm-profile-undo" role="status">
          {es
            ? "Persona retirada del borrador."
            : "Person removed from this draft."}{" "}
          <button
            type="button"
            data-profile-change
            onClick={() => {
              setMembers((current) => {
                const next = [...current];
                next.splice(removed.index, 0, removed.member);
                return next;
              });
              setRemoved(null);
            }}
          >
            {es ? "Deshacer" : "Undo"}
          </button>
        </div>
      ) : null}
      {members.length === 0 ? (
        <div className="wm-profile-empty">
          <span aria-hidden="true">＋</span>
          <h4>
            {es
              ? "Las personas detrás de tu negocio"
              : "The people behind your business"}
          </h4>
          <p>{t("vendorDashboard.profileTeam.empty")}</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {members.map((member, index) => (
            <div className="card" key={member.clientId}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h4 className="h6 mb-0">
                    {t("vendorDashboard.profileTeam.memberTitle").replace(
                      "{index}",
                      String(index + 1),
                    )}
                  </h4>
                  <div
                    className="btn-group"
                    role="group"
                    aria-label={es ? "Ordenar persona" : "Reorder team member"}
                  >
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      data-profile-change
                      aria-label={es ? "Mover hacia arriba" : "Move up"}
                      onClick={() => moveMember(index, -1)}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      data-profile-change
                      aria-label={es ? "Mover hacia abajo" : "Move down"}
                      onClick={() => moveMember(index, 1)}
                      disabled={index === members.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      data-profile-change
                      disabled={member.uploadPending}
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
                          <h5 className="h6 mb-1">
                            {es ? "Foto de la persona" : "Team photo"}
                          </h5>
                          <p className="small text-muted mb-0">
                            {es
                              ? "Elige una foto de esta persona desde tu dispositivo."
                              : "Choose a photo of this person from your device."}
                          </p>
                        </div>
                      </div>

                      {member.headshotUrl ? (
                        <div className="wm-vendor-media-preview wm-vendor-media-preview--thumb mb-3">
                          <Image
                            src={resolveMediaUrl(member.headshotUrl)}
                            alt={member.name || "Team member"}
                            width={180}
                            height={180}
                            unoptimized={shouldRenderUnoptimizedMedia(
                              member.headshotUrl,
                            )}
                            className="rounded"
                            style={{ maxWidth: "180px", height: "auto" }}
                          />
                        </div>
                      ) : (
                        <p className="text-muted small mb-3">
                          {es
                            ? "Aún no hay foto. Añadir una es opcional."
                            : "No photo yet. Adding one is optional."}
                        </p>
                      )}

                      <div className="mb-2">
                        <input
                          aria-label={
                            es ? "Foto de la persona" : "Team member photo"
                          }
                          disabled={member.uploadPending}
                          id={`team-headshot-${member.clientId}`}
                          className="form-control"
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void uploadHeadshot(member.clientId, file);
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
                        <div
                          className={`alert ${member.uploadOk ? "alert-success" : "alert-danger"} mt-3 mb-0`}
                          role="status"
                        >
                          {member.uploadMessage}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="col-12 col-lg-8">
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label
                          className="form-label"
                          htmlFor={`team-name-${member.clientId}`}
                        >
                          {t("vendorDashboard.profileTeam.nameLabel")}
                        </label>
                        <input
                          id={`team-name-${member.clientId}`}
                          className="form-control"
                          value={member.name}
                          onChange={(event) =>
                            updateMember(index, "name", event.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label
                          className="form-label"
                          htmlFor={`team-title-${member.clientId}`}
                        >
                          {t("vendorDashboard.profileTeam.titleLabel")} ·{" "}
                          {es ? "Inglés" : "English"}
                        </label>
                        <input
                          id={`team-title-${member.clientId}`}
                          className="form-control"
                          value={member.title}
                          onChange={(event) =>
                            updateMember(index, "title", event.target.value)
                          }
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label
                          className="form-label"
                          htmlFor={`team-title-es-${member.clientId}`}
                        >
                          {es ? "Cargo · Español" : "Role · Spanish"}
                        </label>
                        <input
                          id={`team-title-es-${member.clientId}`}
                          className="form-control"
                          value={member.titleEs ?? ""}
                          onChange={(event) =>
                            updateMember(index, "titleEs", event.target.value)
                          }
                        />
                      </div>
                      <div className="col-12">
                        <label
                          className="form-label"
                          htmlFor={`team-bio-${member.clientId}`}
                        >
                          {t("vendorDashboard.profileTeam.bioLabel")} ·{" "}
                          {es ? "Inglés" : "English"}
                        </label>
                        <textarea
                          id={`team-bio-${member.clientId}`}
                          className="form-control"
                          rows={3}
                          value={member.bio}
                          onChange={(event) =>
                            updateMember(index, "bio", event.target.value)
                          }
                        />
                      </div>
                      <div className="col-12">
                        <label
                          className="form-label"
                          htmlFor={`team-bio-es-${member.clientId}`}
                        >
                          {es ? "Biografía · Español" : "Bio · Spanish"}
                        </label>
                        <textarea
                          id={`team-bio-es-${member.clientId}`}
                          rows={3}
                          className="form-control"
                          value={member.bioEs ?? ""}
                          onChange={(event) =>
                            updateMember(index, "bioEs", event.target.value)
                          }
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label
                          className="form-label"
                          htmlFor={`team-response-${member.clientId}`}
                        >
                          {t("vendorDashboard.profileTeam.responseLabel")}
                        </label>
                        <input
                          id={`team-response-${member.clientId}`}
                          className="form-control"
                          value={member.respondsWithinHours}
                          onChange={(event) =>
                            updateMember(
                              index,
                              "respondsWithinHours",
                              event.target.value,
                            )
                          }
                          placeholder={t(
                            "vendorDashboard.profileTeam.responsePlaceholder",
                          )}
                        />
                        <div className="form-text">
                          {t("vendorDashboard.profileTeam.responseHelp")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProfileSaveBar
        state={state}
        pending={isPending}
        disabled={members.some((member) => member.uploadPending)}
        label={t("vendorDashboard.profileTeam.save")}
      />
    </form>
  );
}
