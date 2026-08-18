"use client";

import { useEffect } from "react";

/**
 * Keeps outbound links inside the app window.
 *
 * THE PROBLEM: every commerce link on the site is `target="_blank"` (33 files
 * of them — Tixr tickets, pickleballtournaments.com registration, PickleballTV,
 * partner sites). In a browser tab that is right. In an installed app it is the
 * worst thing a link can do: iOS hands the URL to Safari as a separate app, the
 * fan buys their Nationals ticket, and there is no way back except finding the
 * icon on the home screen again. The purchase completes and the session is
 * over.
 *
 * THE FIX: in app mode, navigate out-of-origin links in the SAME window. Both
 * platforms then treat it as an excursion, not a departure —
 *   · iOS opens an in-app browser sheet over the app with a Done button
 *   · Android opens a Custom Tab with a back arrow
 * Either way the fan lands back on the page they left, still in the app, with
 * their ticket bought. Tixr's checkout is untouched; we are not embedding or
 * replicating it (see the repo brief), just controlling how we leave and come
 * back.
 *
 * One listener on the document beats editing 33 files, and it cannot drift out
 * of step with a link added tomorrow.
 *
 * ⚠ Left click, no modifier keys, no default already prevented. A middle click
 * or a cmd-click is a deliberate "new tab" and stays one.
 */
export function AppLinkRouter() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as Element | null)?.closest?.("a[href]") as
        | HTMLAnchorElement
        | null;
      if (!anchor || anchor.target !== "_blank") return;
      if (anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      // Only http(s) — a mailto: or tel: link must keep handing off to the OS.
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      if (url.origin === window.location.origin) return;

      e.preventDefault();
      window.location.href = url.href;
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
