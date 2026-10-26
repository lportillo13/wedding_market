import type { ReactNode } from "react";
import type { NotificationMailboxScope } from "@/features/notifications/server/inbox";

type NotificationInboxPageShellProps = {
  scope: NotificationMailboxScope;
  unreadCount: number;
  children: ReactNode;
};

export default function NotificationInboxPageShell({
  children,
}: NotificationInboxPageShellProps) {
  return children;
}
