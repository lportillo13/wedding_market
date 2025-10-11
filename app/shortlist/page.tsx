// app/shortlist/page.tsx
import { submitShortlistRfq } from "./actions";
import ShortlistHiddenVendors from "@/components/ShortlistHiddenVendors";

export default function ShortlistRequestPage() {
  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <h1 className="mb-3">Request quotes</h1>

      <form action={submitShortlistRfq} className="vstack gap-3">
        {/* Hidden field gets filled on the client from localStorage */}
        <ShortlistHiddenVendors />

        <div className="row">
          <div className="col-md-4">
            <label className="form-label">Event date</label>
            <input name="event_date" type="date" className="form-control" />
          </div>
          <div className="col-md-4">
            <label className="form-label">Guest count</label>
            <input name="guest_count" type="number" min={1} className="form-control" />
          </div>
          <div className="col-md-4">
            <label className="form-label">Language</label>
            <select name="language" className="form-select" defaultValue="en">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>

        <div className="row">
          <div className="col-md-4">
            <label className="form-label">City</label>
            <input name="city" className="form-control" />
          </div>
          <div className="col-md-4">
            <label className="form-label">State</label>
            <input name="state" className="form-control" />
          </div>
          <div className="col-md-4">
            <label className="form-label">Country</label>
            <input name="country" className="form-control" defaultValue="US" />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <label className="form-label">Budget min</label>
            <input name="budget_min" type="number" min={0} className="form-control" />
          </div>
          <div className="col-md-6">
            <label className="form-label">Budget max</label>
            <input name="budget_max" type="number" min={0} className="form-control" />
          </div>
        </div>

        {/* 👇 The two fields you asked about */}
        <div>
          <label className="form-label">Your email</label>
          <input name="contact_email" type="email" className="form-control" />
        </div>
        <div>
          <label className="form-label">Your phone (optional)</label>
          <input name="contact_phone" type="tel" className="form-control" placeholder="+1 555 555 5555" />
        </div>

        <div>
          <label className="form-label">Notes</label>
          <textarea name="notes" className="form-control" rows={4} placeholder="Tell vendors what you need…" />
        </div>

        <button className="btn btn-primary align-self-start">Send request</button>
      </form>
    </main>
  );
}
