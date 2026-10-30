import ForgotPasswordClient from "./ForgotPasswordClient";
import { safeAuthNextPath } from "@/lib/auth-redirect";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  return <ForgotPasswordClient recoveryError={params.error === "recovery"} nextPath={safeAuthNextPath(params.next, "/account/profile")} />;
}
