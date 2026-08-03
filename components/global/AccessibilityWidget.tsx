import Script from "next/script";

/**
 * UserWay accessibility widget — the toolbar the current ppatour.com runs.
 *
 * Flagged in docs/LAUNCH.md on 8/1 as the one live-site tag deliberately NOT
 * ported, because dropping it changes the site's accessibility posture at
 * cutover. Wesley called it in on 8/3.
 *
 * ── Why this is NOT in MarketingTags.tsx ─────────────────────────────────
 * Every tag in there is gated three ways: env var, production domain, AND
 * cookie consent. All three are wrong here.
 *
 *   - CONSENT: gating an accessibility toolbar behind "Accept cookies" means a
 *     screen-reader or low-vision user who clicks Decline loses the one feature
 *     on the page built for them. Accessibility is not a marketing cookie. The
 *     widget stores the visitor's own accessibility preferences, which is
 *     functional, not tracking.
 *   - PRODUCTION: previews are where accessibility gets tested. Gating it to the
 *     live domain means nobody sees it until it's too late to fix.
 *
 * So it sits beside Vercel Analytics in the layout — outside both gates — for
 * the same reason those do.
 *
 * ── Why the account ID is hardcoded ──────────────────────────────────────
 * The repo convention is env-gated so nothing ships turned on, which is right
 * for session-replay tools that need a privacy sign-off. This is the opposite
 * case: it is a public widget ID already served on ppatour.com, and shipping it
 * dark would mean it silently isn't there on launch day unless someone
 * remembers a Vercel env var. Defaulting it on is the safer failure mode.
 * `NEXT_PUBLIC_USERWAY_ACCOUNT` still overrides, and setting it to "off"
 * disables the widget without a code change.
 */

/** The account already running on ppatour.com. */
const DEFAULT_ACCOUNT = "YBUtdPKa3d";

export function AccessibilityWidget() {
  const account = process.env.NEXT_PUBLIC_USERWAY_ACCOUNT ?? DEFAULT_ACCOUNT;

  // Escape hatch: NEXT_PUBLIC_USERWAY_ACCOUNT=off removes the widget entirely.
  if (!account || account === "off") return null;

  return (
    <Script
      id="userway-widget"
      src="https://cdn.userway.org/widget.js"
      data-account={account}
      // lazyOnload, not afterInteractive: the widget is a ~100KB third-party
      // bundle and must not compete with the hero image for bandwidth. It is
      // reached by deliberate action, never during first paint.
      strategy="lazyOnload"
    />
  );
}
