import Link from 'next/link';
import { getRoles } from '@/lib/auth/roles';

export default async function AuthMenu() {
  const { user, isVendor } = await getRoles();

  if (!user) {
    return (
      <div className="d-flex align-items-center gap-2 ms-auto">
        <Link href="/signup" className="btn btn-primary">
          Sign up
        </Link>
        <Link href="/login" className="btn btn-outline-secondary">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="dropdown ms-auto">
      <button
        className="btn btn-outline-secondary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        {user.email ?? 'Account'}
      </button>
      <ul className="dropdown-menu dropdown-menu-end">
        <li>
          <Link className="dropdown-item" href="/account">
            Account
          </Link>
        </li>
        {!isVendor && (
          <li>
            <Link className="dropdown-item" href="/signup/vendor">
              Create vendor profile
            </Link>
          </li>
        )}
        <li>
          <form action="/auth/signout" method="post">
            <button className="dropdown-item" type="submit">
              Log out
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}
