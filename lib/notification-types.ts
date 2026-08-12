export type NotificationType =
  | "quote_answered"
  | "vendor_new_request"
  | "vendor_quote_accepted"
  | "thread_reply";

export const ACCOUNT_NOTIFICATION_TYPES = ["quote_answered", "thread_reply"] as const satisfies readonly NotificationType[];
export const VENDOR_NOTIFICATION_TYPES = ["vendor_new_request", "vendor_quote_accepted", "thread_reply"] as const satisfies readonly NotificationType[];

export type QuoteAnsweredNotificationData = {
  rfqId: string;
  quoteId: string;
  vendorId: string;
  vendorName: string | null;
  amountCents: number | null;
  isUpdate: boolean;
};

export type VendorNewRequestNotificationData = {
  rfqId: string;
  vendorId: string;
  requesterName: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  eventDate: string | null;
};

export type VendorQuoteAcceptedNotificationData = {
  rfqId: string;
  quoteId: string;
  vendorId: string;
  acceptedByName: string | null;
  revealEmail: boolean;
  revealPhone: boolean;
};

export type ThreadReplyNotificationData = {
  rfqId: string;
  quoteId: string;
  vendorId: string;
  senderRole: "client" | "vendor";
  senderName: string | null;
  messagePreview: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseQuoteAnsweredNotificationData(value: unknown): QuoteAnsweredNotificationData | null {
  if (!isRecord(value)) {
    return null;
  }

  const rfqId = typeof value.rfqId === "string" ? value.rfqId : null;
  const quoteId = typeof value.quoteId === "string" ? value.quoteId : null;
  const vendorId = typeof value.vendorId === "string" ? value.vendorId : null;

  if (!rfqId || !quoteId || !vendorId) {
    return null;
  }

  return {
    rfqId,
    quoteId,
    vendorId,
    vendorName: typeof value.vendorName === "string" ? value.vendorName : null,
    amountCents: typeof value.amountCents === "number" ? value.amountCents : null,
    isUpdate: value.isUpdate === true,
  };
}

export function parseVendorNewRequestNotificationData(value: unknown): VendorNewRequestNotificationData | null {
  if (!isRecord(value)) {
    return null;
  }

  const rfqId = typeof value.rfqId === "string" ? value.rfqId : null;
  const vendorId = typeof value.vendorId === "string" ? value.vendorId : null;

  if (!rfqId || !vendorId) {
    return null;
  }

  return {
    rfqId,
    vendorId,
    requesterName: typeof value.requesterName === "string" ? value.requesterName : null,
    city: typeof value.city === "string" ? value.city : null,
    state: typeof value.state === "string" ? value.state : null,
    country: typeof value.country === "string" ? value.country : null,
    eventDate: typeof value.eventDate === "string" ? value.eventDate : null,
  };
}

export function parseVendorQuoteAcceptedNotificationData(value: unknown): VendorQuoteAcceptedNotificationData | null {
  if (!isRecord(value)) {
    return null;
  }

  const rfqId = typeof value.rfqId === "string" ? value.rfqId : null;
  const quoteId = typeof value.quoteId === "string" ? value.quoteId : null;
  const vendorId = typeof value.vendorId === "string" ? value.vendorId : null;

  if (!rfqId || !quoteId || !vendorId) {
    return null;
  }

  return {
    rfqId,
    quoteId,
    vendorId,
    acceptedByName: typeof value.acceptedByName === "string" ? value.acceptedByName : null,
    revealEmail: value.revealEmail === true,
    revealPhone: value.revealPhone === true,
  };
}

export function parseThreadReplyNotificationData(value: unknown): ThreadReplyNotificationData | null {
  if (!isRecord(value)) {
    return null;
  }

  const rfqId = typeof value.rfqId === "string" ? value.rfqId : null;
  const quoteId = typeof value.quoteId === "string" ? value.quoteId : null;
  const vendorId = typeof value.vendorId === "string" ? value.vendorId : null;
  const senderRole = value.senderRole === "client" || value.senderRole === "vendor" ? value.senderRole : null;

  if (!rfqId || !quoteId || !vendorId || !senderRole) {
    return null;
  }

  return {
    rfqId,
    quoteId,
    vendorId,
    senderRole,
    senderName: typeof value.senderName === "string" ? value.senderName : null,
    messagePreview: typeof value.messagePreview === "string" ? value.messagePreview : null,
  };
}
