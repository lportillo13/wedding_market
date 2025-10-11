// app/rfq/sent/page.tsx
import Link from "next/link";

export default async function SentPage({
  searchParams,
}: {
  searchParams: Promise<{ rfq?: string; count?: string }>;
}) {
  const sp = await searchParams;
  const rfq = sp.rfq ?? "";
  const count = Number(sp.count || 0);

  return (
    <main className="container py-4" style={{ maxWidth: 720 }}>
      <h1>Request sent ✅</h1>
      <p className="lead">We’ve notified {count} vendor(s).</p>
      <div className="alert alert-info">
        Your RFQ ID: <code>{rfq}</code>
      </div>
      <Link className="btn btn-primary me-2" href="/vendors">
        Find more vendors
      </Link>
      {rfq ? (
        <Link className="btn btn-outline-secondary" href={`/account/rfqs/${rfq}`}>
          View this RFQ
        </Link>
      ) : (
        <Link className="btn btn-outline-secondary" href="/rfq/new">
          Send another RFQ
        </Link>
      )}
    </main>
  );
}
