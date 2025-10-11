import { getRoles } from "@/lib/auth/roles";
import AuthDropdown from "@/components/AuthDropdown";
import GuestAuthActions from "@/components/GuestAuthActions";

export default async function AuthMenu() {
  const { user, isVendor } = await getRoles();

  if (!user) {
    return <GuestAuthActions />;
  }

  return <AuthDropdown user={user} isVendor={isVendor} />;
}
