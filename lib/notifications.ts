import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_LANGUAGE,
  dictionaries,
  fillTemplate,
  getLanguageLocale,
  isSupportedLanguage,
  type SupportedLanguage,
} from "@/lib/i18n";
import { deliverNotificationEmail } from "@/lib/notification-email";
export {
  ACCOUNT_NOTIFICATION_TYPES,
  parseQuoteAnsweredNotificationData,
  parseThreadReplyNotificationData,
  parseVendorNewRequestNotificationData,
  parseVendorQuoteAcceptedNotificationData,
  VENDOR_NOTIFICATION_TYPES,
  type NotificationType,
  type QuoteAnsweredNotificationData,
  type ThreadReplyNotificationData,
  type VendorNewRequestNotificationData,
  type VendorQuoteAcceptedNotificationData,
} from "@/lib/notification-types";
import type {
  NotificationType,
  QuoteAnsweredNotificationData,
  ThreadReplyNotificationData,
  VendorNewRequestNotificationData,
  VendorQuoteAcceptedNotificationData,
} from "@/lib/notification-types";
import { sendMobilePushNotification } from "@/lib/push-notifications";

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

async function insertNotification(
  client: SupabaseClient,
  input: {
    recipientId: string;
    actorId: string | null;
    type: NotificationType;
    title: string;
    body: string;
    data: unknown;
    language: SupportedLanguage;
  }
) {
  const result = await client
    .from("notifications")
    .insert([
      {
        recipient_id: input.recipientId,
        actor_id: input.actorId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data,
      },
    ])
    .select("id")
    .single<{ id: string }>();

  if (!result.error && result.data?.id) {
    await Promise.all([
      sendMobilePushNotification(client, {
        notificationId: result.data.id,
        recipientId: input.recipientId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data,
      }),
      deliverNotificationEmail({
        notificationId: result.data.id,
        recipientId: input.recipientId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data,
        language: input.language,
      }),
    ]);
  }

  return { data: result.data, error: result.error };
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

  return insertNotification(client, {
    recipientId: input.recipientId,
    actorId: input.actorId,
    type: "quote_answered",
    title,
    body,
    data,
    language,
  });
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

  return insertNotification(client, {
    recipientId: input.recipientId,
    actorId: input.actorId,
    type: "vendor_new_request",
    title,
    body,
    data,
    language,
  });
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

  return insertNotification(client, {
    recipientId: input.recipientId,
    actorId: input.actorId,
    type: "vendor_quote_accepted",
    title,
    body,
    data,
    language,
  });
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

  return insertNotification(client, {
    recipientId: input.recipientId,
    actorId: input.actorId,
    type: "thread_reply",
    title,
    body,
    data,
    language,
  });
}
