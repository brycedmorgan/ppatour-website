"use client";

/**
 * Tab-visibility gating for the live-data polls.
 *
 * ⚠ NOTHING ON THIS SITE CHECKED VISIBILITY BEFORE THIS FILE (9/6). The three
 * live surfaces — the site-wide ticker (15s), the scores board (30s) and the
 * bracket panel (15s) — all polled on a bare timer for as long as their tab
 * existed. A browser tab left open on the homepage overnight therefore made
 * ~5,760 requests before anybody looked at it again, and every one of them
 * pulled a real upstream call through to api.pickleball.com because the caches
 * behind them were tuned shorter than the poll rate.
 *
 * That is the load nobody is watching, and it is the reason the API dashboard
 * shows a flat 24/7 floor rather than a curve that follows play. Browsers throttle
 * background timers, but throttling is not stopping: Chrome still fires an
 * intensively-throttled timer roughly once a minute, so an idle tab keeps a
 * revalidation loop alive indefinitely.
 *
 * The rule here is deliberately simple, because a live score is the one thing a
 * viewer must never see stale: while the tab is hidden we do not ask, and the
 * moment it becomes visible we ask immediately rather than waiting out the rest
 * of the interval. So a returning viewer sees fresher data than they used to,
 * not staler — the poll they would have been waiting on has already fired.
 */

/**
 * Is the tab currently hidden?
 *
 * Guarded for SSR: these hooks run in components that also render on the
 * server, where `document` does not exist. Absent a document we report visible,
 * so the behaviour is unchanged rather than silently never polling.
 */
export function isTabHidden(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

/**
 * Run `cb` whenever the tab becomes visible again. Returns an unsubscribe.
 *
 * ⚠ IT FIRES ON THE TRANSITION, NOT ON EVERY EVENT. `visibilitychange` fires in
 * both directions; calling back on the hidden edge too would issue a fetch at
 * the exact moment we just decided to stop making them.
 */
export function onTabVisible(cb: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  const handler = () => {
    if (document.visibilityState === "visible") cb();
  };
  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}
