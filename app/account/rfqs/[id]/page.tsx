import { redirect } from "next/navigation";

export default async function AccountRfqDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/account/inbox?rfq=${encodeURIComponent(id)}`);
}
