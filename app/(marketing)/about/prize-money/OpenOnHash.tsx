"use client";

import { useEffect } from "react";

/** Opens the <details> grid named in the URL hash (#standard, #futures, #legacy). */
export function OpenOnHash() {
  useEffect(() => {
    const open = () => {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el instanceof HTMLDetailsElement) el.open = true;
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
