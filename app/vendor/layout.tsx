import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getRoles } from '@/lib/auth/roles';
import VendorDashboardHeader from './VendorDashboardHeader';

export default async function VendorLayout({ children }: { children: ReactNode }) {
  const { user, isVendor } = await getRoles();

  if (!user || !isVendor) {
    redirect('/signup/vendor');
  }

  return (
    <div className="container py-4">
      <VendorDashboardHeader />
      {children}
    </div>
  );
}
