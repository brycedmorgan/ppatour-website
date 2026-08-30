import Script from "next/script";
import { ANALYTICS_ENABLED } from "@/lib/analytics";

/**
 * Pickleball Inc's own first-party analytics tag.
 *
 * WHY THIS EXISTS ALONGSIDE GA4 AND VERCEL ANALYTICS — three tools, three
 * different questions, and this is the only one that can answer the third:
 *   - GA4 is the marketing stack (campaigns, key events, the ads integrations).
 *   - Vercel Analytics is the honest denominator — the traffic GA4 loses to
 *     Decline and to ad blockers.
 *   - This one is the PORTFOLIO view. GA4 property 358407319 holds five of the
 *     company's sites in ONE property, so every number out of it is wrong until
 *     somebody remembers to filter by Hostname. Reporting here puts ppatour.com
 *     beside MLP, Pickleball Central and Jackalope in one table that needs no
 *     filter to be true. It is read in Jackalope at Marketing → Web Analytics.
 *
 * Not a duplicate of `lib/vacations/track.ts`. That beacon reports the Vacations
 * funnel specifically so visits join to `stripe_charges` in the same database;
 * this reports site-wide traffic. Both land in Jackalope, neither replaces the
 * other, and /vacations is deliberately split out as its own property here so
 * Lainey's funnel does not disappear inside the tour's pageviews.
 *
 * ── Gating ───────────────────────────────────────────────────────────────
 * PRODUCTION-GATED, like every other tag on this site (lib/analytics.ts): a
 * preview deployment must never report into what the business reads. Belt and
 * braces, because the ingest is ALSO immune to it — Jackalope resolves the
 * property server-side from the request's own Origin host, and a
 * `*.vercel.app` preview host is not a registered property, so a beacon from
 * one is dropped rather than mis-filed. The check here just saves the request.
 *
 * DELIBERATELY NOT CONSENT-GATED, on the same footing as Vercel Analytics and
 * Speed Insights above it in the layout, and for a stronger reason than theirs:
 *   - it sets NO cookie and writes nothing to the visitor's device beyond a
 *     per-tab sessionStorage id that dies with the tab;
 *   - the visitor id is a one-way hash of a SERVER-SIDE salt that rotates every
 *     midnight, and the previous day's salt is deleted — so a visitor cannot be
 *     recognised tomorrow, by us or by anyone with the database;
 *   - no IP address or user-agent is stored. There is no column for either.
 * That is what makes it analytics rather than tracking, and it is why it sits
 * outside the banner. ⚠ If anyone ever gives this tag a persistent id, it stops
 * being true and this component must move behind the consent gate with the rest
 * of MarketingTags. That is a privacy decision, not a deploy decision.
 */
const TAG_SRC =
  process.env.NEXT_PUBLIC_JACKALOPE_TAG_URL ??
  // Canonical Jackalope host. ziffpickle.com 308s here and sendBeacon does not
  // follow redirects, so this must be the final URL — same trap as
  // lib/vacations/track.ts.
  "https://pickleball.usejackalope.com/api/public/tag.js";

export function JackalopeAnalytics() {
  if (!ANALYTICS_ENABLED) return null;

  /**
   * `afterInteractive`, not `beforeInteractive`: nothing on the page depends on
   * this and it must never sit in front of first paint. It is ~2.3 KB and
   * cached a day at the edge, and it reads Core Web Vitals from the native
   * PerformanceObserver with `buffered: true`, so it still sees the LCP that
   * happened before it loaded.
   */
  return <Script id="jackalope-analytics" src={TAG_SRC} strategy="afterInteractive" />;
}
