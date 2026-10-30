import {getApplicationBaseUrl, renderTransactionalEmail} from '@/lib/resend';

export function buildDeletionEmail(job: {id: string; contact_email: string; language: string}) {
  const spanish = job.language === 'es';
  const title = spanish ? 'Tu cuenta se ha eliminado.' : 'Your account has been deleted.';
  const text = spanish
    ? 'Tu cuenta Wedding Market y sus datos asociados se han eliminado del servicio activo. Las copias de respaldo aisladas siguen su ciclo de conservación según la Política de Privacidad. Los contratos independientes con proveedores no se cancelan.'
    : 'Your Wedding Market account and its associated data have been deleted from the active service. Isolated backups follow their retention lifecycle as described in the Privacy Policy. Separate vendor contracts are not cancelled.';
  const privacyUrl = `${getApplicationBaseUrl()}/privacy`;
  return {
    to: job.contact_email,
    subject: spanish ? 'Wedding Market: cuenta eliminada' : 'Wedding Market: account deleted',
    text: `${text}\n\n${spanish ? 'Referencia' : 'Reference'}: ${job.id}\n\n${privacyUrl}`,
    html: renderTransactionalEmail({
      preview: title, title, body: text, language: spanish ? 'es' : 'en',
      eyebrow: spanish ? 'CONFIRMACIÓN DE ELIMINACIÓN' : 'DELETION CONFIRMATION',
      detail: job.id, detailLabel: spanish ? 'REFERENCIA' : 'REFERENCE',
      actionLabel: spanish ? 'Leer la Política de Privacidad' : 'Read the Privacy Policy',
      actionUrl: privacyUrl,
    }),
    idempotencyKey: `account-deletion-${job.id}`,
    category: 'account-deletion',
  };
}
