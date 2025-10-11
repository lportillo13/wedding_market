import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AuthMenu() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link href="/login" className="btn btn-outline-secondary ms-auto">
        Log in
      </Link>
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
