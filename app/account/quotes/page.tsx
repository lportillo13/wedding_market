import { redirect } from "next/navigation";

export default function AccountQuotesRedirectPage() {
  redirect("/account/inbox");
}
