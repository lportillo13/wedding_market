import type {ReactNode} from 'react';
import {getRoles} from '@/lib/auth/roles';
import AccountLayoutHeader from '@/app/account/AccountLayoutHeader';
export default async function Layout({children}:{children:ReactNode}) {
  const {isUser} = await getRoles();
  return <div className="wm-account-workspace"><AccountLayoutHeader clientWorkspace={isUser}/>{children}</div>;
}