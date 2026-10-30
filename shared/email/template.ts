/** Email-safe Editorial A frame. Callers must escape user content before passing HTML. */
export type BrandedEmailContent = {
  language: string;
  homeUrl: string;
  preview: string;
  eyebrow: string;
  title: string;
  bodyHtml: string;
  securityNote: string;
  action?: { label: string; url: string; fallbackLabel: string };
  privacyLabel: string;
  helpLabel: string;
};

export function renderBrandedEmail(input: BrandedEmailContent) {
  const {homeUrl, action} = input;
  return `<!doctype html>
<html lang="${input.language}" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light">
  <title>${input.title} | Wedding Market</title>
  <!--[if mso]><style>body,table,td,a{font-family:Arial,Helvetica,sans-serif}</style><![endif]-->
  <style>
    html,body{margin:0!important;padding:0!important;width:100%!important}
    table,td{border-collapse:collapse}img{border:0;outline:none;text-decoration:none}
    a{color:#332d27}.wm-title{font-family:Georgia,'Times New Roman',serif!important}
    @media(max-width:620px){.wm-page{padding:18px 10px!important}.wm-header{padding:26px 24px!important}.wm-content{padding:32px 24px!important}.wm-footer{padding:24px!important}.wm-title{font-size:34px!important;line-height:40px!important}.wm-button{display:block!important;text-align:center!important}.wm-wordmark{font-size:17px!important;letter-spacing:1px!important}}
  </style>
</head>
<body style="margin:0;padding:0;background:#f2ede6;color:#332d27;font-family:Arial,Helvetica,sans-serif;word-spacing:normal;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${input.preview}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f2ede6"><tr><td class="wm-page" align="center" style="padding:40px 16px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" bgcolor="#faf8f4" style="width:100%;max-width:600px;background:#faf8f4;border:1px solid #ded5c8;">
      <tr><td class="wm-header" style="padding:30px 40px;border-bottom:1px solid #ded5c8;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
          <td width="42"><a href="${homeUrl}" style="text-decoration:none;"><img src="${homeUrl}/icon-192.png" width="42" height="42" alt="" style="display:block;width:42px;height:42px;border-radius:4px;"></a></td>
          <td style="padding-left:14px;"><a class="wm-wordmark" href="${homeUrl}" style="font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:25px;font-weight:400;letter-spacing:1.4px;text-decoration:none;color:#332d27;">WEDDING MARKET</a></td>
        </tr></table>
      </td></tr>
      <tr><td class="wm-content" style="padding:40px;">
        <p style="margin:0 0 16px;font-size:10px;line-height:16px;letter-spacing:2px;color:#796b5f;">${input.eyebrow}</p>
        <h1 class="wm-title" style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:40px;line-height:47px;letter-spacing:-.6px;font-weight:400;color:#332d27;">${input.title}</h1>
        <div style="font-size:16px;line-height:27px;color:#62564b;">${input.bodyHtml}</div>
        ${action ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding-top:30px;">
          <!--[if mso]><v:roundrect href="${action.url}" style="height:50px;v-text-anchor:middle;width:260px;" arcsize="8%" stroke="f" fillcolor="#332d27"><w:anchorlock/><center style="color:#faf8f4;font-family:Arial,Helvetica,sans-serif;font-size:14px;">${action.label}</center></v:roundrect><![endif]-->
          <!--[if !mso]><!--><a class="wm-button" href="${action.url}" style="display:inline-block;background:#332d27;border:1px solid #332d27;border-radius:4px;color:#faf8f4;font-size:14px;line-height:20px;text-decoration:none;padding:15px 24px;">${action.label}&nbsp;&nbsp;&rarr;</a><!--<![endif]-->
          <p style="margin:24px 0 0;font-size:11px;line-height:18px;color:#796b5f;">${action.fallbackLabel}<br><a href="${action.url}" style="color:#62564b;text-decoration:underline;word-break:break-all;overflow-wrap:anywhere;">${action.url}</a></p>
        </td></tr></table>` : ''}
      </td></tr>
      <tr><td class="wm-footer" style="padding:26px 40px;border-top:1px solid #ded5c8;font-size:11px;line-height:19px;color:#796b5f;">
        <p style="margin:0 0 16px;">${input.securityNote}</p>
        <p style="margin:0;"><a href="${homeUrl}" style="color:#332d27;text-decoration:none;">thewedmarket.com</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="${homeUrl}/privacy" style="color:#796b5f;">${input.privacyLabel}</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="mailto:hello@thewedmarket.com" style="color:#796b5f;">${input.helpLabel}</a></p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}
