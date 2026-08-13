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
  const preview = escapeEmailHtml(input.preview);
  const title = escapeEmailHtml(input.title);
  const body = escapeEmailHtml(input.body);
  const actionLabel = escapeEmailHtml(input.actionLabel);
  const actionUrl = escapeEmailHtml(getSafeEmailUrl(input.actionUrl, baseUrl));
  const detail = input.detail?.trim() ? escapeEmailHtml(input.detail.trim()) : null;
  const eyebrow = escapeEmailHtml(
    input.eyebrow?.trim() || (language === "es" ? "ACTUALIZACIÓN DE CUENTA" : "ACCOUNT UPDATE")
  );
  const detailLabel = escapeEmailHtml(
    input.detailLabel?.trim() || (language === "es" ? "VISTA PREVIA DEL MENSAJE" : "MESSAGE PREVIEW")
  );
  const logoUrl = escapeEmailHtml(`${baseUrl}/icon-192.png`);
  const homeUrl = escapeEmailHtml(baseUrl);
  const privacyUrl = escapeEmailHtml(`${baseUrl}/privacy`);
  const termsUrl = escapeEmailHtml(`${baseUrl}/terms`);
  const fallbackLead = language === "es" ? "Si el bot&oacute;n no funciona, copia este enlace:" : "If the button does not work, copy this link:";
  const securityNote =
    language === "es"
      ? "Este es un mensaje transaccional sobre actividad segura en tu cuenta de The Wedding Market."
      : "This is a transactional message about secure activity in your account on The Wedding Market.";
  const helpText = language === "es" ? "No respondas con informaci&oacute;n sensible." : "Do not reply with sensitive information.";
  const privacyLabel = language === "es" ? "Privacidad" : "Privacy";
  const termsLabel = language === "es" ? "T&eacute;rminos" : "Terms";

  return `<!doctype html>
<html lang="${language}" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${title}</title>
    <!--[if mso]>
    <noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
    <![endif]-->
    <style>
      html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
      table, td { border-collapse: collapse !important; }
      img { border: 0; display: block; line-height: 100%; outline: none; text-decoration: none; }
      a { color: inherit; }
      .wm-shell { width: 100%; max-width: 640px; }
      .wm-title { font-family: Georgia, 'Times New Roman', serif !important; }
      @media only screen and (max-width: 640px) {
        .wm-page { padding: 18px 10px !important; }
        .wm-header { padding: 24px 22px 30px !important; }
        .wm-content { padding: 30px 22px 12px !important; }
        .wm-action { padding: 20px 22px 34px !important; }
        .wm-footer { padding: 24px 22px !important; }
        .wm-title { font-size: 32px !important; line-height: 38px !important; }
        .wm-logo-name { font-size: 17px !important; }
        .wm-button { display: block !important; text-align: center !important; }
      }
    </style>
  </head>
  <body style="margin:0 !important;padding:0 !important;background:#f5f5f3;color:#09090f;font-family:Arial,Helvetica,sans-serif;word-spacing:normal;">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preview}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f5f5f3" style="width:100%;background:#f5f5f3;">
      <tr>
        <td class="wm-page" align="center" style="padding:40px 16px;">
          <table class="wm-shell" role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #e2dfd8;border-radius:24px;box-shadow:0 18px 48px rgba(9,9,15,0.09);overflow:hidden;">
            <tr>
              <td height="5" bgcolor="#b8922a" style="height:5px;background:#b8922a;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td class="wm-header" bgcolor="#09090f" style="background:#09090f;padding:28px 38px 38px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="middle" style="padding-bottom:38px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td width="48" valign="middle">
                            <a href="${homeUrl}" aria-label="The Wedding Market" style="text-decoration:none;">
                              <img src="${logoUrl}" width="48" height="48" alt="" style="width:48px;height:48px;border-radius:12px;">
                            </a>
                          </td>
                          <td valign="middle" style="padding-left:14px;">
                            <a href="${homeUrl}" style="text-decoration:none;color:#ffffff;">
                              <div style="font-size:9px;line-height:11px;font-weight:700;letter-spacing:3px;color:#b8922a;">THE</div>
                              <div class="wm-logo-name" style="font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:23px;letter-spacing:.2px;color:#ffffff;">WEDDING MARKET</div>
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div style="margin:0 0 13px;font-size:11px;line-height:16px;font-weight:700;letter-spacing:2.4px;color:#d2ad43;">${eyebrow}</div>
                      <h1 class="wm-title" style="margin:0;max-width:520px;font-family:Georgia,'Times New Roman',serif;font-size:40px;line-height:47px;font-weight:400;letter-spacing:-.5px;color:#ffffff;">${title}</h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="wm-content" bgcolor="#ffffff" style="background:#ffffff;padding:38px 38px 12px;">
                <p style="margin:0;font-size:17px;line-height:29px;color:#3d3d43;">${body}</p>
                ${detail ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:26px;background:#faf8f3;border:1px solid #e7dfc9;border-radius:16px;"><tr><td style="padding:20px 22px;"><div style="margin:0 0 9px;font-size:10px;line-height:14px;font-weight:700;letter-spacing:2px;color:#9a7820;">${detailLabel}</div><div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:28px;font-style:italic;color:#242429;">&ldquo;${detail}&rdquo;</div></td></tr></table>` : ""}
              </td>
            </tr>
            <tr>
              <td class="wm-action" bgcolor="#ffffff" style="background:#ffffff;padding:24px 38px 42px;">
                <!--[if mso]>
                <v:roundrect href="${actionUrl}" style="height:52px;v-text-anchor:middle;width:230px;" arcsize="14%" stroke="f" fillcolor="#09090f">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">${actionLabel}</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-- -->
                <a class="wm-button" href="${actionUrl}" style="display:inline-block;background:#09090f;border:1px solid #09090f;border-radius:8px;color:#ffffff;font-size:15px;line-height:20px;font-weight:700;text-decoration:none;padding:15px 24px;box-shadow:0 8px 20px rgba(9,9,15,.16);">${actionLabel}&nbsp;&nbsp;<span style="color:#d2ad43;">&rarr;</span></a>
                <!--<![endif]-->
                <div style="margin-top:22px;font-size:11px;line-height:18px;color:#85858a;">${fallbackLead}<br><a href="${actionUrl}" style="color:#7d6018;text-decoration:underline;word-break:break-all;">${actionUrl}</a></div>
              </td>
            </tr>
            <tr>
              <td class="wm-footer" bgcolor="#f5f5f3" style="background:#f5f5f3;border-top:1px solid #e2dfd8;padding:26px 38px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size:11px;line-height:18px;color:#727277;">
                      ${securityNote}<br>${helpText}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:16px;font-size:11px;line-height:18px;color:#727277;">
                      <a href="${homeUrl}" style="color:#09090f;font-weight:700;text-decoration:none;">thewedmarket.com</a>
                      <span style="color:#b8922a;padding:0 8px;">&bull;</span>
                      <a href="${privacyUrl}" style="color:#727277;text-decoration:underline;">${privacyLabel}</a>
                      <span style="color:#b8922a;padding:0 8px;">&bull;</span>
                      <a href="${termsUrl}" style="color:#727277;text-decoration:underline;">${termsLabel}</a>
                    </td>
                  </tr>
                </table>
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
