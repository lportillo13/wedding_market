import Link from "next/link";

export const metadata = {
  title: "Account Deletion | Wedding Market",
  description: "Request deletion of your Wedding Market account and associated data.",
};

const deletionMailto =
  "mailto:hello@weddingmarket.com?subject=Wedding%20Market%20account%20deletion%20request&body=Please%20delete%20my%20Wedding%20Market%20account%20and%20associated%20data.%0A%0AAccount%20email%3A%20%0AFull%20name%3A%20%0AAdditional%20details%3A%20";

export default function AccountDeletionPage() {
  return (
    <main className="container py-5">
      <div className="mx-auto" style={{ maxWidth: 880 }}>
        <p className="text-uppercase text-muted fw-semibold small mb-2">Account controls</p>
        <h1 className="mb-3">Request Account Deletion</h1>
        <p>
          Wedding Market users can request deletion of their account and associated data from this page. This applies to accounts created
          in the Wedding Market website or mobile app.
        </p>

        <div className="border rounded-3 p-4 my-4">
          <h2 className="h4">How to request deletion</h2>
          <ol>
            <li>Use the button below to email us from the address connected to your Wedding Market account.</li>
            <li>Include your account email and full name.</li>
            <li>If you have a vendor profile, include the business name so we can identify it correctly.</li>
          </ol>
          <a className="btn btn-dark" href={deletionMailto}>
            Email deletion request
          </a>
        </div>

        <h2 className="h4 mt-4">What We Delete</h2>
        <p>
          We delete or anonymize account profile data, saved vendors, quote requests, messages, notification tokens, uploaded profile media,
          and vendor profile data associated with the account where deletion is permitted.
        </p>

        <h2 className="h4 mt-4">What May Be Retained</h2>
        <p>
          We may retain limited records when needed for security, fraud prevention, dispute handling, backup recovery, tax, accounting, or
          legal compliance. If retention is required, we will limit retained data to what is necessary.
        </p>

        <h2 className="h4 mt-4">Timing</h2>
        <p>
          We aim to confirm deletion requests within a reasonable period after verifying account ownership. Some backup copies may take
          additional time to expire.
        </p>

        <p className="mt-4">
          You can also review our <Link href="/privacy">Privacy Policy</Link> for more information about data handling.
        </p>
      </div>
    </main>
  );
}
