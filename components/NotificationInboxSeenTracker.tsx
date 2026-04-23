"use client";

import { useEffect, useRef } from "react";
import { markNotificationsRead } from "@/app/account/notifications/actions";
import type { NotificationMailboxScope } from "@/lib/notification-center";

type NotificationInboxSeenTrackerProps = {
  scope: NotificationMailboxScope;
};

export default function NotificationInboxSeenTracker({
  scope,
}: NotificationInboxSeenTrackerProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} action={markNotificationsRead} className="d-none" aria-hidden="true">
      <input type="hidden" name="scope" value={scope} />
    </form>
  );
}
