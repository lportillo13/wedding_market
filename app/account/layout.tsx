import Link from 'next/link';
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getRoles } from '@/lib/auth/roles';

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const { isUser } = await getRoles();

  if (!isUser) {
    redirect('/signup');
  }

  return (
    <>
      <div className="container py-4" style={{ maxWidth: 960 }}>
        <h1 className="mb-3">My account</h1>
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <Link className="nav-link" href="/account/profile">
              Profile
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href="/account/rfqs">My RFQs</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href="/account/quotes">Quotes received</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href="/account/reviews">Reviews</Link>
          </li>
        </ul>
      </div>
      {children}
    </>
  );
}
