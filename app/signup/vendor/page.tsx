import { redirect } from 'next/navigation';
import { getRoles } from '@/lib/auth/roles';
import VendorSignupGate from './VendorSignupGate';
import VendorSignupPageContent from './VendorSignupPageContent';

export default async function VendorSignupPage() {
  const { user, isVendor } = await getRoles();

  if (!user) {
    return <VendorSignupGate />;
  }

  if (isVendor) {
    redirect('/vendor');
  }

  return <VendorSignupPageContent />;
}
