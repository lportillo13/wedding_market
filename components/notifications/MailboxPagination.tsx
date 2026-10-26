import Link from 'next/link';

export default function MailboxPagination({ base, query, page, total, language }: {
  base: string; query: string; page: number; total: number; language: 'en' | 'es';
}) {
  const pages = Math.max(1,Math.ceil(total/50));
  if (pages <= 1) return null;
  const href = (next: number) => `${base}?${new URLSearchParams({ ...(query ? {q:query} : {}),page:String(next) })}`;
  return <nav className="d-flex align-items-center justify-content-between gap-3 mt-4" aria-label={language === 'es' ? 'Páginas de notificaciones' : 'Notification pages'}>
    {page > 1 ? <Link className="btn btn-outline-secondary btn-sm" href={href(page-1)}>{language === 'es' ? 'Anterior' : 'Previous'}</Link> : <span />}
    <span className="small text-muted">{language === 'es' ? 'Página' : 'Page'} {page} / {pages}</span>
    {page < pages ? <Link className="btn btn-outline-secondary btn-sm" href={href(page+1)}>{language === 'es' ? 'Siguiente' : 'Next'}</Link> : <span />}
  </nav>;
}
