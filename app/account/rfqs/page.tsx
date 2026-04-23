import { redirect } from "next/navigation";

export default function AccountRfqsRedirectPage() {
  redirect("/account/inbox");
}
