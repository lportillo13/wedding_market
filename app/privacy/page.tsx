import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Wedding Market",
  description: "How Wedding Market collects, uses, and protects user data.",
};

export default function PrivacyPage() {
  return (
    <main className="container py-5">
      <div className="mx-auto" style={{ maxWidth: 880 }}>
        <p className="text-uppercase text-muted fw-semibold small mb-2">Privacy</p>
        <h1 className="mb-3">Privacy Policy</h1>
        <p className="text-muted">Last updated: June 15, 2026</p>

        <p>
          Wedding Market helps couples discover wedding vendors, request quotes, save favorites, manage messages, and manage vendor profiles.
          This policy explains the data we collect and how we use it across the website and mobile app.
        </p>

        <h2 className="h4 mt-4">Data We Collect</h2>
        <p>Depending on how you use Wedding Market, we may collect:</p>
        <ul>
          <li>Account details such as name, email address, password authentication data, preferred language, and role.</li>
          <li>Profile details such as phone number, country, wedding date, guest count, budget, and wedding style.</li>
          <li>Vendor profile details such as business name, services, pricing, availability, team details, contact details, and media uploads.</li>
          <li>Quote request and message content between couples and vendors.</li>
          <li>Saved vendors, reviews, notifications, and push notification tokens.</li>
          <li>Uploaded images or videos you choose to provide.</li>
          <li>Technical data such as device, browser, app version, logs, and security events needed to operate and protect the service.</li>
        </ul>

        <h2 className="h4 mt-4">How We Use Data</h2>
        <ul>
          <li>To create and manage accounts.</li>
          <li>To show vendor listings and vendor profiles.</li>
          <li>To send quote requests, replies, notifications, and service messages.</li>
          <li>To let vendors manage profile content, pricing, availability, and media.</li>
          <li>To prevent abuse, debug issues, secure accounts, and comply with legal obligations.</li>
          <li>To improve product quality and user experience.</li>
        </ul>

        <h2 className="h4 mt-4">Service Providers</h2>
        <p>
          We use service providers to operate Wedding Market, including Supabase for authentication and database services, Cloudflare R2
          or compatible object storage for media, Expo services for mobile push notifications, and payment or communication providers when
          those features are enabled. These providers process data on our behalf to deliver the service.
        </p>

        <h2 className="h4 mt-4">Your Choices</h2>
        <ul>
          <li>You can update profile information from your account settings.</li>
          <li>You can decline or disable push notifications in your device settings.</li>
          <li>You can request account and associated data deletion from our <Link href="/account-deletion">account deletion page</Link>.</li>
        </ul>

        <h2 className="h4 mt-4">Data Retention</h2>
        <p>
          We keep account, request, vendor, and message data while your account is active or as needed to provide the service. We may retain
          limited records when required for security, fraud prevention, dispute handling, backups, or legal compliance.
        </p>

        <h2 className="h4 mt-4">Contact</h2>
        <p>
          For privacy questions or deletion requests, contact <a href="mailto:hello@weddingmarket.com">hello@weddingmarket.com</a>.
        </p>
      </div>
    </main>
  );
}
