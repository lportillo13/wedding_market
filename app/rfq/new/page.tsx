"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { getShortlist, clearShortlist, removeFromShortlist } from "@/lib/shortlist";
import { createRfqAndInvites, type CreateRfqState } from "./actions";

export default function NewRfqPage() {
  const [ids, setIds] = useState<string[]>(() => (typeof window !== "undefined" ? getShortlist() : []));
  const [state, action, pending] = useActionState<CreateRfqState, FormData>(createRfqAndInvites, { ok: false });
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
            <p className="form-label">Vendors selected</p>
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
                <label className="form-label" htmlFor="rfq-event-date">Event date</label>
                <input id="rfq-event-date" className="form-control" type="date" name="event_date" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="rfq-guest-count">Guest count</label>
                <input id="rfq-guest-count" className="form-control" type="number" name="guest_count" min={1} />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label" htmlFor="rfq-city">City</label>
                <input id="rfq-city" className="form-control" name="city" />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label" htmlFor="rfq-state">State/Region</label>
                <input id="rfq-state" className="form-control" name="state" />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label" htmlFor="rfq-country">Country</label>
                <input id="rfq-country" className="form-control" name="country" />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label" htmlFor="rfq-budget-min">Budget min (USD)</label>
                <input id="rfq-budget-min" className="form-control" type="number" name="budget_min" min={0} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label" htmlFor="rfq-budget-max">Budget max (USD)</label>
                <input id="rfq-budget-max" className="form-control" type="number" name="budget_max" min={0} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label" htmlFor="rfq-language">Language</label>
                <select id="rfq-language" className="form-select" name="language" defaultValue="en">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="rfq-theme">Theme (optional)</label>
              <select id="rfq-theme" className="form-select" name="theme" defaultValue="">
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
              <label className="form-label" htmlFor="rfq-notes">Notes for vendors</label>
              <textarea id="rfq-notes" className="form-control" name="notes" rows={4} />
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
