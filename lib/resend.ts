import { Resend } from "resend";
import { renderBrandedEmail } from "@/shared/email/template";

export type EmailDeliveryResult =
  | { status: "sent"; id: string }
  | { status: "failed"; error: string }
  | { status: "skipped"; reason: string };

export type TransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  category: string;
};

type EmailTemplateInput = {
  preview: string;
  title: string;
  body: string;
  actionLabel: string;
  actionUrl: string;
  detail?: string | null;
  detailLabel?: string;
  eyebrow?: string;
  language?: "en" | "es";
};

let resendClient: Resend | null = null;
let resendClientKey: string | null = null;
let resendContactsClient: Resend | null = null;
let resendContactsClientKey: string | null = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  if (!resendClient || resendClientKey !== apiKey) {
    resendClient = new Resend(apiKey);
    resendClientKey = apiKey;
  }

  return resendClient;
}

function getResendContactsClient() {
  const apiKey = process.env.RESEND_CONTACTS_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  if (!resendContactsClient || resendContactsClientKey !== apiKey) {
    resendContactsClient = new Resend(apiKey);
    resendContactsClientKey = apiKey;
  }

  return resendContactsClient;
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
}

export function getApplicationBaseUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://thewedmarket.com";

  try {
    const url = new URL(configured);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported application URL protocol.");
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return "https://thewedmarket.com";
  }
}

export function escapeEmailHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSafeEmailUrl(value: string, fallback: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function renderTransactionalEmail(input: EmailTemplateInput) {
  const language = input.language === "es" ? "es" : "en";
  const baseUrl = getApplicationBaseUrl();
  const detail = input.detail?.trim() ? escapeEmailHtml(input.detail.trim()) : null;
  const detailLabel = escapeEmailHtml(input.detailLabel?.trim() || (language === "es" ? "VISTA PREVIA DEL MENSAJE" : "MESSAGE PREVIEW"));
  return renderBrandedEmail({
    language,
    homeUrl: escapeEmailHtml(baseUrl),
    preview: escapeEmailHtml(input.preview),
    title: escapeEmailHtml(input.title),
    eyebrow: escapeEmailHtml(input.eyebrow?.trim() || (language === "es" ? "TU CUENTA" : "YOUR ACCOUNT")),
    bodyHtml: '<p style="margin:0;">' + escapeEmailHtml(input.body) + '</p>' + (detail ? '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;background:#f2ede6;border:1px solid #ded5c8;"><tr><td style="padding:20px;"><p style="margin:0 0 10px;font-size:10px;line-height:16px;letter-spacing:1.5px;color:#796b5f;">' + detailLabel + '</p><p style="margin:0;font-family:Georgia,serif;font-size:18px;line-height:28px;color:#332d27;overflow-wrap:anywhere;">' + detail + '</p></td></tr></table>' : ''),
    action: {
      label: escapeEmailHtml(input.actionLabel),
      url: escapeEmailHtml(getSafeEmailUrl(input.actionUrl, baseUrl)),
      fallbackLabel: language === "es" ? "Si el bot&oacute;n no funciona, copia este enlace:" : "If the button does not work, copy this link:",
    },
    securityNote: language === "es" ? "Este correo corresponde a actividad en Wedding Market. No compartas contrase&ntilde;as ni c&oacute;digos de verificaci&oacute;n." : "This email relates to activity on Wedding Market. Keep your passwords and verification codes private.",
    privacyLabel: language === "es" ? "Privacidad" : "Privacy",
    helpLabel: language === "es" ? "Soporte" : "Support",
  });
}

export async function sendTransactionalEmail(input: TransactionalEmailInput): Promise<EmailDeliveryResult> {
  const client = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!client || !from) {
    return { status: "skipped", reason: "Resend transactional email is not configured." };
  }

  try {
    const { data, error } = await client.emails.send(
      {
        from,
        to: input.to,
        replyTo: process.env.RESEND_REPLY_TO?.trim() || undefined,
        subject: input.subject,
        html: input.html,
        text: input.text,
        tags: [{ name: "category", value: input.category }],
      },
      { idempotencyKey: input.idempotencyKey }
    );

    if (error || !data?.id) {
      return { status: "failed", error: error?.message || "Resend did not return an email ID." };
    }

    return { status: "sent", id: data.id };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Unexpected Resend delivery failure.",
    };
  }
}

export async function subscribeResendContact(email: string) {
  const client = getResendContactsClient();
  if (!client) {
    return { ok: false, error: "Resend contacts are not configured." } as const;
  }

  const topicId = process.env.RESEND_NEWSLETTER_TOPIC_ID?.trim();
  const topics = topicId ? [{ id: topicId, subscription: "opt_in" as const }] : undefined;
  const existing = await client.contacts.get({ email });

  if (existing.data) {
    const updated = await client.contacts.update({ email, unsubscribed: false });
    if (updated.error) {
      return { ok: false, error: updated.error.message } as const;
    }

    if (topics) {
      const topicUpdate = await client.contacts.topics.update({ email, topics });
      if (topicUpdate.error) {
        return { ok: false, error: topicUpdate.error.message } as const;
      }
    }

    return { ok: true } as const;
  }

  if (existing.error && existing.error.statusCode !== 404) {
    return { ok: false, error: existing.error.message } as const;
  }

  const created = await client.contacts.create({
    email,
    unsubscribed: false,
    topics,
  });

  return created.error
    ? ({ ok: false, error: created.error.message } as const)
    : ({ ok: true } as const);
}
