import type { SupportedLanguage } from "@/lib/i18n";
import type { NotificationType } from "@/lib/notification-types";
import {
  getApplicationBaseUrl,
  isResendConfigured,
  renderTransactionalEmail,
  sendTransactionalEmail,
  type EmailDeliveryResult,
} from "@/lib/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type NotificationEmailInput = {
  notificationId: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: unknown;
  language: SupportedLanguage;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function stringField(value: Record<string, unknown> | null, key: string) {
  return typeof value?.[key] === "string" ? value[key] : null;
}

export function getNotificationEmailAction(
  type: NotificationType,
  data: unknown,
  language: SupportedLanguage
) {
  const record = asRecord(data);
  const rfqId = stringField(record, "rfqId");
  const vendorId = stringField(record, "vendorId");

  if (!rfqId || !vendorId) {
    return null;
  }

  const threadKey = encodeURIComponent(`${rfqId}__${vendorId}`);
  const senderRole = stringField(record, "senderRole");
  const vendorRecipient =
    type === "vendor_new_request" ||
    type === "vendor_quote_accepted" ||
    (type === "thread_reply" && senderRole === "client");
  const path = vendorRecipient ? `/vendor/inbox/${threadKey}` : `/account/inbox/${threadKey}`;

  return {
    url: new URL(path, `${getApplicationBaseUrl()}/`).toString(),
    label: language === "es" ? "Ver conversación" : "View conversation",
  };
}

export function buildNotificationEmail(input: NotificationEmailInput, recipientEmail: string) {
  const action = getNotificationEmailAction(input.type, input.data, input.language);
  if (!action) {
    return null;
  }

  const record = asRecord(input.data);
  const messagePreview = stringField(record, "messagePreview")?.replace(/\s+/g, " ").trim().slice(0, 320);
  const detail = input.type === "thread_reply" ? messagePreview : null;
  const subject = `${input.title} | Wedding Market`;
  const textParts = [input.title, input.body];

  if (detail) {
    textParts.push(detail);
  }
  textParts.push(`${action.label}: ${action.url}`);

  return {
    to: recipientEmail,
    subject,
    html: renderTransactionalEmail({
      preview: input.body,
      title: input.title,
      body: input.body,
      detail,
      actionLabel: action.label,
      actionUrl: action.url,
    }),
    text: textParts.join("\n\n"),
    idempotencyKey: `notification/${input.notificationId}`,
    category: input.type,
  };
}

async function updateNotificationEmailStatus(
  notificationId: string,
  result: EmailDeliveryResult
) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("notifications")
    .update({
      email_status: result.status,
      email_sent_at: result.status === "sent" ? now : null,
      updated_at: now,
    })
    .eq("id", notificationId);

  if (error && process.env.NODE_ENV !== "production") {
    console.warn("Unable to update notification email status", error.message);
  }
}

export async function deliverNotificationEmail(input: NotificationEmailInput) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return;
  }

  if (!isResendConfigured()) {
    await updateNotificationEmailStatus(input.notificationId, {
      status: "skipped",
      reason: "Resend transactional email is not configured.",
    });
    return;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const { data, error } = await admin.auth.admin.getUserById(input.recipientId);
  const recipientEmail = data.user?.email?.trim();

  if (error || !recipientEmail) {
    await updateNotificationEmailStatus(input.notificationId, {
      status: "skipped",
      reason: error?.message || "Recipient has no email address.",
    });
    return;
  }

  const email = buildNotificationEmail(input, recipientEmail);
  if (!email) {
    await updateNotificationEmailStatus(input.notificationId, {
      status: "skipped",
      reason: "Notification did not contain a valid conversation link.",
    });
    return;
  }

  const result = await sendTransactionalEmail(email);
  await updateNotificationEmailStatus(input.notificationId, result);

  if (result.status === "failed") {
    console.warn("Resend notification email failed", result.error);
  }
}
