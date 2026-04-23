"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildThreadKey, markClientThreadRead, parseThreadKey } from "@/lib/inbox";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";
import { getSupabaseServer } from "@/lib/supabase/server";

function shouldUseAdminFallback(message: string | undefined) {
  return /policy|permission|row-level security|infinite recursion detected/i.test(message ?? "");
}

function getThreadKeys(formData: FormData) {
  const onlyThreadKey = formData.get("onlyThreadKey")?.toString();
  if (onlyThreadKey) {
    return [onlyThreadKey];
  }

  return formData
    .getAll("threadKeys")
    .map((value) => value.toString())
    .filter(Boolean);
}

async function loadOwnedRfqIds(client: SupabaseClient, userId: string) {
  const selectColumns = {
    owner_id: "id, owner_id",
    owner_uuid: "id, owner_id:owner_uuid",
  } as const satisfies Record<OwnerColumn, string>;

  const selectRfqs = (supabase: SupabaseClient, ownerColumn: OwnerColumn) =>
    supabase.from("rfqs").select(selectColumns[ownerColumn]).eq(ownerColumn, userId);

  let ownerColumn: OwnerColumn = "owner_id";
  let { data, error } = await selectRfqs(client, ownerColumn);

  if (isMissingOwnerColumnError(error, ownerColumn)) {
    ownerColumn = "owner_uuid";
    const retry = await selectRfqs(client, ownerColumn);
    data = retry.data;
    error = retry.error;
  }

  return { data: (data ?? []) as { id: string }[], error };
}

async function updateThreads(
  userId: string,
  threadKeys: string[],
  update: { closed_at: string | null; closed_reason: string | null }
) {
  const supabase = await getSupabaseServer();
  const supabaseAdmin = createSupabaseAdminClient();

  let ownedRfqsResult = await loadOwnedRfqIds(supabase, userId);
  if (ownedRfqsResult.error && supabaseAdmin && shouldUseAdminFallback(ownedRfqsResult.error.message)) {
    ownedRfqsResult = await loadOwnedRfqIds(supabaseAdmin, userId);
  }
  if (ownedRfqsResult.error) {
    throw new Error(ownedRfqsResult.error.message);
  }

  const ownedRfqIds = new Set(ownedRfqsResult.data.map((rfq) => rfq.id));
  const validPairs = threadKeys
    .map((threadKey) => parseThreadKey(threadKey))
    .filter((pair): pair is { rfqId: string; vendorId: string } => Boolean(pair))
    .filter((pair) => ownedRfqIds.has(pair.rfqId));

  if (!validPairs.length) {
    return;
  }

  for (const pair of validPairs) {
    let { error } = await supabase
      .from("rfq_invites")
      .update(update)
      .eq("rfq_id", pair.rfqId)
      .eq("vendor_id", pair.vendorId);

    if (error && supabaseAdmin && shouldUseAdminFallback(error.message)) {
      const retry = await supabaseAdmin
        .from("rfq_invites")
        .update(update)
        .eq("rfq_id", pair.rfqId)
        .eq("vendor_id", pair.vendorId);
      error = retry.error;
    }

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/account/inbox/${encodeURIComponent(buildThreadKey(pair.rfqId, pair.vendorId))}`);
    revalidatePath(`/vendor/inbox/${encodeURIComponent(buildThreadKey(pair.rfqId, pair.vendorId))}`);
  }

  revalidatePath("/account/inbox");
  revalidatePath("/vendor/inbox");
}

export async function markAccountInboxThreadRead(threadKey: string) {
  if (!threadKey) {
    return;
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await markClientThreadRead(user.id, threadKey);

  revalidatePath("/account/inbox");
  revalidatePath(`/account/inbox/${encodeURIComponent(threadKey)}`);
}

export async function closeAccountInboxThreads(formData: FormData) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const threadKeys = getThreadKeys(formData);
  if (!threadKeys.length) {
    return;
  }

  await updateThreads(user.id, threadKeys, {
    closed_at: new Date().toISOString(),
    closed_reason: "archived_by_client",
  });
}

export async function restoreAccountInboxThreads(formData: FormData) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const threadKeys = getThreadKeys(formData);
  if (!threadKeys.length) {
    return;
  }

  await updateThreads(user.id, threadKeys, {
    closed_at: null,
    closed_reason: null,
  });
}
