import { Resend } from "resend";

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

export function renderTransactionalEmail(input: EmailTemplateInput) {
  const preview = escapeEmailHtml(input.preview);
  const title = escapeEmailHtml(input.title);
  const body = escapeEmailHtml(input.body);
  const actionLabel = escapeEmailHtml(input.actionLabel);
  const actionUrl = escapeEmailHtml(input.actionUrl);
  const detail = input.detail?.trim() ? escapeEmailHtml(input.detail.trim()) : null;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#f7f3f5;color:#2e2029;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f3f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #eadde3;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="background:#5a304a;padding:22px 28px;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:.2px;">
                Wedding Market
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 12px;">
                <h1 style="margin:0 0 14px;font-size:25px;line-height:1.25;color:#2e2029;">${title}</h1>
                <p style="margin:0;font-size:16px;line-height:1.65;color:#5d4b55;">${body}</p>
                ${detail ? `<div style="margin-top:20px;padding:16px 18px;background:#faf6f8;border-left:4px solid #bb7b96;border-radius:10px;font-size:15px;line-height:1.55;color:#493842;">${detail}</div>` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 34px;">
                <a href="${actionUrl}" style="display:inline-block;background:#5a304a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 22px;border-radius:999px;">${actionLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #eee4e8;padding:18px 28px;font-size:12px;line-height:1.5;color:#8a7580;">
                This transactional message was sent because activity occurred in your Wedding Market account.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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
