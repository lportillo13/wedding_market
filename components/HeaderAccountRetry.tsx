"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function HeaderAccountRetry({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { dictionary } = useLanguage();
  return (
    <div
      className={`wm-header-account-retry${compact ? " wm-header-account-retry--compact" : ""}`}
    >
      <p role="status">{dictionary.header.accountUnavailable}</p>
      <button type="button" onClick={() => window.location.reload()}>
        {dictionary.header.retryAccount}
      </button>
    </div>
  );
}
