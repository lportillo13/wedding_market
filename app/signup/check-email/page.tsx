import CheckEmailClient from './CheckEmailClient';

export default async function CheckEmail({ searchParams }: {
  searchParams: Promise<{ lang?: string; vendor?: string }>;
}) {
  const params = await searchParams;
  return <CheckEmailClient vendor={params.vendor === '1'} initialLanguage={params.lang === 'en' || params.lang === 'es' ? params.lang : undefined} />;
}
