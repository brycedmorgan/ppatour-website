import type { MetadataRoute } from "next";
import { athletes } from "@/lib/athletes";
import { CURATED_TO_CANONICAL, publishedAthletes } from "@/lib/published-athletes";
import { eventHref, tournaments } from "@/lib/placeholder-data";
import { tourPrograms } from "@/lib/tour-programs";
import { allNews } from "@/lib/news";

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

export default function sitemap(): MetadataRoute.Sitemap {
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
    "/play",
    "/athletes",
    "/rankings",
    "/leaderboards",
    "/news",
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
    ...tournaments
      .filter((t) => t.tierKey !== "challenger" && t.region !== "international")
      .map((t) => ({
        url: url(eventHref(t)),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ...[...athleteSlugs].map((slug) => ({
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
     * Pickleball Vacations. High priority: it sells a $3,800–$6,400 room and,
     * having just moved off its own subdomain, has no accumulated authority of
     * its own — the sitemap is how the new URL gets found. /register, /success
     * and the Punta Cana guest archive are all noindex and stay out.
     */
    {
      url: url("/vacations"),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    // Native articles + the 811 migrated WordPress posts. `lastModified`
    // matters here: these carry real publication dates going back to 2023, and
    // the 301s from their old root-level URLs need the new URL to look
    // authoritative to crawlers.
    ...allNews().map((n) => ({
      url: url(`/${n.slug}`),
      lastModified: new Date(n.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
