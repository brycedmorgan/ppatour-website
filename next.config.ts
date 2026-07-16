import type { NextConfig } from "next";

/**
 * 301s from the current WordPress ppatour.com URL structure to this site's
 * routes — the launch-critical piece of the migration: without these, every
 * ranking the old site holds resets to zero at cutover. Harmless before
 * cutover (none of these paths exist here). Sources: page-sitemap.xml,
 * athlete-sitemap.xml, tournament-sitemap.xml on the live site (Jul 2026).
 *
 * NOT covered (needs the news/content migration): old blog posts published
 * at root level (e.g. /player-of-the-month-kyle-yates/) — root slugs can't
 * be pattern-matched without swallowing real routes. Redirect them
 * individually once news slugs are final.
 */
const LEGACY_REDIRECTS = [
  // sections
  { source: "/schedule", destination: "/events" },
  { source: "/player-rankings", destination: "/rankings" },
  { source: "/player-rankings-table", destination: "/rankings" },
  { source: "/blog", destination: "/news" },
  // about
  { source: "/pro-tour", destination: "/about/pro-tour" },
  { source: "/what-is-pickleball", destination: "/about/what-is-pickleball" },
  { source: "/how-it-works", destination: "/about/how-it-works" },
  { source: "/tournament-history", destination: "/about/history" },
  { source: "/sponsors", destination: "/about/sponsors" },
  { source: "/careers", destination: "/about/careers" },
  { source: "/contact-us", destination: "/about/contact" },
  { source: "/reporting", destination: "/about/integrity" },
  { source: "/ambassador-program", destination: "/about/ambassadors" },
  {
    source: "/international-ambassadors",
    destination: "/about/international-ambassadors",
  },
  {
    source: "/host-a-ppa-tour-tournament",
    destination: "/about/host-tournament",
  },
  {
    source: "/host-ppa-sponsored-private-event",
    destination: "/about/private-events",
  },
  { source: "/privacy-policy", destination: "/about/privacy" },
  { source: "/terms-of-use", destination: "/about/terms" },
  // tour programs
  { source: "/junior-ppa-tour", destination: "/tour/junior" },
  { source: "/senior-open", destination: "/tour/senior" },
  { source: "/camps", destination: "/tour/camps" },
  { source: "/travel", destination: "/tour/travel" },
  { source: "/hospitality", destination: "/tour/hospitality" },
  // patterns
  { source: "/athlete/:slug", destination: "/athletes/:slug" },
  { source: "/tournament/:path*", destination: "/events" },
  { source: "/ppa-blog/:slug*", destination: "/news" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return LEGACY_REDIRECTS.map((r) => ({ ...r, permanent: true }));
  },
};

export default nextConfig;
