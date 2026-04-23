"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ACCOUNT_NOTIFICATION_TYPES, VENDOR_NOTIFICATION_TYPES } from "@/lib/notifications";
import { getSupabaseServer } from "@/lib/supabase/server";

type NotificationClient = SupabaseClient;
type MutationResult = { error: { message?: string } | null };

function getScopedTypes(scope: string | null) {
  return scope === "vendor" ? [...VENDOR_NOTIFICATION_TYPES] : [...ACCOUNT_NOTIFICATION_TYPES];
}

function getNotificationIds(formData: FormData) {
  const onlyId = formData.get("onlyId")?.toString();
  if (onlyId) {
    return [onlyId];
  }

  return formData
    .getAll("ids")
    .map((value) => value.toString())
    .filter(Boolean);
}

async function getAuthenticatedContext() {
  const supabase = await getSupabaseServer();
  const supabaseAdmin = createSupabaseAdminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated.");
  }

  return { supabase, supabaseAdmin, userId: user.id };
}

async function runWithPermissionFallback(
  execute: (client: NotificationClient, userId: string) => Promise<MutationResult>
) {
  const { supabase, supabaseAdmin, userId } = await getAuthenticatedContext();

  let result = await execute(supabase, userId);

  if (result.error?.message?.toLowerCase().includes("permission denied") && supabaseAdmin) {
    result = await execute(supabaseAdmin, userId);
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath("/account/notifications");
  revalidatePath("/account/notifications/deleted");
  revalidatePath("/vendor/notifications");
  revalidatePath("/vendor/notifications/deleted");
}

export async function deleteNotification(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) {
    throw new Error("Missing notification id.");
  }

  const deletedAt = new Date().toISOString();
  await runWithPermissionFallback(async (client, userId) =>
    await client
      .from("notifications")
      .update({ deleted_at: deletedAt })
      .eq("id", id)
      .eq("recipient_id", userId)
      .is("deleted_at", null)
  );
}

export async function deleteAllNotifications(formData: FormData) {
  const deletedAt = new Date().toISOString();
  const scopedTypes = getScopedTypes(formData.get("scope")?.toString() ?? null);
  await runWithPermissionFallback(async (client, userId) =>
    await client
      .from("notifications")
      .update({ deleted_at: deletedAt })
      .eq("recipient_id", userId)
      .in("type", scopedTypes)
      .is("deleted_at", null)
  );
}

export async function deleteSelectedNotifications(formData: FormData) {
  const ids = getNotificationIds(formData);
  if (!ids.length) {
    return;
  }

  const deletedAt = new Date().toISOString();
  await runWithPermissionFallback(async (client, userId) =>
    await client
      .from("notifications")
      .update({ deleted_at: deletedAt })
      .eq("recipient_id", userId)
      .in("id", ids)
      .is("deleted_at", null)
  );
}

export async function restoreNotification(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) {
    throw new Error("Missing notification id.");
  }

  await runWithPermissionFallback(async (client, userId) =>
    await client
      .from("notifications")
      .update({ deleted_at: null })
      .eq("id", id)
      .eq("recipient_id", userId)
      .not("deleted_at", "is", null)
  );
}

export async function restoreSelectedNotifications(formData: FormData) {
  const ids = getNotificationIds(formData);
  if (!ids.length) {
    return;
  }

  await runWithPermissionFallback(async (client, userId) =>
    await client
      .from("notifications")
      .update({ deleted_at: null })
      .eq("recipient_id", userId)
      .in("id", ids)
      .not("deleted_at", "is", null)
  );
}

export async function permanentlyDeleteNotification(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) {
    throw new Error("Missing notification id.");
  }

  await runWithPermissionFallback(async (client, userId) =>
    await client
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("recipient_id", userId)
      .not("deleted_at", "is", null)
  );
}

export async function permanentlyDeleteSelectedNotifications(formData: FormData) {
  const ids = getNotificationIds(formData);
  if (!ids.length) {
    return;
  }

  await runWithPermissionFallback(async (client, userId) =>
    await client
      .from("notifications")
      .delete()
      .eq("recipient_id", userId)
      .in("id", ids)
      .not("deleted_at", "is", null)
  );
}

export async function permanentlyDeleteAllNotifications(formData: FormData) {
  const scopedTypes = getScopedTypes(formData.get("scope")?.toString() ?? null);
  await runWithPermissionFallback(async (client, userId) =>
    await client
      .from("notifications")
      .delete()
      .eq("recipient_id", userId)
      .in("type", scopedTypes)
      .not("deleted_at", "is", null)
  );
}

export async function openNotification(formData: FormData) {
  const id = formData.get("id")?.toString();
  const href = formData.get("href")?.toString() || "/account/notifications";

  if (!id) {
    redirect(href);
  }

  await runWithPermissionFallback(async (client, userId) =>
    await client
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("recipient_id", userId)
      .is("deleted_at", null)
  );

  redirect(href);
}

export async function markNotificationsRead(formData: FormData) {
  const scopedTypes = getScopedTypes(formData.get("scope")?.toString() ?? null);

  await runWithPermissionFallback(async (client, userId) =>
    await client
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", userId)
      .in("type", scopedTypes)
      .is("deleted_at", null)
      .is("read_at", null)
  );
}
