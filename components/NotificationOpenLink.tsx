"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, type MouseEvent, type ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type NotificationOpenLinkProps = {
  href: string;
  notificationId?: string | null;
  unread?: boolean;
  className?: string;
  children: ReactNode;
  onOpened?: (notificationId: string) => void;
};

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return !(
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export default function NotificationOpenLink({
  href,
  notificationId,
  unread = false,
  className,
  children,
  onOpened,
}: NotificationOpenLinkProps) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainLeftClick(event) || !notificationId || !unread) {
      return;
    }

    event.preventDefault();

    startTransition(() => {
      void (async () => {
        try {
          await supabaseBrowser
            .from("notifications")
            .update({ read_at: new Date().toISOString() })
            .eq("id", notificationId)
            .is("deleted_at", null);
          onOpened?.(notificationId);
        } finally {
          router.push(href);
          router.refresh();
        }
      })();
    });
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
