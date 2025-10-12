"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { CloudinaryImage } from "@/types/images";

type UserAvatarProps = {
  image?: CloudinaryImage | null;
  name?: string | null;
  size?: number;
  className?: string;
};

export default function UserAvatar({ image, name, size = 40, className }: UserAvatarProps) {
  const displayName = (name ?? "").trim();
  const initial = useMemo(() => {
    if (displayName) {
      const char = displayName[0];
      return char ? char.toUpperCase() : "?";
    }
    return "?";
  }, [displayName]);

  const baseClasses = "rounded-circle d-inline-flex align-items-center justify-content-center";
  const mergedClasses = [baseClasses, className].filter(Boolean).join(" ");

  if (image?.url) {
    return (
      <Image
        src={image.url}
        alt={displayName ? `${displayName} avatar` : "User avatar"}
        width={size}
        height={size}
        className={`${mergedClasses} object-fit-cover`}
        style={{ width: size, height: size }}
      />
    );
  }

  const fontSize = Math.max(14, Math.floor(size / 2));

  return (
    <span
      className={`${mergedClasses} bg-secondary text-white fw-semibold`}
      style={{ width: size, height: size, fontSize }}
      role="img"
      aria-label={displayName ? `${displayName} avatar` : "User avatar"}
    >
      {initial}
    </span>
  );
}
