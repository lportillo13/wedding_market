import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import SignUpPageContent from './SignUpPageContent';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<{ modal?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const params = await searchParams;

  if (user) {
    redirect('/');
  }

  return <SignUpPageContent openModalOnLoad={params?.modal === 'create-account'} />;
}
