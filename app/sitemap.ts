import type { MetadataRoute } from "next";
import { athletes } from "@/lib/athletes";
import { tournaments } from "@/lib/placeholder-data";
import { tourPrograms } from "@/lib/tour-programs";
import { newsArticles } from "@/lib/news-articles";

const BASE = "https://ppatour-website.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/events",
    "/watch",
    "/play",
    "/athletes",
    "/rankings",
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
      url: `${BASE}/events/${t.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...athletes.map((a) => ({
      url: `${BASE}/athletes/${a.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...tourPrograms.map((p) => ({
      url: `${BASE}/tour/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...newsArticles.map((a) => ({
      url: `${BASE}/news/${a.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
