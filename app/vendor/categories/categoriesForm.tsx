"use client";

import { useState, FormEvent } from "react";
import { saveCategories } from "../_actions";

type CategoryLabel = { en?: string | null } | null | undefined;
type Cat = { key: string; label?: CategoryLabel };

export default function CategoriesForm({ allCats, selected }: { allCats: Cat[]; selected: string[] }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const fd = new FormData(e.currentTarget);
      await saveCategories(fd);
      setMsg("Saved!");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-3">
        <div className="form-text mb-2">Choose all that apply</div>
        <div className="row">
          {allCats.map((c) => {
            const localized = typeof c.label === "object" && c.label ? c.label.en : undefined;
            const label = localized ?? c.key;
            const id = `cat-${c.key}`;
            return (
              <div className="col-md-6 mb-2" key={c.key}>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={id}
                    name="categories"
                    value={c.key}
                    defaultChecked={selected.includes(c.key)}
                  />
                  <label className="form-check-label" htmlFor={id}>{label}</label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "Saving..." : "Save categories"}
      </button>
      {msg && <div className="alert alert-success mt-3">{msg}</div>}
      {err && <div className="alert alert-danger mt-3">{err}</div>}
    </form>
  );
}
