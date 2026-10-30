import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getRoles } from '@/lib/auth/roles';
import AccountAccessNotice from '@/components/AccountAccessNotice';

export default async function RfqLayout({ children }: { children: ReactNode }) {
  const { user, isUser, isVendor } = await getRoles();

  if (!user) redirect('/login?next=%2Frfq%2Fnew');
  if (!isUser) return <AccountAccessNotice vendor={isVendor}/>;

  return <>{children}</>;
}
