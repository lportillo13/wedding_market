"use client";

import Link from "next/link";
import QuoteConversation from "@/components/quotes/QuoteConversation";
import QuoteReplyForm from "@/components/quotes/QuoteReplyForm";
import QuoteForm from "../inbox/QuoteForm";
import { sendVendorQuoteReply } from "@/app/quote-replies/actions";
import { useTranslation } from "@/contexts/LanguageContext";
import type { VendorRfqsItem } from "./types";

type Props = {
  hasVendorProfile: boolean;
  items: VendorRfqsItem[];
  vendorId?: string;
  vendorName?: string;
};

type StatusKey =
  | "accepted"
  | "responded"
  | "pending"
  | "declined"
  | "expired"
  | "unknown";

const statusMap: Record<string, StatusKey> = {
  accepted: "accepted",
  responded: "responded",
  pending: "pending",
  declined: "declined",
  rejected: "declined",
  expired: "expired",
};

function resolveStatus(inviteStatus: string | null | undefined, hasAcceptedQuote: boolean, hasQuote: boolean): StatusKey {
  if (hasAcceptedQuote) return "accepted";
  if (!inviteStatus && hasQuote) return "responded";
  if (!inviteStatus) return "pending";

  const normalized = inviteStatus.toLowerCase();
  if (normalized in statusMap) return statusMap[normalized];
  if (hasQuote) return "responded";
  return "unknown";
}

export default function VendorRfqsView({ hasVendorProfile, items, vendorId, vendorName }: Props) {
  const t = useTranslation();

  if (!hasVendorProfile) {
    return (
      <>
        <h1 className="wm-page-title mb-3">{t("vendorRfqs.title")}</h1>
        <div className="alert alert-info">
          {t("vendorRfqs.noProfile.message")} {" "}
          <Link href="/vendor/profile">{t("vendorRfqs.noProfile.linkLabel")}</Link>.
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="wm-page-title mb-1">{t("vendorRfqs.title")}</h1>
      {vendorName && <div className="text-secondary mb-4">{vendorName}</div>}

      {!items.length ? (
        <div className="alert alert-info">{t("vendorRfqs.empty")}</div>
      ) : (
        <div className="vstack gap-3">
          {items.map(({ invite, latestQuote, quotesForRfq, rfq, latestQuoteMessages }) => {
            const hasAcceptedQuote = Boolean(
              rfq?.accepted_quote_id &&
                quotesForRfq.some((quote) => quote.id === rfq.accepted_quote_id)
            );
            const inviteRevealed =
              invite.contact_revealed ?? (invite.status?.toLowerCase() === "accepted" ? true : undefined);
            const contactRevealed = Boolean(inviteRevealed) || hasAcceptedQuote;
            const revealEmail = invite.reveal_email ?? contactRevealed;
            const revealPhone = invite.reveal_phone ?? contactRevealed;
            const statusKey = resolveStatus(invite.status, hasAcceptedQuote, Boolean(latestQuote));
            const statusLabel = t(`vendorRfqs.status.${statusKey}`);
            const guestLabel = typeof rfq?.guest_count === "number"
              ? `${rfq.guest_count} ${t("vendorRfqs.guestsLabel")}`
              : rfq?.guest_count_range?.trim() || t("vendorRfqs.guestCountTbd");

            return (
              <div className="card" key={`${invite.rfq_id}-${invite.created_at}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="badge text-bg-secondary mb-2">{statusLabel}</div>
                      <h2 className="wm-card-title mb-1">
                        {t("vendorRfqs.rfqLabel")} {invite.rfq_id.slice(0, 8)}…
                      </h2>
                      <div className="text-secondary small mb-3">
                        {rfq?.city || "-"}, {rfq?.state || "-"}, {rfq?.country || "-"} ·{" "}
                        {rfq?.event_date
                          ? new Date(rfq.event_date).toLocaleDateString()
                          : t("vendorRfqs.eventDateTbd")}
                        {" "}·{" "}
                        {guestLabel}
                        {(rfq?.budget_min || rfq?.budget_max) && (
                          <>
                            {" "}· {t("vendorRfqs.budgetLabel")}: {rfq?.budget_min ?? "?"}–
                            {rfq?.budget_max ?? "?"}
                          </>
                        )}
                      </div>
                      {rfq?.notes && <p className="mb-0">{rfq.notes}</p>}
                    </div>
                    <div className="text-end small">
                      <div>
                        {t("vendorRfqs.invitedAtLabel")}: {new Date(invite.created_at).toLocaleString()}
                      </div>
                      {invite.expires_at && (
                        <div>
                          {t("vendorRfqs.expiresAtLabel")}: {new Date(invite.expires_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    {contactRevealed ? (
                      <div className="p-2 rounded border bg-success-subtle">
                        <span className="badge text-bg-success me-2">{t("vendorRfqs.contact.revealed")}</span>
                        <div className="small">
                          {revealEmail && rfq?.contact_email && (
                            <a href={`mailto:${rfq.contact_email}`}>{rfq.contact_email}</a>
                          )}
                          {revealPhone && rfq?.contact_phone && (
                            <span className={revealEmail && rfq?.contact_email ? "ms-2" : ""}>
                              · {rfq.contact_phone}
                            </span>
                          )}
                          {!revealEmail && !revealPhone && (
                            <span className="text-secondary">{t("vendorRfqs.contact.noneShared")}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="small text-secondary">
                        <span className="badge text-bg-secondary me-2">{t("vendorRfqs.contact.hidden")}</span>
                        {t("vendorRfqs.contact.hiddenNote")}
                      </div>
                    )}
                  </div>

                  {latestQuote && (
                    <div className="mt-3 p-3 border rounded bg-body-tertiary">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="fw-semibold">{t("vendorRfqs.latestQuote.heading")}</div>
                        <div>
                          {typeof latestQuote.amount_cents === "number"
                            ? `$${(latestQuote.amount_cents / 100).toLocaleString()}`
                            : latestQuote.currency ?? "—"}
                        </div>
                      </div>
                      <div className="small text-secondary">
                        {new Date(latestQuote.created_at).toLocaleString()}
                      </div>
                      {latestQuote.message && <div className="mt-2">{latestQuote.message}</div>}
                      <QuoteConversation
                        messages={latestQuoteMessages}
                        locale={undefined as never}
                        viewerRole="vendor"
                        vendorLabel={t("vendorQuotes.conversation.youLabel")}
                        clientLabel={t("vendorQuotes.conversation.clientLabel")}
                        emptyLabel={t("vendorQuotes.conversation.empty")}
                        heading={t("vendorQuotes.conversation.heading")}
                      />
                      <QuoteReplyForm
                        action={sendVendorQuoteReply}
                        quoteId={latestQuote.id}
                        rfqId={latestQuote.rfq_id}
                        vendorId={latestQuote.vendor_id}
                        submitLabel={t("vendorQuotes.conversation.replyAction")}
                        submittingLabel={t("vendorQuotes.conversation.replyPending")}
                        placeholder={t("vendorQuotes.conversation.replyPlaceholder")}
                        successLabel={t("vendorQuotes.conversation.replySuccess")}
                      />
                    </div>
                  )}

                  {vendorId && !hasAcceptedQuote && (
                    <>
                      <hr />
                      <QuoteForm
                        rfq_id={invite.rfq_id}
                        vendor_id={vendorId}
                        initialAmountUsd={
                          typeof latestQuote?.amount_cents === "number"
                            ? String(latestQuote.amount_cents / 100)
                            : ""
                        }
                        initialMessage={latestQuote?.message ?? ""}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
