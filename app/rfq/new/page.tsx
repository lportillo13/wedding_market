"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { getShortlist, clearShortlist, removeFromShortlist } from "@/lib/shortlist";
import { createRfqAndInvites, type CreateRfqState } from "./actions";

export default function NewRfqPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [state, action, pending] = useActionState<CreateRfqState, FormData>(createRfqAndInvites, { ok: false });

  useEffect(() => setIds(getShortlist()), []);
  const vendorIdsJson = useMemo(() => JSON.stringify(ids), [ids]);

  return (
    <main className="container py-4" style={{ maxWidth: 920 }}>
      <h1 className="mb-3">Request quotes</h1>

      {ids.length === 0 ? (
        <div className="alert alert-warning">
          Your shortlist is empty. Go to <Link href="/vendors">Vendors</Link> and add some.
        </div>
      ) : (
        <>
          <div className="mb-3">
            <label className="form-label">Vendors selected</label>
            <div className="d-flex flex-wrap gap-2">
              {ids.map((id) => (
                <span key={id} className="badge text-bg-secondary d-inline-flex align-items-center gap-2">
                  {id.slice(0, 8)}…{/* keep it simple for now */}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light"
                    onClick={() => {
                      removeFromShortlist(id);
                      setIds((cur) => cur.filter((x) => x !== id));
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="form-text">Max 10 vendors per RFQ.</div>
          </div>

          <form action={action} className="border rounded p-3 bg-body">
            <input type="hidden" name="vendor_ids_json" value={vendorIdsJson} />

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Event date</label>
                <input className="form-control" type="date" name="event_date" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Guest count</label>
                <input className="form-control" type="number" name="guest_count" min={1} />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">City</label>
                <input className="form-control" name="city" />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">State/Region</label>
                <input className="form-control" name="state" />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Country</label>
                <input className="form-control" name="country" />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Budget min (USD)</label>
                <input className="form-control" type="number" name="budget_min" min={0} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Budget max (USD)</label>
                <input className="form-control" type="number" name="budget_max" min={0} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Language</label>
                <select className="form-select" name="language" defaultValue="en">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Theme (optional)</label>
              <select className="form-select" name="theme" defaultValue="">
                <option value="">—</option>
                <option value="classic">Classic</option>
                <option value="boho">Boho</option>
                <option value="rustic">Rustic</option>
                <option value="beach">Beach</option>
                <option value="garden">Garden</option>
                <option value="modern">Modern</option>
                <option value="vintage">Vintage</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Notes for vendors</label>
              <textarea className="form-control" name="notes" rows={4} />
            </div>

            {!state.ok && state.message && <div className="alert alert-danger">{state.message}</div>}

            <div className="d-flex gap-2">
              <button className="btn btn-primary" disabled={pending}>Send RFQ</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => { clearShortlist(); setIds([]); }}>
                Clear shortlist
              </button>
            </div>
          </form>
        </>
      )}
    </main>
  );
}
