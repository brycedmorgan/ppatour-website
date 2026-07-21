import type { MetadataRoute } from "next";
import { athletes } from "@/lib/athletes";
import { CURATED_TO_CANONICAL, publishedAthletes } from "@/lib/published-athletes";
import { eventHref, tournaments } from "@/lib/placeholder-data";
import { tourPrograms } from "@/lib/tour-programs";
import { publishedArticles } from "@/lib/news-articles";

import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;

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
    "/about/pro-tour",
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
      url: `${BASE}${p}`,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.7,
    })),
    ...tournaments.map((t) => ({
      url: `${BASE}${eventHref(t)}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...[...athleteSlugs].map((slug) => ({
      url: `${BASE}/athletes/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...tourPrograms.map((p) => ({
      url: `${BASE}/tour/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...publishedArticles.map((a) => ({
      url: `${BASE}/news/${a.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
