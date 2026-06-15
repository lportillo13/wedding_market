import Link from "next/link";

export const metadata = {
  title: "Terms | Wedding Market",
  description: "Terms for using Wedding Market.",
};

export default function TermsPage() {
  return (
    <main className="container py-5">
      <div className="mx-auto" style={{ maxWidth: 880 }}>
        <p className="text-uppercase text-muted fw-semibold small mb-2">Terms</p>
        <h1 className="mb-3">Terms of Service</h1>
        <p className="text-muted">Last updated: June 15, 2026</p>

        <p>
          These terms govern your use of Wedding Market. By using the website or mobile app, you agree to use the service responsibly and
          only for lawful wedding planning, vendor discovery, vendor profile management, quote requests, and related communication.
        </p>

        <h2 className="h4 mt-4">Accounts</h2>
        <p>
          You are responsible for the information you provide and for keeping your login credentials secure. You must not impersonate
          another person or business, submit misleading vendor information, or use the service to send spam or abusive messages.
        </p>

        <h2 className="h4 mt-4">Vendor Content</h2>
        <p>
          Vendors are responsible for profile details, prices, availability, images, reviews content they submit, and any offers or quotes
          sent through Wedding Market. Wedding Market may remove content that appears inaccurate, unlawful, abusive, or harmful to users.
        </p>

        <h2 className="h4 mt-4">Quotes and Bookings</h2>
        <p>
          Wedding Market helps users exchange quote requests and messages. Unless explicitly stated otherwise in a signed agreement,
          bookings, payments, contracts, cancellations, and services are handled directly between couples and vendors.
        </p>

        <h2 className="h4 mt-4">Acceptable Use</h2>
        <ul>
          <li>Do not upload unlawful, infringing, deceptive, explicit, or abusive content.</li>
          <li>Do not scrape, reverse engineer, overload, or interfere with the service.</li>
          <li>Do not use Wedding Market to harass users or misrepresent a business.</li>
        </ul>

        <h2 className="h4 mt-4">Privacy and Deletion</h2>
        <p>
          Our <Link href="/privacy">Privacy Policy</Link> explains how we handle data. You can request account deletion from the{" "}
          <Link href="/account-deletion">account deletion page</Link>.
        </p>

        <h2 className="h4 mt-4">Contact</h2>
        <p>
          Questions about these terms can be sent to <a href="mailto:hello@weddingmarket.com">hello@weddingmarket.com</a>.
        </p>
      </div>
    </main>
  );
}
