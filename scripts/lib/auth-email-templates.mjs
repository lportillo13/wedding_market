import { renderBrandedEmail } from '../../shared/email/template.ts';

const localized = (en, es) => `{{ if eq .Data.language "es" }}${es}{{ else }}${en}{{ end }}`;
const confirmation = '{{ .ConfirmationURL }}';
const recovery = '{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/reset-password';
const securityNote = localized('If you did not make this change, reset your password and contact hello@thewedmarket.com.', 'Si no hiciste este cambio, restablece tu contrase&ntilde;a y contacta a hello@thewedmarket.com.');
const securityDetails = {
  email_changed: `${localized('Previous email','Correo anterior')}: {{ .OldEmail }}<br>${localized('Current email','Correo actual')}: {{ .Email }}`,
  phone_changed: `${localized('Previous phone','Tel&eacute;fono anterior')}: {{ .OldPhone }}<br>${localized('Current phone','Tel&eacute;fono actual')}: {{ .Phone }}`,
  identity_linked: '{{ .Provider }}',
  identity_unlinked: '{{ .Provider }}',
  mfa_factor_enrolled: '{{ .FactorType }}',
  mfa_factor_unenrolled: '{{ .FactorType }}',
};

// Keep notification enablement separate: publishing appearance must not change delivery policy.
export const authEmailDefinitions = [
  {type:'confirmation', file:'confirmation.html', subject:'Confirm your email',
    title:localized('A little closer to your celebration.', 'Un paso m&aacute;s cerca de tu celebraci&oacute;n.'),
    eyebrow:localized('WELCOME TO WEDDING MARKET', 'BIENVENIDO A WEDDING MARKET'),
    body:localized('Confirm your email to activate your Wedding Market account. Whether you are planning a wedding or sharing your services, your next chapter starts here.', 'Confirma tu correo para activar tu cuenta de Wedding Market. Ya sea que planees una boda o compartas tus servicios, tu pr&oacute;xima etapa comienza aqu&iacute;.'),
    action:localized('Confirm my email', 'Confirmar mi correo'), url:confirmation,
    note:localized('You received this email because someone registered with this address. If it was not you, you can ignore this message.', 'Recibiste este correo porque alguien se registr&oacute; con esta direcci&oacute;n. Si no fuiste t&uacute;, puedes ignorarlo.')},
  {type:'recovery', file:'recovery.html', subject:'Reset your password',
    title:localized('Let\u2019s get you back in.', 'Volvamos a tu cuenta.'),
    body:localized('Use the secure link below to choose a new password. For your security, this link expires and can only be used once.', 'Usa el enlace seguro para elegir una nueva contrase&ntilde;a. Por tu seguridad, el enlace vence y solo puede utilizarse una vez.'),
    action:localized('Reset my password', 'Restablecer contrase&ntilde;a'), url:recovery,
    note:localized('If you did not request a new password, you can ignore this email. Your password will stay the same.', 'Si no solicitaste una nueva contrase&ntilde;a, puedes ignorar este correo. Tu contrase&ntilde;a seguir&aacute; igual.')},
  {type:'invite', file:'invite.html', subject:'You are invited',
    title:localized('You\u2019re invited.', 'Est&aacute;s invitado.'),
    body:localized('You have been invited to Wedding Market. Accept your invitation to set up your account.', 'Te invitaron a Wedding Market. Acepta la invitaci&oacute;n para configurar tu cuenta.'),
    action:localized('Accept invitation', 'Aceptar invitaci&oacute;n'), url:confirmation,
    note:localized('If you were not expecting this invitation, you can ignore this email.', 'Si no esperabas esta invitaci&oacute;n, puedes ignorar este correo.')},
  {type:'magic_link', file:'magic-link.html', subject:'Your secure sign-in link',
    title:localized('Welcome back.', 'Qu&eacute; gusto verte de nuevo.'),
    body:localized('Your secure sign-in link is ready. It expires and can only be used once.', 'Tu enlace seguro para iniciar sesi&oacute;n est&aacute; listo. Vence y solo puede utilizarse una vez.'),
    action:localized('Sign in to my account', 'Iniciar sesi&oacute;n'), url:confirmation,
    note:localized('If you did not request this link, you can ignore this email.', 'Si no solicitaste este enlace, puedes ignorar este correo.')},
  {type:'email_change', file:'email-change.html', subject:'Confirm your new email',
    title:localized('A new address, the same plans.', 'Un nuevo correo, los mismos planes.'),
    body:localized('Confirm that you want to use this new email address for your Wedding Market account:', 'Confirma que deseas usar este nuevo correo en tu cuenta de Wedding Market:'),
    detail:'{{ .NewEmail }}', action:localized('Confirm new email', 'Confirmar nuevo correo'), url:confirmation,
    note:localized('If you did not request this change, do not open the link. Contact hello@thewedmarket.com.', 'Si no solicitaste este cambio, no abras el enlace. Contacta a hello@thewedmarket.com.')},
  {type:'reauthentication', file:'reauthentication.html', subject:'Your verification code',
    title:localized('One quick security check.', 'Una breve verificaci&oacute;n de seguridad.'),
    body:localized('Enter this code to confirm your identity. It expires and can only be used once.', 'Introduce este c&oacute;digo para confirmar tu identidad. Vence y solo puede utilizarse una vez.'),
    code:'{{ .Token }}', note:localized('Never share this code. If you did not request it, review your account security.', 'Nunca compartas este c&oacute;digo. Si no lo solicitaste, revisa la seguridad de tu cuenta.')},
  ...[
    ['password_changed','Your password was changed','Tu contrase&ntilde;a cambi&oacute;','The password for your Wedding Market account was changed.','Se cambi&oacute; la contrase&ntilde;a de tu cuenta de Wedding Market.'],
    ['email_changed','Your email was changed','Tu correo cambi&oacute;','The email address for your Wedding Market account was changed.','Se cambi&oacute; el correo de tu cuenta de Wedding Market.'],
    ['phone_changed','Your phone number was changed','Tu tel&eacute;fono cambi&oacute;','The authentication phone number for your account was changed.','Se cambi&oacute; el tel&eacute;fono de autenticaci&oacute;n de tu cuenta.'],
    ['identity_linked','A sign-in method was added','Se a&ntilde;adi&oacute; un m&eacute;todo de acceso','A sign-in method was linked to your Wedding Market account.','Se vincul&oacute; un m&eacute;todo de acceso a tu cuenta de Wedding Market.'],
    ['identity_unlinked','A sign-in method was removed','Se elimin&oacute; un m&eacute;todo de acceso','A sign-in method was removed from your Wedding Market account.','Se elimin&oacute; un m&eacute;todo de acceso de tu cuenta de Wedding Market.'],
    ['mfa_factor_enrolled','A verification method was added','Se a&ntilde;adi&oacute; un m&eacute;todo de verificaci&oacute;n','A verification method was added to your Wedding Market account.','Se a&ntilde;adi&oacute; un m&eacute;todo de verificaci&oacute;n a tu cuenta de Wedding Market.'],
    ['mfa_factor_unenrolled','A verification method was removed','Se elimin&oacute; un m&eacute;todo de verificaci&oacute;n','A verification method was removed from your Wedding Market account.','Se elimin&oacute; un m&eacute;todo de verificaci&oacute;n de tu cuenta de Wedding Market.'],
  ].map(([type,title,titleEs,body,bodyEs]) => ({type:`${type}_notification`,file:`${type.replaceAll('_','-')}.html`, subject:title, title:localized(title,titleEs), body:localized(body,bodyEs), detail:securityDetails[type], note:securityNote,
    action:localized('Secure my account','Proteger mi cuenta'),url:'{{ .SiteURL }}/forgot-password'})),
];

export function renderAuthEmail(definition) {
  return renderBrandedEmail({
    language:localized('en','es'), homeUrl:'{{ .SiteURL }}',
    preview:definition.title, title:definition.title,
    eyebrow:definition.eyebrow || localized('YOUR ACCOUNT', 'TU CUENTA'),
    bodyHtml:`<p style="margin:0;">${definition.body}</p>${definition.detail ? `<p style="margin:20px 0 0;padding:18px;background:#f2ede6;border:1px solid #ded5c8;word-break:break-all;">${definition.detail}</p>` : ''}${definition.code ? `<p style="margin:24px 0 0;padding:20px 12px;background:#f2ede6;border:1px solid #ded5c8;border-radius:4px;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:42px;letter-spacing:5px;color:#332d27;">${definition.code}</p>` : ''}`,
    securityNote:definition.note,
    action:definition.action ? {label:definition.action,url:definition.url,fallbackLabel:localized('If the button does not work, copy this link:', 'Si el bot&oacute;n no funciona, copia este enlace:')} : undefined,
    privacyLabel:localized('Privacy','Privacidad'), helpLabel:localized('Support','Soporte'),
  }).replace(/[ \t]+$/gm, '');
}
