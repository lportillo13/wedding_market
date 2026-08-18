import Link from "next/link";
import { redirect } from "next/navigation";
import { sendVendorQuoteReply } from "@/app/quote-replies/actions";
import { markVendorInboxThreadRead } from "@/app/vendor/inbox/actions";
import ThreadReadSync from "@/components/inbox/ThreadReadSync";
import ThreadTimeline from "@/components/inbox/ThreadTimeline";
import InquirySummary from "@/components/inbox/InquirySummary";
import QuoteReplyForm from "@/components/quotes/QuoteReplyForm";
import { getRoles } from "@/lib/auth/roles";
import { getLanguageLocale } from "@/lib/i18n";
import { getRequestI18n } from "@/lib/i18n/server";
import { loadVendorThreadDetail } from "@/lib/inbox";
import QuoteForm from "../QuoteForm";

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

export default async function VendorInboxThreadPage({
  params,
}: {
  params: Promise<{ threadKey: string }>;
}) {
  const { user, isVendor } = await getRoles();
  if (!user || !isVendor) redirect("/signup/vendor");

  const { threadKey } = await params;
  const decodedThreadKey = decodeURIComponent(threadKey);

  const { dictionary, language } = await getRequestI18n();
  const locale = getLanguageLocale(language);
  const labels = {
    back: language === "es" ? "Volver a la bandeja" : "Back to inbox",
    notFound: language === "es" ? "No pudimos encontrar ese hilo." : "We could not find that thread.",
    inquirySummary: language === "es" ? "Resumen de la solicitud" : "Inquiry summary",
    latestProposal: language === "es" ? "Ultima propuesta" : "Latest proposal",
    timeline: language === "es" ? "Actividad" : "Activity",
    timelineEmpty: language === "es" ? "Aun no hay actividad en este hilo." : "There is no activity in this thread yet.",
    noProposal: language === "es" ? "Todavia no has enviado una propuesta." : "You have not sent a proposal yet.",
    proposalLabel: language === "es" ? "Propuesta enviada" : "Proposal sent",
    proposalUpdatedLabel: language === "es" ? "Propuesta actualizada" : "Proposal updated",
    dateTbd: dictionary.vendorRfqs.eventDateTbd,
    guestCountTbd: dictionary.vendorRfqs.guestCountTbd,
    accepted: dictionary.vendorRfqs.status.accepted,
  };

  const detail = await loadVendorThreadDetail(user.id, decodedThreadKey);

  if (!detail) {
    return (
      <main className="pb-4">
        <Link className="btn btn-outline-secondary btn-sm mb-3" href="/vendor/inbox">
          {labels.back}
        </Link>
        <div className="alert alert-danger">{labels.notFound}</div>
      </main>
    );
  }

  const accepted = Boolean(
    detail.rfq.accepted_quote_id && detail.quotes.some((quote) => quote.id === detail.rfq.accepted_quote_id)
  );
  const normalizedStatus = detail.invite.status?.trim().toLowerCase();
  const conversationClosed =
    normalizedStatus === "declined" ||
    normalizedStatus === "expired" ||
    Boolean(detail.rfq.accepted_quote_id && !accepted);
  const location =
    [detail.rfq.city, detail.rfq.state, detail.rfq.country].filter(Boolean).join(", ") || "-";
  const inviteAccepted = accepted;
  const revealEmail = detail.invite.reveal_email ?? inviteAccepted;
  const revealPhone = detail.invite.reveal_phone ?? inviteAccepted;

  return (
    <main className="pb-4">
      <ThreadReadSync threadKey={decodedThreadKey} markThreadRead={markVendorInboxThreadRead} />
      <Link className="btn btn-outline-secondary btn-sm mb-3" href="/vendor/inbox">
        {labels.back}
      </Link>

      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="mb-1">
            {dictionary.vendorRfqs.rfqLabel} {detail.rfq.id.slice(0, 8)}
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
                </>
              ) : (
                <div className="small text-secondary">{labels.noProposal}</div>
              )}

              {inviteAccepted ? (
                <div className="mt-3 p-2 rounded border bg-success-subtle">
                  <span className="badge text-bg-success me-2">{dictionary.vendorRfqs.contact.revealed}</span>
                  <div className="small">
                    {revealEmail && detail.rfq.contact_email ? (
                      <a href={`mailto:${detail.rfq.contact_email}`}>{detail.rfq.contact_email}</a>
                    ) : null}
                    {revealPhone && detail.rfq.contact_phone ? (
                      <span className={revealEmail && detail.rfq.contact_email ? "ms-2" : ""}>
                        · {detail.rfq.contact_phone}
                      </span>
                    ) : null}
                    {!revealEmail && !revealPhone ? (
                      <span className="text-secondary">{dictionary.vendorRfqs.contact.noneShared}</span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-3 small text-secondary">
                  <span className="badge text-bg-secondary me-2">{dictionary.vendorRfqs.contact.hidden}</span>
                  {dictionary.vendorQuotes.contact.hiddenNote}
                </div>
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
                viewerRole="vendor"
                vendorLabel={dictionary.vendorQuotes.conversation.youLabel}
                clientLabel={dictionary.vendorQuotes.conversation.clientLabel}
                proposalLabel={labels.proposalLabel}
                updatedProposalLabel={labels.proposalUpdatedLabel}
                emptyLabel={labels.timelineEmpty}
              />
            </div>
          </div>

          {detail.latestQuote && !conversationClosed ? (
            <div className="card mb-4">
              <div className="card-body">
                <div className="fw-semibold mb-3">{dictionary.vendorQuotes.conversation.heading}</div>
                <QuoteReplyForm
                  action={sendVendorQuoteReply}
                  quoteId={detail.latestQuote.id}
                  rfqId={detail.latestQuote.rfq_id}
                  vendorId={detail.latestQuote.vendor_id}
                  submitLabel={dictionary.vendorQuotes.conversation.replyAction}
                  submittingLabel={dictionary.vendorQuotes.conversation.replyPending}
                  placeholder={dictionary.vendorQuotes.conversation.replyPlaceholder}
                  successLabel={dictionary.vendorQuotes.conversation.replySuccess}
                />
              </div>
            </div>
          ) : conversationClosed ? (
            <div className="alert alert-secondary">
              {language === "es"
                ? "Esta conversación está cerrada porque se eligió otra propuesta o venció la solicitud."
                : "This conversation is closed because another proposal was selected or the request expired."}
            </div>
          ) : null}

          {!accepted && !conversationClosed ? (
            <div className="card mb-4">
              <div className="card-body">
                <div className="fw-semibold mb-3">
                  {detail.latestQuote
                    ? language === "es"
                      ? "Actualizar propuesta"
                      : "Update proposal"
                    : language === "es"
                      ? "Enviar propuesta"
                      : "Send proposal"}
                </div>
                <QuoteForm
                  rfq_id={detail.rfq.id}
                  vendor_id={detail.invite.vendor_id}
                  initialAmountUsd={
                    typeof detail.latestQuote?.amount_cents === "number"
                      ? String(detail.latestQuote.amount_cents / 100)
                      : ""
                  }
                  initialMessage={detail.latestQuote?.message ?? ""}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
