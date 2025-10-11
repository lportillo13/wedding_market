import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import SignUpPageContent from './SignUpPageContent';

export default async function SignUpPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/');
  }

  return <SignUpPageContent />;
}
