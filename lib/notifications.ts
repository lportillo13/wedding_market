import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_LANGUAGE,
  dictionaries,
  fillTemplate,
  getLanguageLocale,
  isSupportedLanguage,
} from "@/lib/i18n";

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

type CreateQuoteAnsweredNotificationInput = {
  recipientId: string;
  actorId: string | null;
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

type CreateVendorNewRequestNotificationInput = {
  recipientId: string;
  actorId: string | null;
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

type CreateVendorQuoteAcceptedNotificationInput = {
  recipientId: string;
  actorId: string | null;
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

type CreateThreadReplyNotificationInput = {
  recipientId: string;
  actorId: string | null;
  rfqId: string;
  quoteId: string;
  vendorId: string;
  senderRole: "client" | "vendor";
  senderName: string | null;
  messagePreview: string | null;
};

async function getRecipientLanguage(client: SupabaseClient, recipientId: string) {
  const { data } = await client.from("profiles").select("language").eq("id", recipientId).maybeSingle();
  return isSupportedLanguage(data?.language) ? data.language : DEFAULT_LANGUAGE;
}

function formatAmount(amountCents: number | null, language: "en" | "es") {
  if (typeof amountCents !== "number") {
    return null;
  }

  return new Intl.NumberFormat(getLanguageLocale(language), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export async function createQuoteAnsweredNotification(
  client: SupabaseClient,
  input: CreateQuoteAnsweredNotificationInput
) {
  const language = await getRecipientLanguage(client, input.recipientId);
  const labels = dictionaries[language].account.notificationsPage;
  const amountLabel = formatAmount(input.amountCents, language);
  const amountSuffix = amountLabel ? fillTemplate(labels.messages.amountSuffix, { amount: amountLabel }) : "";
  const vendorLabel = input.vendorName?.trim() || labels.vendorFallback;
  const title = input.isUpdate ? labels.titles.quoteUpdated : labels.titles.newQuote;
  const body = fillTemplate(
    input.isUpdate ? labels.messages.quoteUpdated : labels.messages.newQuote,
    { vendor: vendorLabel, amountSuffix }
  );
  const data: QuoteAnsweredNotificationData = {
    rfqId: input.rfqId,
    quoteId: input.quoteId,
    vendorId: input.vendorId,
    vendorName: input.vendorName,
    amountCents: input.amountCents,
    isUpdate: input.isUpdate,
  };

  return client.from("notifications").insert([
    {
      recipient_id: input.recipientId,
      actor_id: input.actorId,
      type: "quote_answered" satisfies NotificationType,
      title,
      body,
      data,
    },
  ]);
}

function formatLocation(city: string | null, state: string | null, country: string | null) {
  return [city, state, country].filter(Boolean).join(", ");
}

export async function createVendorNewRequestNotification(
  client: SupabaseClient,
  input: CreateVendorNewRequestNotificationInput
) {
  const language = await getRecipientLanguage(client, input.recipientId);
  const requesterLabel =
    input.requesterName?.trim() || (language === "es" ? "Una pareja" : "A couple");
  const locationLabel = formatLocation(input.city, input.state, input.country);
  const title = language === "es" ? "Nueva solicitud" : "New request";
  const body = language === "es"
    ? `${requesterLabel} te envió una nueva solicitud${locationLabel ? ` para ${locationLabel}` : ""}.`
    : `${requesterLabel} sent you a new request${locationLabel ? ` for ${locationLabel}` : ""}.`;

  const data: VendorNewRequestNotificationData = {
    rfqId: input.rfqId,
    vendorId: input.vendorId,
    requesterName: input.requesterName,
    city: input.city,
    state: input.state,
    country: input.country,
    eventDate: input.eventDate,
  };

  return client.from("notifications").insert([
    {
      recipient_id: input.recipientId,
      actor_id: input.actorId,
      type: "vendor_new_request" satisfies NotificationType,
      title,
      body,
      data,
    },
  ]);
}

export async function createVendorQuoteAcceptedNotification(
  client: SupabaseClient,
  input: CreateVendorQuoteAcceptedNotificationInput
) {
  const language = await getRecipientLanguage(client, input.recipientId);
  const acceptedByLabel =
    input.acceptedByName?.trim() || (language === "es" ? "Un cliente" : "A client");
  const contactSuffix =
    input.revealEmail || input.revealPhone
      ? language === "es"
        ? " Ya puedes revisar sus datos de contacto."
        : " You can now review their contact details."
      : "";
  const title = language === "es" ? "Cotización aceptada" : "Quote accepted";
  const body = language === "es"
    ? `${acceptedByLabel} aceptó tu cotización.${contactSuffix}`
    : `${acceptedByLabel} accepted your quote.${contactSuffix}`;

  const data: VendorQuoteAcceptedNotificationData = {
    rfqId: input.rfqId,
    quoteId: input.quoteId,
    vendorId: input.vendorId,
    acceptedByName: input.acceptedByName,
    revealEmail: input.revealEmail,
    revealPhone: input.revealPhone,
  };

  return client.from("notifications").insert([
    {
      recipient_id: input.recipientId,
      actor_id: input.actorId,
      type: "vendor_quote_accepted" satisfies NotificationType,
      title,
      body,
      data,
    },
  ]);
}

export async function createThreadReplyNotification(
  client: SupabaseClient,
  input: CreateThreadReplyNotificationInput
) {
  const language = await getRecipientLanguage(client, input.recipientId);
  const senderLabel =
    input.senderName?.trim() ||
    (input.senderRole === "vendor"
      ? language === "es"
        ? "Tu proveedor"
        : "Your vendor"
      : language === "es"
        ? "Tu cliente"
        : "Your client");
  const title =
    input.senderRole === "vendor"
      ? language === "es"
        ? "Nueva respuesta"
        : "New reply"
      : language === "es"
        ? "Nueva respuesta del cliente"
        : "New client reply";
  const body =
    input.senderRole === "vendor"
      ? language === "es"
        ? `${senderLabel} respondi\u00f3 a tu solicitud.`
        : `${senderLabel} replied to your request.`
      : language === "es"
        ? `${senderLabel} respondi\u00f3 en la conversaci\u00f3n.`
        : `${senderLabel} replied in the conversation.`;

  const data: ThreadReplyNotificationData = {
    rfqId: input.rfqId,
    quoteId: input.quoteId,
    vendorId: input.vendorId,
    senderRole: input.senderRole,
    senderName: input.senderName,
    messagePreview: input.messagePreview,
  };

  return client.from("notifications").insert([
    {
      recipient_id: input.recipientId,
      actor_id: input.actorId,
      type: "thread_reply" satisfies NotificationType,
      title,
      body,
      data,
    },
  ]);
}

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
