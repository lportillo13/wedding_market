"use client";

import { startTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type ThreadReadSyncProps = {
  threadKey: string;
  activityKey?: string;
  markThreadRead: (threadKey: string) => Promise<void>;
};

export default function ThreadReadSync({ threadKey, activityKey = "", markThreadRead }: ThreadReadSyncProps) {
  const router = useRouter();
  const didRunRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${threadKey}:${activityKey}`;
    if (!threadKey || didRunRef.current === key) {
      return;
    }

    didRunRef.current = key;

    startTransition(() => {
      void markThreadRead(threadKey).catch(() => {}).finally(() => {
        router.refresh();
      });
    });
  }, [markThreadRead, router, threadKey, activityKey]);

  return null;
}
