"use client";

const KEY = "wm_shortlist_v1";

function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((id): id is string => typeof id === "string" && Boolean(id.trim())).map((id) => id.trim()))]
      : [];
  } catch {
    return [];
  }
}
function write(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify([...new Set(ids)]));
}

export function getShortlist(): string[] { return read(); }
export function inShortlist(id: string): boolean { return read().includes(id); }
export function addToShortlist(id: string) { write([...read(), id]); window.dispatchEvent(new Event("wm-shortlist-changed")); }
export function removeFromShortlist(id: string) { write(read().filter(x => x !== id)); window.dispatchEvent(new Event("wm-shortlist-changed")); }
export function clearShortlist() { write([]); window.dispatchEvent(new Event("wm-shortlist-changed")); }

export function getShortlistCount(): number { return read().length; }
