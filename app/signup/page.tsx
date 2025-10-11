import Link from 'next/link';
import { redirect } from 'next/navigation';
import SignUpForm from './SignUpForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function SignUpPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/');
  }

  return (
    <main className="container py-5" style={{ maxWidth: 480 }}>
      <h1 className="mb-3">Create your account</h1>
      <p className="text-secondary mb-4">
        Sign up to request quotes, track vendors, and leave reviews.
      </p>
      <SignUpForm />
      <p className="mt-3 text-center">
        Already have an account?{' '}
        <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
