import ForgotPasswordClient from "./ForgotPasswordClient";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return <ForgotPasswordClient recoveryError={params.error === "recovery"} />;
}
