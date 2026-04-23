import type { QuoteMessageRow } from "@/lib/quote-messages";

type QuoteConversationProps = {
  messages: QuoteMessageRow[];
  locale?: string;
  viewerRole: "client" | "vendor";
  vendorLabel: string;
  clientLabel: string;
  emptyLabel: string;
  heading: string;
};

export default function QuoteConversation({
  messages,
  locale,
  viewerRole,
  vendorLabel,
  clientLabel,
  emptyLabel,
  heading,
}: QuoteConversationProps) {
  return (
    <div className="mt-3">
      <div className="fw-semibold mb-2">{heading}</div>
      {!messages.length ? (
        <div className="small text-secondary">{emptyLabel}</div>
      ) : (
        <div className="vstack gap-2">
          {messages.map((message) => {
            const isViewer = message.sender_role === viewerRole;
            const senderLabel = message.sender_role === "vendor" ? vendorLabel : clientLabel;

            return (
              <div
                key={message.id}
                className={`border rounded p-3 ${isViewer ? "bg-light" : "bg-white"}`}
              >
                <div className="d-flex justify-content-between gap-3 small text-secondary mb-1">
                  <span className="fw-semibold">{senderLabel}</span>
                  <span>{new Date(message.created_at).toLocaleString(locale)}</span>
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{message.body}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
