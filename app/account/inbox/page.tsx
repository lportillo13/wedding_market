import Link from "next/link";
import InboxPageView from "@/components/inbox/InboxPageView";
import { buildAutocompleteSuggestions } from "@/lib/search/autocomplete";
import { getRequestI18n } from "@/lib/i18n/server";
import { loadClientInboxThreads } from "@/lib/inbox";
import {
  presentInboxConversation,
  type InboxFilters,
} from "@/lib/inbox-presentation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  closeAccountInboxThreads,
  markAccountInboxThreadRead,
  restoreAccountInboxThreads,
} from "./actions";

export default async function AccountInboxPage({
  searchParams,
}: {
  searchParams?: Promise<InboxFilters>;
}) {
  const { dictionary, language } = await getRequestI18n();
  const filters = searchParams ? await searchParams : {};
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return (
      <main className="container py-4">
        <h1>{dictionary.inbox.title}</h1>
        <p>{dictionary.account.profile.loginRequired}</p>
        <Link
          className="btn btn-primary"
          href={`/login?next=${encodeURIComponent("/account/inbox")}`}
        >
          {dictionary.nav.logIn}
        </Link>
      </main>
    );

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
    />
  );
}
