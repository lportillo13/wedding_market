import Link from "next/link";
import { getRoles } from "@/lib/auth/roles";
import AuthDropdown from "@/components/AuthDropdown";

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

  return <AuthDropdown user={user} isVendor={isVendor} />;
}
