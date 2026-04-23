"use client";

import { startTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type ThreadReadSyncProps = {
  threadKey: string;
  markThreadRead: (threadKey: string) => Promise<void>;
};

export default function ThreadReadSync({ threadKey, markThreadRead }: ThreadReadSyncProps) {
  const router = useRouter();
  const didRunRef = useRef<string | null>(null);

  useEffect(() => {
    if (!threadKey || didRunRef.current === threadKey) {
      return;
    }

    didRunRef.current = threadKey;

    startTransition(() => {
      void markThreadRead(threadKey).finally(() => {
        router.refresh();
      });
    });
  }, [markThreadRead, router, threadKey]);

  return null;
}
