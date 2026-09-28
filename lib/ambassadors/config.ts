/**
 * Feature flags for the ambassador area, all derived from existing site config.
 *
 * `previewEnabled` gates the off-production affordances — the committed demo
 * dataset (lib/ambassadors/demo.ts) and the one-click "preview as" sign-in — so
 * they exist only where the site is NOT the production indexable domain. On
 * production these are always off; only the real uploaded data and the emailed
 * sign-in link work.
 */
import { SITE_INDEXABLE, SITE_URL } from "@/lib/site";

/**
 * True when the off-production preview affordances are on (demo dataset +
 * one-click "preview as" sign-in).
 *
 * On by default anywhere the site is NOT the indexable production domain (local
 * dev, non-indexable previews). Because the Vercel staging domain is currently
 * indexable, `AMBASSADORS_PREVIEW=1` force-enables it there for review — it
 * serves only the FICTIONAL demo dataset (no Blob, no real data), so it's safe
 * on a public URL. Leave the flag unset for the real launch.
 */
export function previewEnabled(): boolean {
  // Explicit production lock for the ambassador area, independent of whole-site
  // indexability. Set AMBASSADORS_LIVE=1 to force the REAL emailed-link sign-in
  // and 404 the one-click "preview as" bypass (and the HQ preview bypass) while
  // the rest of the rebuild is still staging/noindex — this is what lets the
  // ambassador dashboard launch ahead of the full ppatour.com cutover.
  if (process.env.AMBASSADORS_LIVE === "1") return false;
  if (process.env.AMBASSADORS_PREVIEW === "1") return true;
  return SITE_INDEXABLE !== true;
}

export function siteUrl(): string {
  return SITE_URL.replace(/\/$/, "");
}

export function dataSecret(): string {
  return process.env.AMBASSADOR_DATA_SECRET ?? "";
}
