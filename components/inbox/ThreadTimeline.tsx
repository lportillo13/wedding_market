import { formatQuoteAmount } from "@/shared/proposals/format";
import type { QuoteMessageRow } from "@/features/conversations/server/quote-messages";
import type { InboxQuoteRow } from "@/features/conversations/server/inbox";

type ThreadTimelineProps = {
  quotes: InboxQuoteRow[];
  messages: QuoteMessageRow[];
  locale?: string;
  viewerRole: "client" | "vendor";
  vendorLabel: string;
  clientLabel: string;
  proposalLabel: string;
  updatedProposalLabel?: string;
  emptyLabel: string;
};

type TimelineItem =
  | { kind: "proposal"; created_at: string; quote: InboxQuoteRow }
  | { kind: "message"; created_at: string; message: QuoteMessageRow };

export default function ThreadTimeline({
  quotes,
  messages,
  locale,
  viewerRole,
  vendorLabel,
  clientLabel,
  proposalLabel,
  updatedProposalLabel,
  emptyLabel,
}: ThreadTimelineProps) {
  const items: TimelineItem[] = [
    ...quotes.map((quote) => ({ kind: "proposal" as const, created_at: quote.created_at, quote })),
    ...messages.map((message) => ({ kind: "message" as const, created_at: message.created_at, message })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (!items.length) {
    return <div className="small text-secondary">{emptyLabel}</div>;
  }

  return (
    <div className="vstack gap-2">
      {items.map((item) => {
        if (item.kind === "proposal") {
          const proposalEventLabel =
            item.quote.version > 1 ? updatedProposalLabel ?? proposalLabel : proposalLabel;

          return (
            <div key={`proposal-${item.quote.id}`} className="border rounded p-3 bg-body-tertiary">
              <div className="d-flex justify-content-between gap-3 small text-secondary mb-1">
                <span className="fw-semibold">{proposalEventLabel}</span>
                <span>{new Date(item.created_at).toLocaleString(locale)}</span>
              </div>
              <div className="fw-semibold mb-1">
                {formatQuoteAmount(item.quote.amount_cents,item.quote.currency,locale)}
              </div>
              {item.quote.message ? <div style={{ whiteSpace: "pre-wrap" }}>{item.quote.message}</div> : null}
            </div>
          );
        }

        const isViewer = item.message.sender_role === viewerRole;
        const senderLabel = item.message.sender_role === "vendor" ? vendorLabel : clientLabel;

        return (
          <div
            key={`message-${item.message.id}`}
            className={`border rounded p-3 ${isViewer ? "bg-light" : "bg-white"}`}
          >
            <div className="d-flex justify-content-between gap-3 small text-secondary mb-1">
              <span className="fw-semibold">{senderLabel}</span>
              <span>{new Date(item.created_at).toLocaleString(locale)}</span>
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>{item.message.body}</div>
          </div>
        );
      })}
    </div>
  );
}
