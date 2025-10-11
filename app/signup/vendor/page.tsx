import Link from 'next/link';
import { redirect } from 'next/navigation';
import VendorSignUpForm from './VendorSignUpForm';
import { getRoles } from '@/lib/auth/roles';

export default async function VendorSignupPage() {
  const { user, isVendor } = await getRoles();

  if (!user) {
    return (
      <main className="container py-5" style={{ maxWidth: 520 }}>
        <h1 className="mb-3">Become a vendor</h1>
        <p className="text-secondary mb-4">
          Log in or create an account to start building your vendor profile.
        </p>
        <Link className="btn btn-primary" href="/login?next=/signup/vendor">
          Log in
        </Link>
        <p className="mt-3">
          New here? <Link href="/signup">Sign up first</Link>.
        </p>
      </main>
    );
  }

  if (isVendor) {
    redirect('/vendor');
  }

  return (
    <main className="container py-5" style={{ maxWidth: 520 }}>
      <h1 className="mb-3">Create your vendor profile</h1>
      <p className="text-secondary mb-4">
        Tell us who you are so we can set up your vendor dashboard.
      </p>
      <VendorSignUpForm />
    </main>
  );
}
