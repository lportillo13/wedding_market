import Link from "next/link";
import {redirect} from 'next/navigation';
import {getRoles} from '@/lib/auth/roles';
import {loadInboxAccess} from '@/features/accounts/server/inbox-access';
import AccountLayoutHeader from '@/app/account/AccountLayoutHeader';
import { AppointmentInboxLink } from '@/features/boutiques/client/AppointmentInbox';
import InboxPageView from "@/components/inbox/InboxPageView";
import { buildAutocompleteSuggestions } from "@/lib/search/autocomplete";
import { getRequestI18n } from "@/lib/i18n/server";
import { loadClientInboxThreads } from "@/features/conversations/server/inbox";
import {
  presentInboxConversation,
  type InboxFilters,
} from "@/lib/inbox-presentation";
import {
  closeAccountInboxThreads,
  markAccountInboxThreadRead,
  restoreAccountInboxThreads,
} from "@/app/account/inbox/actions";

export default async function AccountInboxPage({
  searchParams,
}: {
  searchParams?: Promise<InboxFilters>;
}) {
  const access = await loadInboxAccess(getRoles);
  if (access.status === 'guest') redirect('/login?next=%2Faccount%2Finbox');
  if (access.status === 'vendor') redirect('/vendor/inbox');
  const { dictionary, language } = await getRequestI18n();
  if (access.status === 'unavailable') return <div className="wm-account-workspace">
    <AccountLayoutHeader clientWorkspace={false} />
    <main className="container py-4"><h1>{dictionary.inbox.title}</h1>
      <p role="alert">{dictionary.login.feedback.unavailable}</p>
      <Link href="/account/profile">{dictionary.auth.personalProfile}</Link>
    </main>
  </div>;
  const filters = searchParams ? await searchParams : {};
  const {user} = access;

  const page = Math.max(
    1,
    Math.min(Number.parseInt(filters.page ?? "1", 10) || 1, 1000),
  );
  const result = await loadClientInboxThreads(user.id, filters.rfq ?? null, {
    page,
    query: filters.q,
    archived: filters.view === "deleted",
  });
  const items = result.items.map((item) =>
    presentInboxConversation(item, "client", language),
  );
  const suggestions = buildAutocompleteSuggestions(
    items.flatMap((item) => [
      item.title,
      item.location,
      item.preview,
      item.requestReference,
    ]),
  );
  return (
    <div className="wm-account-workspace"><AccountLayoutHeader />
    <div className="container"><AppointmentInboxLink /></div>
    <InboxPageView
      scope="client"
      language={language}
      items={items}
      total={result.total}
      activeCount={result.activeCount}
      deletedCount={result.archivedCount}
      page={page}
      filters={filters}
      suggestions={suggestions}
      markThreadRead={markAccountInboxThreadRead}
      deleteThreads={closeAccountInboxThreads}
      restoreThreads={restoreAccountInboxThreads}
    /></div>
  );
}
