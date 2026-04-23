import type { ReactNode } from "react";
import type { NotificationMailboxScope } from "@/lib/notification-center";

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
