import Link from "next/link";
import { fillTemplate } from "@/lib/i18n";
import { getRequestI18n } from "@/lib/i18n/server";

export default async function SentPage({
  searchParams,
}: {
  searchParams: Promise<{ rfq?: string; count?: string }>;
}) {
  const params = await searchParams;
  const { dictionary } = await getRequestI18n();
  const labels = dictionary.rfq.sentPage;
  const rfq = params.rfq ?? "";
  const count = Number(params.count || 0);

  return (
    <main className="container py-4" style={{ maxWidth: 720 }}>
      <h1>{labels.title}</h1>
      <p className="lead">{fillTemplate(labels.lead, { count })}</p>
      <div className="alert alert-info">
        {labels.requestIdLabel} <code>{rfq}</code>
      </div>
      <Link className="btn btn-primary me-2" href="/vendors">
        {labels.findMoreVendors}
      </Link>
      {rfq ? (
        <Link className="btn btn-outline-secondary" href={`/account/rfqs/${rfq}`}>
          {labels.viewRequest}
        </Link>
      ) : (
        <Link className="btn btn-outline-secondary" href="/rfq/new">
          {labels.sendAnother}
        </Link>
      )}
    </main>
  );
}
