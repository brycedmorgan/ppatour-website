"use client";

import { useCallback, useEffect, useState } from "react";
import { MAX_COMPARE } from "@/lib/paddle-lab-shared";

/**
 * The compare tray: up to four paddle slugs, kept in localStorage so a reader
 * can collect paddles across pages and land on /paddle-lab/compare with them
 * waiting. The URL on the compare page is the shareable form; this is the
 * scratch copy. Every writer dispatches EVT so the tray and the buttons on the
 * same page agree without a reload.
 */
const KEY = "ppa-paddle-compare";
const EVT = "ppa-paddle-compare-change";

export function readCompare(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((s) => typeof s === "string").slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

export function writeCompare(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_COMPARE)));
  } catch {
    /* private mode, quota — the tray just won't persist */
  }
  window.dispatchEvent(new Event(EVT));
}

export function useCompare() {
  // Starts empty on the server and on the first client paint, so the markup
  // hydrates cleanly; the effect fills it in.
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setList(readCompare());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((slug: string) => {
    const cur = readCompare();
    if (cur.includes(slug)) writeCompare(cur.filter((s) => s !== slug));
    else if (cur.length < MAX_COMPARE) writeCompare([...cur, slug]);
  }, []);

  const remove = useCallback((slug: string) => writeCompare(readCompare().filter((s) => s !== slug)), []);
  const clear = useCallback(() => writeCompare([]), []);
  const replace = useCallback((next: string[]) => writeCompare(next), []);

  return { list, toggle, remove, clear, replace, full: list.length >= MAX_COMPARE };
}
