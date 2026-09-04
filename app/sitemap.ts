import type { MetadataRoute } from "next";
import { athletes } from "@/lib/athletes";
import { EUROPE_PUBLIC } from "@/lib/europe-launch";
import { isUnlistedEuropeAthlete } from "@/lib/europe-visibility";
import { CURATED_TO_CANONICAL, publishedAthletes } from "@/lib/published-athletes";
import { eventHref, tournaments } from "@/lib/placeholder-data";
import { tourPrograms } from "@/lib/tour-programs";
import { allNews } from "@/lib/news";
import { getShopProductHandles, shopHref } from "@/lib/shop";

import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;

/**
 * trailingSlash is on (see next.config.ts), so the canonical form of every route
 * ends in a slash. Emitting the bare path would make every sitemap entry point
 * at a 308.
 */
const url = (path: string) => {
  const abs = `${BASE}${path}`;
  return abs.endsWith("/") ? abs : `${abs}/`;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /**
   * Product URLs come from Shopify, so this is the first remote read in the
   * sitemap. It resolves to [] when the storefront is unconfigured or down —
   * which is the right failure: a sitemap that lists product pages the site
   * cannot render is worse than one that omits them for a build.
   */
  const shopHandles = await getShopProductHandles();

  // Every athlete page (curated shorthand slug when we have one, else canonical).
  const canonicalToCurated: Record<string, string> = Object.fromEntries(
    Object.entries(CURATED_TO_CANONICAL).map(([ours, api]) => [api, ours]),
  );
  const athleteSlugs = new Set<string>(athletes.map((a) => a.slug));
  for (const p of publishedAthletes) {
    athleteSlugs.add(canonicalToCurated[p.slug] ?? p.slug);
  }

  const staticPaths = [
    "",
    "/events",
    "/watch",
    "/watch/tv",
    "/play",
    "/game",
    "/athletes",
    "/rankings",
    "/leaderboards",
    "/news",
    "/blog",
    "/about",
    "/about/sponsors",
    "/about/how-it-works",
    "/about/what-is-pickleball",
    "/about/history",
    "/about/host-tournament",
    "/about/private-events",
    "/about/ambassadors",
    "/about/international-ambassadors",
    "/about/careers",
    "/about/contact",
    "/about/integrity",
    "/about/player-handbook",
    "/about/privacy",
    "/about/terms",
    "/search",
    /**
     * ⚠ /shop is listed only when the catalogue actually resolved. The page
     * renders a holding state either way, and submitting a "shop" URL with no
     * product behind it is how a thin-content flag gets earned on a domain
     * whose SEO baseline we are still building.
     */
    ...(shopHandles.length > 0 ? ["/shop"] : []),
  ];

  return [
    ...staticPaths.map((p) => ({
      url: url(p),
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.7,
    })),
    // Only events that actually have an internal page. Challengers and
    // international sister-tour stops link out to pickleballtournaments.com,
    // so their /events/[year]/[slug] URLs 404 — keep them out of the sitemap.
    // ⚠ `detailsComingSoon` stops 404 for the same reason (announced, no page
    // yet), so listing one would submit a deliberate 404 to Google.
    ...tournaments
      .filter(
        (t) =>
          t.tierKey !== "challenger" && t.region !== "international" && !t.detailsComingSoon,
      )
      .map((t) => ({
        url: url(eventHref(t)),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    // ⚠ PPA Tour Europe is unlisted until EUROPE_PUBLIC flips, and the 19 athlete
    // pages the Europe roster MINTED go with it — a sitemap entry is an
    // invitation to index, which is exactly what "not live for everyone yet"
    // rules out. The seven Europe pros who already had a scraped profile stay,
    // because they were public before any of this.
    ...(EUROPE_PUBLIC ? [{ url: url("/europe"), changeFrequency: "weekly" as const, priority: 0.7 }] : []),
    ...[...athleteSlugs].filter((slug) => !isUnlistedEuropeAthlete(slug)).map((slug) => ({
      url: url(`/athletes/${slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...tourPrograms.map((p) => ({
      url: url(`/tour/${p.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    /**
     * Pickleball Vacations — indexed as of 8/5, Stripe configured (secret key +
     * webhook live). /register, /success and the Punta Cana guest archive stay
     * noindex and out of the sitemap.
     */
    {
      url: url("/vacations"),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    /**
     * Native articles, the 811 migrated WordPress posts, and the 39 PPA Blog
     * posts. `lastModified` matters here: these carry real publication dates
     * going back to 2023, and the 301s from their old root-level URLs need the
     * new URL to look authoritative to crawlers.
     *
     * ⚠ `n.href`, never `/${n.slug}` — blog posts live under `/ppa-blog/` and
     * hardcoding the root shape would have listed 39 URLs that 404.
     *
     * (Pickleball Vacations is deliberately held out above until Stripe lands.)
     */
    ...allNews().map((n) => ({
      url: url(n.href),
      lastModified: new Date(n.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    /**
     * Shop products. No `lastModified` — Shopify has an `updatedAt` but it
     * moves on inventory changes, so emitting it would tell crawlers a product
     * page changed every time a size sold out. Omitting it is more honest than
     * a date that means something else.
     */
    ...shopHandles.map((handle) => ({
      url: url(shopHref(handle)),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
