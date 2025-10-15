"use client";

import { FormEvent, useMemo, useState } from "react";

const FIELD_PRESETS: Array<{ key: string; label: string; type?: "textarea" }> = [
  { key: "homepage.hero_title", label: "Homepage hero title" },
  { key: "homepage.hero_subtitle", label: "Homepage hero subtitle", type: "textarea" },
  { key: "homepage.hero_image_url", label: "Homepage hero image URL" },
  { key: "cta.primary_text", label: "Primary CTA text" },
  { key: "cta.primary_url", label: "Primary CTA destination" },
  { key: "about.section_body", label: "About section body", type: "textarea" },
  { key: "footer.contact_email", label: "Footer contact email" },
];

type SettingRow = { key: string; value: string };

type Props = {
  initialSettings: Record<string, string>;
  errorMessage?: string;
};

export default function SiteSettingsPanel({ initialSettings, errorMessage }: Props) {
  const [entries, setEntries] = useState<SettingRow[]>(() => {
    const order = [...FIELD_PRESETS.map((item) => item.key), ...Object.keys(initialSettings)];
    const seen = new Set<string>();
    return order
      .filter((key) => {
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((key) => ({ key, value: initialSettings[key] ?? "" }));
  });

  const [customKey, setCustomKey] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(errorMessage ?? null);

  const presets = useMemo(() => new Map(FIELD_PRESETS.map((item) => [item.key, item])), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);

    const payload = Object.fromEntries(entries.map((entry) => [entry.key, entry.value]));

    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings: payload }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to update site settings");
      }

      setStatus("success");
      setMessage("Site settings updated");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unknown error");
    }
  }

  function handleEntryChange(index: number, value: string) {
    setEntries((rows) => {
      const copy = [...rows];
      copy[index] = { ...copy[index], value };
      return copy;
    });
  }

  function handleCustomKeyAdd() {
    const key = customKey.trim();
    if (!key) return;
    if (entries.some((entry) => entry.key === key)) {
      setMessage(`The key "${key}" already exists.`);
      return;
    }

    setEntries((rows) => [...rows, { key, value: "" }]);
    setCustomKey("");
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 shadow-xl shadow-slate-900/20">
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Content</p>
          <h2 className="text-2xl font-semibold text-white">Site copy & imagery</h2>
        </div>
        <p className="max-w-lg text-sm text-slate-400">
          Update hero text, CTA labels, and other key messaging that appears across the public site. Use full image URLs for
          hero images and media assets.
        </p>
      </header>

      {message && (
        <div
          className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
            status === "error"
              ? "border-rose-500/40 bg-rose-950/60 text-rose-200"
              : status === "success"
                ? "border-emerald-500/30 bg-emerald-950/60 text-emerald-200"
                : "border-slate-700 bg-slate-900/80 text-slate-200"
          }`}
        >
          {message}
        </div>
      )}

      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {entries.map((entry, index) => {
            const preset = presets.get(entry.key);
            const label = preset?.label ?? entry.key;
            const isTextarea = preset?.type === "textarea" || entry.value.split("\n").length > 1;

            return (
              <label key={entry.key} className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">{label}</span>
                {isTextarea ? (
                  <textarea
                    value={entry.value}
                    onChange={(event) => handleEntryChange(index, event.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white shadow-inner shadow-slate-900/40 focus:border-emerald-400 focus:outline-none"
                  />
                ) : (
                  <input
                    value={entry.value}
                    onChange={(event) => handleEntryChange(index, event.target.value)}
                    type="text"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white shadow-inner shadow-slate-900/40 focus:border-emerald-400 focus:outline-none"
                  />
                )}
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{entry.key}</span>
              </label>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Add custom key (e.g. homepage.secondary_image_url)"
              value={customKey}
              onChange={(event) => setCustomKey(event.target.value)}
              className="min-w-[18rem] flex-1 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white shadow-inner shadow-slate-900/40 focus:border-emerald-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCustomKeyAdd}
              className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              Add field
            </button>
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
            disabled={status === "saving"}
          >
            {status === "saving" ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
