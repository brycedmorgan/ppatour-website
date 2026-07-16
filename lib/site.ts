/**
 * Canonical site origin + indexability, driven by env so staging and
 * production behave correctly without code changes:
 *
 *   NEXT_PUBLIC_SITE_URL        — canonical origin. Unset on staging
 *                                 (falls back to the vercel.app domain);
 *                                 set to https://www.ppatour.com at cutover.
 *   NEXT_PUBLIC_SITE_INDEXABLE  — "true" ONLY on the production domain.
 *                                 Anything else → robots noindex + disallow,
 *                                 so the staging site (placeholder scores,
 *                                 fictional players) never enters Google and
 *                                 never competes with ppatour.com.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ppatour-website.vercel.app";

export const SITE_INDEXABLE =
  process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true";
