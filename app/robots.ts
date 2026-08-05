import type { MetadataRoute } from "next";
import { SITE_INDEXABLE, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!SITE_INDEXABLE) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The live/preview routes are already `noindex`, but keep crawlers off
      // them entirely: the `-live` demo renders another event's (Atlanta's)
      // scores under the Nationals name, and /brackets is a raw data view.
      // Belt-and-suspenders — a noindex still gets crawled and can surface in
      // AI answer engines that don't honor it.
      disallow: [
        "/live/",
        "/events/veolia-pickleball-national-championships-live/",
        "/brackets/",
        "/hero-preview/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
