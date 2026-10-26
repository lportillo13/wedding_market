
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

export async function loadNotifications(scope: NotificationMailboxScope, options: { deleted?: boolean; query?: string; page?: string } = {}) {
  const supabase = await createSupabaseServerClient();
  const requestedPage = Number(options.page ?? 1);
  const { data, error } = await supabase.rpc('list_notification_mailbox', {
    p_scope: scope, p_deleted: options.deleted ?? false, p_query: options.query?.trim().slice(0,200) ?? '',
    p_page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage,1_000_000) : 1,
  }).abortSignal(AbortSignal.timeout(10_000));
  const result = data as { data: NotificationRow[]; total: number; activeCount: number; deletedCount: number; unreadCount: number; page: number; pageSize: number } | null;
  return {
    data: result?.data ?? [], total: result?.total ?? 0, activeCount: result?.activeCount ?? 0,
    deletedCount: result?.deletedCount ?? 0, unreadCount: result?.unreadCount ?? 0, page: result?.page ?? 1, pageSize: 50,
    error,
  };
}
