"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, type MouseEvent, type ReactNode } from "react";

type ThreadOpenLinkProps = {
  href: string;
  threadKey: string;
  unread?: boolean;
  className?: string;
  children: ReactNode;
  markThreadRead: (threadKey: string) => Promise<void>;
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

export default function ThreadOpenLink({
  href,
  threadKey,
  unread = false,
  className,
  children,
  markThreadRead,
}: ThreadOpenLinkProps) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainLeftClick(event) || !unread) {
      return;
    }

    event.preventDefault();

    startTransition(() => {
      void (async () => {
        try {
          await markThreadRead(threadKey);
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
