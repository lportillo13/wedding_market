import { formatQuoteAmount } from "@/shared/proposals/format";
import { getConversationState } from "@/shared/conversations/state";
import ThreadRefresh from "@/components/inbox/ThreadRefresh";
import { formatCalendarDate } from "@/shared/calendar/date";
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
import { loadClientThreadDetail } from "@/features/conversations/server/inbox";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      <main className="wm-thread container py-4">
        <h1 className="mb-3">{labels.title}</h1>
        <div className="alert alert-warning">{labels.loginRequired}</div>
        <Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(`/account/inbox/${threadKey}`)}`}>
          {labels.loginAction}
        </Link>
      </main>
    );
  }

  const decodedThreadKey = threadKey;
  const detail = await loadClientThreadDetail(user.id, decodedThreadKey);

  if (!detail) {
    return (
      <main className="wm-thread container py-4">
        <Link className="btn btn-outline-secondary btn-sm mb-3" href="/account/inbox">
          {labels.back}
        </Link>
        <div className="alert alert-danger">{labels.notFound}</div>
      </main>
    );
  }

  const {accepted, closed: conversationClosed, canAccept} = getConversationState(detail.invite, (detail.invite.accepted_quote_id ?? null), detail.quotes.map(q => q.id));
  const acceptedQuote = detail.quotes.find(q => q.id === (detail.invite.accepted_quote_id ?? null)) ?? null;
  const location =
    [detail.rfq.city, detail.rfq.state, detail.rfq.country].filter(Boolean).join(", ") ||
    dictionary.account.rfqsPage.formatting.locationTbd;

  return (
    <main className="wm-thread container py-4">
      <ThreadRefresh />
      <ThreadReadSync activityKey={`${detail.messages.at(-1)?.id ?? ""}:${detail.latestQuote?.id ?? ""}:${detail.invite.status ?? ""}`} threadKey={decodedThreadKey} markThreadRead={markAccountInboxThreadRead} />
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
              ? formatCalendarDate(detail.rfq.event_date, locale) ?? labels.dateTbd
              : labels.dateTbd}
          </div>
        </div>
        {accepted ? <span className="badge text-bg-success">{labels.accepted}</span> : null}
      </div>

      <p><Link href={`/account/inbox?rfq=${encodeURIComponent(detail.rfq.id)}`}>{language === "es" ? "Comparar propuestas de esta solicitud" : "Compare proposals for this request"} →</Link></p>

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
                    {formatQuoteAmount(detail.latestQuote.amount_cents, detail.latestQuote.currency, locale)}
                  </div>
                  <div className="small text-secondary mb-2">
                    {detail.latestQuote.version > 1 ? labels.proposalUpdatedLabel : labels.proposalLabel} ·{" "}
                    {new Date(detail.latestQuote.created_at).toLocaleString(locale)}
                  </div>
                  {detail.latestQuote.message ? <div>{detail.latestQuote.message}</div> : null}
                  {canAccept ? (
                    <div className="mt-3">
                      <p className="small text-secondary">{language === "es" ? "Aceptas solo la propuesta de este proveedor. Las otras conversaciones siguen abiertas." : "You are accepting only this vendor’s proposal. Your other conversations stay open."}</p>
                      <AcceptButton rfq_id={detail.rfq.id} quote_id={detail.latestQuote.id} />
                    </div>
                  ) : acceptedQuote ? (
                    <div className="alert alert-success mt-3 mb-0">
                      {language === "es" ? "Has aceptado esta propuesta." : "You accepted this proposal."}
                      <div className="mt-2">
                        <Link href={`/account/reviews/new/${detail.rfq.id}?vendor=${encodeURIComponent(detail.invite.vendor_id)}`}>
                          {language === "es" ? "Reseñar a este proveedor" : "Review this vendor"}
                        </Link>
                      </div>
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

          {!conversationClosed ? (
            <div className="card mb-4">
              <div className="card-body">
                <div className="fw-semibold mb-3">{dictionary.account.quotesPage.conversation.heading}</div>
                <QuoteReplyForm
                  action={sendClientQuoteReply}
                  quoteId={detail.latestQuote?.id}
                  rfqId={detail.rfq.id}
                  vendorId={detail.invite.vendor_id}
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
                : "This conversation is closed or archived. Its history is still available."}
              {detail.invite.closed_reason === "archived_by_client" ? <div className="mt-2"><Link href={`/account/inbox?view=deleted&rfq=${encodeURIComponent(detail.rfq.id)}`}>{language === "es" ? "Restaurar desde conversaciones eliminadas" : "Restore from deleted conversations"}</Link></div>
                : detail.vendor?.slug ? <div className="mt-2"><Link href={`/vendors/${encodeURIComponent(detail.vendor.slug)}#contact`}>{language === "es" ? "Enviar una nueva solicitud" : "Send a new inquiry"}</Link></div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
