import Link from "next/link";
import { redirect } from "next/navigation";
import InboxPageView from "@/components/inbox/InboxPageView";
import { buildAutocompleteSuggestions } from "@/lib/search/autocomplete";
import { getRequestI18n } from "@/lib/i18n/server";
import { getRoles } from "@/lib/auth/roles";
import { loadVendorInboxThreads } from "@/lib/inbox";
import {
  presentInboxConversation,
  type InboxFilters,
} from "@/lib/inbox-presentation";
import {
  closeVendorInboxThreads,
  markVendorInboxThreadRead,
  restoreVendorInboxThreads,
} from "./actions";

export default async function VendorInboxPage({
  searchParams,
}: {
  searchParams?: Promise<InboxFilters>;
}) {
  const { user, isVendor } = await getRoles();
  if (!user || !isVendor) redirect("/signup/vendor");
  const { dictionary, language } = await getRequestI18n();
  const filters = searchParams ? await searchParams : {};
  const page = Math.max(
    1,
    Math.min(Number.parseInt(filters.page ?? "1", 10) || 1, 1000),
  );
  const result = await loadVendorInboxThreads(user.id, {
    page,
    query: filters.q,
    archived: filters.view === "deleted",
  });
  if (!result.vendor)
    return (
      <main className="pb-4">
        <h1>{dictionary.inbox.title}</h1>
        <p>
          {dictionary.vendorRfqs.noProfile.message}{" "}
          <Link href="/vendor/profile">
            {dictionary.vendorRfqs.noProfile.linkLabel}
          </Link>
        </p>
      </main>
    );
  const items = result.items.map((item) =>
    presentInboxConversation(item, "vendor", language),
  );
  const suggestions = buildAutocompleteSuggestions(
    items.flatMap((item) => [
      item.title,
      item.location,
      item.preview,
      item.requestReference,
      item.guests,
    ]),
  );
  return (
    <InboxPageView
      scope="vendor"
      language={language}
      items={items}
      total={result.total}
      activeCount={result.activeCount}
      deletedCount={result.archivedCount}
      page={page}
      filters={filters}
      suggestions={suggestions}
      vendorName={result.vendor.business_name}
      markThreadRead={markVendorInboxThreadRead}
      deleteThreads={closeVendorInboxThreads}
      restoreThreads={restoreVendorInboxThreads}
    />
  );
}
