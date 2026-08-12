import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ACCOUNT_NOTIFICATION_TYPES, VENDOR_NOTIFICATION_TYPES } from "@/lib/notification-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NotificationMailboxScope = "account" | "vendor";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: unknown;
  read_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

export function isMissingNotificationTableError(message: string | undefined) {
  return message?.includes("public.notifications") || message?.includes("schema cache");
}

export function isNotificationPermissionError(message: string | undefined) {
  return message?.toLowerCase().includes("permission denied");
}

function getScopeTypes(scope: NotificationMailboxScope) {
  return scope === "vendor" ? [...VENDOR_NOTIFICATION_TYPES] : [...ACCOUNT_NOTIFICATION_TYPES];
}

export async function loadNotifications(userId: string, scope: NotificationMailboxScope) {
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  let { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, data, read_at, deleted_at, created_at")
    .eq("recipient_id", userId)
    .in("type", getScopeTypes(scope))
    .order("created_at", { ascending: false });

  if (isNotificationPermissionError(error?.message) && supabaseAdmin) {
    const retry = await supabaseAdmin
      .from("notifications")
      .select("id, type, title, body, data, read_at, deleted_at, created_at")
      .eq("recipient_id", userId)
      .in("type", getScopeTypes(scope))
      .order("created_at", { ascending: false });
    data = retry.data;
    error = retry.error;
  }

  return {
    data: (data ?? []) as NotificationRow[],
    error,
  };
}
