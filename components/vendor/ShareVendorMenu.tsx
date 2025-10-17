"use client";

import clsx from "clsx";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type ShareVendorMenuProps = {
  vendorName: string;
  className?: string;
};

type CopyState = "idle" | "copied" | "error";

function formatTemplate(template: string, replacements: Record<string, string>): string {
  return Object.keys(replacements).reduce(
    (result, key) => result.replaceAll(`{${key}}`, replacements[key] ?? ""),
    template,
  );
}

export default function ShareVendorMenu({ vendorName, className }: ShareVendorMenuProps) {
  const { dictionary } = useLanguage();
  const labels = dictionary.vendorProfile.share;
  const [isOpen, setIsOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && (menuRef.current?.contains(target) || buttonRef.current?.contains(target))) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopyState("idle");
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const shareMessage = useMemo(
    () => formatTemplate(labels.shareMessage, { vendor: vendorName }),
    [labels.shareMessage, vendorName],
  );

  const emailSubject = useMemo(
    () => formatTemplate(labels.emailSubject, { vendor: vendorName }),
    [labels.emailSubject, vendorName],
  );

  const emailBody = useMemo(
    () => formatTemplate(labels.emailBody, { vendor: vendorName, url: typeof window !== "undefined" ? window.location.href : "" }),
    [labels.emailBody, vendorName],
  );

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) {
      setCopyState("error");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopyState("copied");
    } catch (error) {
      console.error("Failed to copy share URL", error);
      setCopyState("error");
    }
  }, [shareUrl]);

  const handleOpenWindow = useCallback((url: string) => {
    if (!url) {
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  }, []);

  const handleShareClick = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share && shareUrl) {
      try {
        await navigator.share({
          title: vendorName,
          text: shareMessage,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if ((error as DOMException | undefined)?.name === "AbortError") {
          return;
        }
        console.warn("Native share failed, falling back to menu", error);
      }
    }

    setIsOpen((previous) => !previous);
  }, [shareMessage, shareUrl, vendorName]);

  const handleEmail = useCallback(() => {
    if (!shareUrl) {
      return;
    }
    const mailto = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody || shareUrl)}`;
    window.location.href = mailto;
    setIsOpen(false);
  }, [emailBody, emailSubject, shareUrl]);

  const shareOptions = [
    {
      key: "copy",
      label:
        copyState === "copied"
          ? labels.copySuccess
          : copyState === "error"
            ? labels.copyError
            : labels.copyLink,
      onSelect: handleCopyLink,
      isButton: true,
    },
    {
      key: "email",
      label: labels.email,
      onSelect: handleEmail,
      isButton: true,
    },
    {
      key: "facebook",
      label: labels.facebook,
      href: shareUrl
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        : null,
    },
    {
      key: "x",
      label: labels.x,
      href: shareUrl
        ? `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`
        : null,
    },
    {
      key: "whatsapp",
      label: labels.whatsapp,
      href: shareUrl
        ? `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareMessage} ${shareUrl}`)}`
        : null,
    },
  ] as const;

  return (
    <div className={clsx("position-relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        className="btn btn-outline-secondary btn-lg w-100"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={handleShareClick}
      >
        {labels.button}
      </button>
      {isOpen ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          className="position-absolute end-0 mt-2 border rounded shadow-sm bg-white"
          style={{ minWidth: 240, zIndex: 2000 }}
        >
          <ul className="list-unstyled mb-0">
            {shareOptions.map((option) => (
              <li key={option.key}>
                {"onSelect" in option ? (
                  <button
                    type="button"
                    className="dropdown-item w-100 text-start"
                    onClick={option.onSelect}
                  >
                    {option.label}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="dropdown-item w-100 text-start"
                    onClick={() => option.href && handleOpenWindow(option.href)}
                    disabled={!option.href}
                  >
                    {option.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="visually-hidden" aria-live="polite">
            {copyState === "copied" ? labels.copySuccess : copyState === "error" ? labels.copyError : ""}
          </div>
        </div>
      ) : null}
    </div>
  );
}
