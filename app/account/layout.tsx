import { ReactNode } from 'react';
import { getRoles } from '@/lib/auth/roles';
import AccountLayoutHeader from './AccountLayoutHeader';
import AccountAccessNotice from '@/components/AccountAccessNotice';

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const { user, isUser, isVendor } = await getRoles();

  // Each page preserves its own sign-in destination; legacy inbox aliases route
  // into the separately authenticated inbox entry point.
  if (!user) return <>{children}</>;
  if (!isUser) return <AccountAccessNotice vendor={isVendor}/>;

  return (
    <div className="wm-account-workspace">
      <AccountLayoutHeader />
      {children}
    </div>
  );
}
