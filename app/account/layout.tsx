import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getRoles } from '@/lib/auth/roles';

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const { isUser } = await getRoles();

  if (!isUser) {
    redirect('/signup');
  }

  return <>{children}</>;
}
