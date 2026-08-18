import Link from "next/link";
import AcceptButton from "@/app/account/rfqs/[id]/AcceptButton";
import { markAccountInboxThreadRead } from "@/app/account/inbox/actions";
import { sendClientQuoteReply } from "@/app/quote-replies/actions";
import ThreadReadSync from "@/components/inbox/ThreadReadSync";
import ThreadTimeline from "@/components/inbox/ThreadTimeline";
import InquirySummary from "@/components/inbox/InquirySummary";
import QuoteReplyForm from "@/components/quotes/QuoteReplyForm";
import { getLanguageLocale } from "@/lib/i18n";
import { getRequestI18n } from "@/lib/i18n/server";
import { loadClientThreadDetail } from "@/lib/inbox";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatAmount(amountCents: number | null, currency: string | null, locale: string) {
  if (typeof amountCents !== "number") {
    return currency ?? "—";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency ?? "USD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export default async function AccountInboxThreadPage({
  params,
}: {
  params: Promise<{ threadKey: string }>;
}) {
  const { threadKey } = await params;
  const { dictionary, language } = await getRequestI18n();
  const locale = getLanguageLocale(language);
  const labels = {
    title: language === "es" ? "Bandeja de entrada" : "Inbox",
    back: language === "es" ? "Volver a la bandeja" : "Back to inbox",
    loginRequired: language === "es" ? "Inicia sesion para ver tu bandeja." : "Log in to view your inbox.",
    loginAction: language === "es" ? "Iniciar sesion" : "Log in",
    notFound: language === "es" ? "No pudimos encontrar ese hilo." : "We could not find that thread.",
    inquirySummary: language === "es" ? "Resumen de la solicitud" : "Inquiry summary",
    latestProposal: language === "es" ? "Ultima propuesta" : "Latest proposal",
    noProposal: language === "es" ? "Este proveedor aun no ha enviado una propuesta." : "This vendor has not sent a proposal yet.",
    timeline: language === "es" ? "Actividad" : "Activity",
    dateTbd: dictionary.account.rfqsPage.dateTbd,
    guestCountTbd: dictionary.account.rfqsPage.guestCountTbd,
    proposalLabel: language === "es" ? "Propuesta enviada" : "Proposal sent",
    proposalUpdatedLabel: language === "es" ? "Propuesta actualizada" : "Proposal updated",
    timelineEmpty: language === "es" ? "Aun no hay actividad en este hilo." : "There is no activity in this thread yet.",
    accepted: dictionary.account.rfqsPage.acceptedBadge,
  };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="container py-4">
        <h1 className="mb-3">{labels.title}</h1>
        <div className="alert alert-warning">{labels.loginRequired}</div>
        <Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(`/account/inbox/${threadKey}`)}`}>
          {labels.loginAction}
        </Link>
      </main>
    );
  }

  const decodedThreadKey = decodeURIComponent(threadKey);
  const detail = await loadClientThreadDetail(user.id, decodedThreadKey);

  if (!detail) {
    return (
      <main className="container py-4">
        <Link className="btn btn-outline-secondary btn-sm mb-3" href="/account/inbox">
          {labels.back}
        </Link>
        <div className="alert alert-danger">{labels.notFound}</div>
      </main>
    );
  }

  const accepted = Boolean(
    detail.rfq.accepted_quote_id && detail.quotes.some((quote) => quote.id === detail.rfq.accepted_quote_id)
  );
  const acceptedQuote = detail.rfq.accepted_quote_id
    ? detail.quotes.find((quote) => quote.id === detail.rfq.accepted_quote_id) ?? null
    : null;
  const normalizedStatus = detail.invite.status?.trim().toLowerCase();
  const conversationClosed =
    normalizedStatus === "declined" ||
    normalizedStatus === "expired" ||
    Boolean(detail.rfq.accepted_quote_id && !acceptedQuote);
  const location =
    [detail.rfq.city, detail.rfq.state, detail.rfq.country].filter(Boolean).join(", ") ||
    dictionary.account.rfqsPage.formatting.locationTbd;

  return (
    <main className="container py-4">
      <ThreadReadSync threadKey={decodedThreadKey} markThreadRead={markAccountInboxThreadRead} />
      <Link className="btn btn-outline-secondary btn-sm mb-3" href="/account/inbox">
        {labels.back}
      </Link>

      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="mb-1">
            {detail.vendor?.business_name ?? dictionary.account.quotesPage.vendorFallback}
          </h1>
          <div className="text-secondary">
            {location} ·{" "}
            {detail.rfq.event_date
              ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(detail.rfq.event_date))
              : labels.dateTbd}
          </div>
        </div>
        {accepted ? <span className="badge text-bg-success">{labels.accepted}</span> : null}
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="card mb-4">
            <div className="card-body">
              <div className="fw-semibold mb-3">{labels.inquirySummary}</div>
              <InquirySummary
                rfq={detail.rfq}
                language={language}
                locale={locale}
                eventDateTbd={labels.dateTbd}
                guestCountTbd={labels.guestCountTbd}
                locationTbd={dictionary.account.rfqsPage.formatting.locationTbd}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="fw-semibold mb-3">{labels.latestProposal}</div>
              {detail.latestQuote ? (
                <>
                  <div className="fs-4 mb-1">
                    {formatAmount(detail.latestQuote.amount_cents, detail.latestQuote.currency, locale)}
                  </div>
                  <div className="small text-secondary mb-2">
                    {detail.latestQuote.version > 1 ? labels.proposalUpdatedLabel : labels.proposalLabel} ·{" "}
                    {new Date(detail.latestQuote.created_at).toLocaleString(locale)}
                  </div>
                  {detail.latestQuote.message ? <div>{detail.latestQuote.message}</div> : null}
                  {!detail.rfq.accepted_quote_id && !conversationClosed ? (
                    <div className="mt-3">
                      <AcceptButton rfq_id={detail.rfq.id} quote_id={detail.latestQuote.id} />
                    </div>
                  ) : acceptedQuote ? (
                    <div className="alert alert-success mt-3 mb-0">
                      {language === "es" ? "Has aceptado esta propuesta." : "You accepted this proposal."}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="small text-secondary">{labels.noProposal}</div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="card mb-4">
            <div className="card-body">
              <div className="fw-semibold mb-3">{labels.timeline}</div>
              <ThreadTimeline
                quotes={[...detail.quotes].reverse()}
                messages={detail.messages}
                locale={locale}
                viewerRole="client"
                vendorLabel={detail.vendor?.business_name ?? dictionary.account.quotesPage.vendorFallback}
                clientLabel={dictionary.account.quotesPage.conversation.youLabel}
                proposalLabel={labels.proposalLabel}
                updatedProposalLabel={labels.proposalUpdatedLabel}
                emptyLabel={labels.timelineEmpty}
              />
            </div>
          </div>

          {detail.latestQuote && !conversationClosed ? (
            <div className="card mb-4">
              <div className="card-body">
                <div className="fw-semibold mb-3">{dictionary.account.quotesPage.conversation.heading}</div>
                <QuoteReplyForm
                  action={sendClientQuoteReply}
                  quoteId={detail.latestQuote.id}
                  rfqId={detail.latestQuote.rfq_id}
                  vendorId={detail.latestQuote.vendor_id}
                  submitLabel={dictionary.account.quotesPage.conversation.replyAction}
                  submittingLabel={dictionary.account.quotesPage.conversation.replyPending}
                  placeholder={dictionary.account.quotesPage.conversation.replyPlaceholder}
                  successLabel={dictionary.account.quotesPage.conversation.replySuccess}
                />
              </div>
            </div>
          ) : conversationClosed ? (
            <div className="alert alert-secondary">
              {language === "es"
                ? "Esta conversación se cerró cuando se eligió otra propuesta o venció la solicitud."
                : "This conversation closed when another proposal was selected or the request expired."}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
