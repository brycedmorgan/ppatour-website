import { SITE_INDEXABLE } from "@/lib/site";

/**
 * Whether third-party marketing tags may load.
 *
 * ⚠ Tied to `SITE_INDEXABLE`, which is true ONLY on the production domain.
 *
 * Every preview and staging deployment was firing the **production** GA4 stream
 * (G-NKVE1BRLK7) and the **production** Meta Pixel, because the measurement IDs
 * are set at the project level and the components only checked "is the ID set".
 * So every QA pass, crawl, and demo since staging went up has been landing in
 * the same property the business reads — and would have contaminated the
 * launch-day numbers, on the one day they matter most.
 *
 * Cutover already sets `NEXT_PUBLIC_SITE_INDEXABLE=true` as step 1 of
 * docs/LAUNCH.md, so tags start reporting at exactly the moment the site
 * becomes the real ppatour.com and not before.
 *
 * To smoke-test a tag on a preview, set NEXT_PUBLIC_SITE_INDEXABLE=true on that
 * deployment only — and remember it also makes that preview indexable.
 */
export const ANALYTICS_ENABLED = SITE_INDEXABLE;

/** Shared consent key — CookieBanner writes it, every tag reads it. */
export const CONSENT_KEY = "ppa-cookie-consent";

/**
 * Dispatched on `window` when consent changes, so tags mounted before the
 * decision can react without a page load. CookieBanner is the only writer.
 */
export const CONSENT_EVENT = "ppa-cookie-consent-change";
