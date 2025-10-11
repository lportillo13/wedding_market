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
            <label className="form-label" htmlFor="shortlist-event-date">Event date</label>
            <input id="shortlist-event-date" name="event_date" type="date" className="form-control" />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="shortlist-guest-count">Guest count</label>
            <input id="shortlist-guest-count" name="guest_count" type="number" min={1} className="form-control" />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="shortlist-language">Language</label>
            <select id="shortlist-language" name="language" className="form-select" defaultValue="en">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>

        <div className="row">
          <div className="col-md-4">
            <label className="form-label" htmlFor="shortlist-city">City</label>
            <input id="shortlist-city" name="city" className="form-control" />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="shortlist-state">State</label>
            <input id="shortlist-state" name="state" className="form-control" />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="shortlist-country">Country</label>
            <input id="shortlist-country" name="country" className="form-control" defaultValue="US" />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <label className="form-label" htmlFor="shortlist-budget-min">Budget min</label>
            <input id="shortlist-budget-min" name="budget_min" type="number" min={0} className="form-control" />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="shortlist-budget-max">Budget max</label>
            <input id="shortlist-budget-max" name="budget_max" type="number" min={0} className="form-control" />
          </div>
        </div>

        {/* 👇 The two fields you asked about */}
        <div>
          <label className="form-label" htmlFor="shortlist-contact-email">Your email</label>
          <input id="shortlist-contact-email" name="contact_email" type="email" className="form-control" />
        </div>
        <div>
          <label className="form-label" htmlFor="shortlist-contact-phone">Your phone (optional)</label>
          <input id="shortlist-contact-phone" name="contact_phone" type="tel" className="form-control" placeholder="+1 555 555 5555" />
        </div>

        <div>
          <label className="form-label" htmlFor="shortlist-notes">Notes</label>
          <textarea id="shortlist-notes" name="notes" className="form-control" rows={4} placeholder="Tell vendors what you need…" />
        </div>

        <button className="btn btn-primary align-self-start">Send request</button>
      </form>
    </main>
  );
}
