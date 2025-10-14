"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supportedLanguages, type SupportedLanguage } from "@/lib/i18n";
import {
  PROFILE_TRANSLATION_FIELDS,
  type ProfileTranslationsByField,
  type ProfileTranslatableField,
} from "./translationConfig";
import {
  saveProfileTranslations,
  autoTranslateProfileField,
  type SaveFieldTranslationsState,
} from "./actions";

const initialSaveState: SaveFieldTranslationsState = { ok: false, message: "" };

type ProfileTranslationsFormProps = {
  initialTranslations: ProfileTranslationsByField;
  defaultLanguage: SupportedLanguage;
};

type TranslationFieldEditorProps = {
  field: ProfileTranslatableField;
  label: string;
  help?: string;
  defaultLanguage: SupportedLanguage;
  initialValues: Partial<Record<SupportedLanguage, string>>;
  languageHeadings: Record<SupportedLanguage, string>;
  translateFromLabel: Record<SupportedLanguage, string>;
  aiLabels: {
    translating: string;
    success: string;
    error: string;
    notConfigured: string;
    emptySource: string;
  };
  saveLabels: { label: string; saving: string; success: string };
  defaultBadge: string;
  languageNames: Record<SupportedLanguage, string>;
};

type AiStatus = { type: "idle" | "success" | "error"; message: string };

type ActiveTranslation = { target: SupportedLanguage | null; source: SupportedLanguage | null };

function normalizeInitialValues(initial: Partial<Record<SupportedLanguage, string>>) {
  const base: Record<SupportedLanguage, string> = {} as Record<SupportedLanguage, string>;
  for (const language of supportedLanguages) {
    base[language] = initial[language] ?? "";
  }
  return base;
}

function TranslationFieldEditor({
  field,
  label,
  help,
  defaultLanguage,
  initialValues,
  languageHeadings,
  translateFromLabel,
  aiLabels,
  saveLabels,
  defaultBadge,
  languageNames,
}: TranslationFieldEditorProps) {
  const boundAction = useMemo(() => saveProfileTranslations.bind(null, field), [field]);
  const [state, formAction, pending] = useActionState(boundAction, initialSaveState);
  const normalizedInitial = useMemo(() => normalizeInitialValues(initialValues), [initialValues]);
  const [values, setValues] = useState<Record<SupportedLanguage, string>>(normalizedInitial);
  const [aiStatus, setAiStatus] = useState<AiStatus>({ type: "idle", message: "" });
  const [isTranslating, startTranslation] = useTransition();
  const [activeTranslation, setActiveTranslation] = useState<ActiveTranslation>({ target: null, source: null });

  useEffect(() => {
    setValues(normalizedInitial);
  }, [normalizedInitial]);

  useEffect(() => {
    if (!state.translations) {
      return;
    }

    setValues((prev) => {
      const next = { ...prev };
      for (const language of supportedLanguages) {
        const updated = state.translations?.[language];
        if (typeof updated === "string") {
          next[language] = updated;
        }
      }
      return next;
    });
  }, [state.translations]);

  useEffect(() => {
    if (state.ok || state.message) {
      setAiStatus({ type: "idle", message: "" });
    }
  }, [state.ok, state.message]);

  function handleInputChange(language: SupportedLanguage, value: string) {
    setValues((prev) => ({ ...prev, [language]: value }));
  }

  function handleTranslate(targetLanguage: SupportedLanguage, sourceLanguage: SupportedLanguage) {
    const sourceValue = values[sourceLanguage] ?? "";
    if (!sourceValue.trim()) {
      setAiStatus({ type: "error", message: aiLabels.emptySource });
      return;
    }
    setActiveTranslation({ target: targetLanguage, source: sourceLanguage });
    setAiStatus({ type: "idle", message: "" });

    startTranslation(async () => {
      try {
        const result = await autoTranslateProfileField({
          field,
          sourceLanguage,
          targetLanguage,
          sourceText: sourceValue,
        });

        if (result.ok) {
          setValues((prev) => ({
            ...prev,
            ...(result.translations ?? {}),
          }));

          const languageLabel = languageNames[targetLanguage] ?? targetLanguage.toUpperCase();
          setAiStatus({
            type: "success",
            message: aiLabels.success.replace("{language}", languageLabel),
          });
        } else {
          let message = result.message;
          switch (result.errorCode) {
            case "not_configured":
              message = aiLabels.notConfigured;
              break;
            case "empty_source":
              message = aiLabels.emptySource;
              break;
            case "validation":
              message = result.message;
              break;
            default:
              message = aiLabels.error;
          }
          setAiStatus({ type: "error", message });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setAiStatus({ type: "error", message: message || aiLabels.error });
      } finally {
        setActiveTranslation({ target: null, source: null });
      }
    });
  }

  const manualMessage = state.ok ? saveLabels.success : state.message;
  const manualMessageType = state.ok ? "success" : "error";

  return (
    <section aria-labelledby={`profile-translation-${field}`} className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h3 id={`profile-translation-${field}`} className="h6 mb-1">
              {label}
            </h3>
            {help ? <p className="text-muted small mb-0">{help}</p> : null}
          </div>
        </div>

        <form
          action={formAction}
          onSubmit={() => setAiStatus({ type: "idle", message: "" })}
          className="vstack gap-3"
        >
          {supportedLanguages.map((language) => {
            const error = state.fieldErrors?.[language];
            const otherLanguages = supportedLanguages.filter((option) => option !== language);
            const isDefault = language === defaultLanguage;

            return (
              <div key={language}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <label className="form-label mb-0" htmlFor={`${field}-${language}`}>
                    {languageHeadings[language] ?? languageNames[language] ?? language.toUpperCase()}
                  </label>
                  {isDefault ? <span className="badge text-bg-primary">{defaultBadge}</span> : null}
                </div>
                <div className="d-flex flex-column flex-lg-row gap-2">
                  <textarea
                    id={`${field}-${language}`}
                    name={`value_${language}`}
                    className={`form-control${error ? " is-invalid" : ""}`}
                    rows={language === defaultLanguage ? 2 : 3}
                    value={values[language] ?? ""}
                    onChange={(event) => handleInputChange(language, event.target.value)}
                  />
                  {otherLanguages.length ? (
                    <div className="d-flex flex-column gap-2">
                      {otherLanguages.map((source) => {
                        const disabled =
                          !values[source]?.trim() ||
                          (isTranslating &&
                            activeTranslation.target === language &&
                            activeTranslation.source === source);
                        const template = translateFromLabel[source];
                        const buttonLabel =
                          isTranslating &&
                          activeTranslation.target === language &&
                          activeTranslation.source === source
                            ? aiLabels.translating
                            : (template ?? `Translate from {language}`).replace(
                                "{language}",
                                languageNames[source] ?? source.toUpperCase()
                              );
                        return (
                          <button
                            key={source}
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleTranslate(language, source)}
                            disabled={Boolean(disabled)}
                          >
                            {buttonLabel}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                {error ? <div className="invalid-feedback d-block">{error}</div> : null}
              </div>
            );
          })}

          {manualMessage ? (
            <div className={`alert alert-${manualMessageType}`}>{manualMessage}</div>
          ) : null}

          {aiStatus.type !== "idle" ? (
            <div className={`alert alert-${aiStatus.type === "success" ? "success" : "danger"}`}>
              {aiStatus.message}
            </div>
          ) : null}

          <div className="d-flex justify-content-end">
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? saveLabels.saving : saveLabels.label}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default function ProfileTranslationsForm({
  initialTranslations,
  defaultLanguage,
}: ProfileTranslationsFormProps) {
  const { dictionary } = useLanguage();
  const labels = dictionary.account.profile.translations;
  const languageNames = supportedLanguages.reduce((acc, language) => {
    switch (language) {
      case "en":
        acc[language] = dictionary.languageSelector.english;
        break;
      case "es":
        acc[language] = dictionary.languageSelector.spanish;
        break;
      default:
        acc[language as SupportedLanguage] = (language as string).toUpperCase();
        break;
    }
    return acc;
  }, {} as Record<SupportedLanguage, string>);

  return (
    <section className="mt-5" aria-labelledby="profile-translation-heading">
      <h2 id="profile-translation-heading" className="h5 mb-2">
        {labels.heading}
      </h2>
      <p className="text-muted">{labels.intro}</p>
      <div className="vstack gap-4">
        {PROFILE_TRANSLATION_FIELDS.map((field) => {
          const fieldLabels = labels.fields[field];
          return (
            <TranslationFieldEditor
              key={field}
              field={field}
              label={fieldLabels.label}
              help={fieldLabels.help}
              defaultLanguage={defaultLanguage}
              initialValues={initialTranslations[field]}
              languageHeadings={labels.languageHeadings}
              translateFromLabel={labels.ai.translateFrom}
              aiLabels={labels.ai}
              saveLabels={labels.save}
              defaultBadge={labels.defaultBadge}
              languageNames={languageNames}
            />
          );
        })}
      </div>
    </section>
  );
}
