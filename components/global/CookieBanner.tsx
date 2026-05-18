"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ppa-cookie-consent";

/**
 * Compliance-minimum cookie banner (§9.4). One-line, footer-anchored,
 * never overlays content. Dismissed state persists for 365 days.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!localStorage.getItem(STORAGE_KEY));
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-ppa-navy text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs">
        <span className="text-white/80">
          We use cookies for analytics.
        </span>
        <button
          type="button"
          onClick={dismiss}
          className="font-semibold text-white/60 hover:text-white"
        >
          Manage
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="ml-auto rounded-sm bg-ppa-yellow px-3 py-1 font-bold text-ppa-navy hover:bg-ppa-yellow/90"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
