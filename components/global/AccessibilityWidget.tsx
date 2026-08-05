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

/**
 * Bottom left. UserWay's position values are 1 top-right, 2 middle-right,
 * 3 bottom-right, 4 bottom-centre, 5 bottom-left, 6 middle-left, 7 top-left,
 * 8 top-centre.
 *
 * ⚠ SET HERE BECAUSE THE ACCOUNT'S DESKTOP AND MOBILE POSITIONS DISAGREED, and
 * only the mobile one was wrong (Wesley, 8/4). Measured on the deployed pages:
 * at 1440px the button sat at x 13, bottom 13 — bottom left, as intended. At
 * 390px it sat at x 325, bottom 13 — bottom RIGHT, and 44px tall from y 787,
 * i.e. sitting on top of the sticky buy bar (y 804+) right where the Buy Tickets
 * CTA is. UserWay keeps separate `widget_position` and `widget_position_mobile`
 * tunings on the account, and the mobile one is the dashboard default.
 *
 * `data-position` is one of the attributes the loader promotes into
 * `window._userway_config`, and config beats the account's tunings, so this
 * pins both breakpoints to the same corner instead of leaving one to a
 * dashboard setting nobody on this repo can see.
 *
 * ⚠ THE BOTTOM BARS ARE PADDED FOR A LEFT-HAND BUTTON. `CookieBanner` and
 * `StickyBuyBar` both carry `pl-16` below `sm` to keep their content clear of
 * it. That padding was added on 8/3 for a button believed to be bottom-left on
 * mobile; it wasn't, so it was guarding the wrong edge. It is correct now. If
 * this position ever moves, those two files move with it.
 */
const POSITION_BOTTOM_LEFT = "5";

export function AccessibilityWidget() {
  const account = process.env.NEXT_PUBLIC_USERWAY_ACCOUNT ?? DEFAULT_ACCOUNT;

  // Escape hatch: NEXT_PUBLIC_USERWAY_ACCOUNT=off removes the widget entirely.
  if (!account || account === "off") return null;

  return (
    <Script
      id="userway-widget"
      src="https://cdn.userway.org/widget.js"
      data-account={account}
      data-position={POSITION_BOTTOM_LEFT}
      // lazyOnload, not afterInteractive: the widget is a ~100KB third-party
      // bundle and must not compete with the hero image for bandwidth. It is
      // reached by deliberate action, never during first paint.
      strategy="lazyOnload"
    />
  );
}
