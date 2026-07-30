import type { NextConfig } from "next";
import wpRedirects from "./lib/data/wp-redirects.json";

/**
 * 301s from the current WordPress ppatour.com URL structure to this site's
 * routes — the launch-critical piece of the migration: without these, every
 * ranking the old site holds resets to zero at cutover. Harmless before
 * cutover (none of these paths exist here). Sources: page-sitemap.xml,
 * athlete-sitemap.xml, tournament-sitemap.xml on the live site (Jul 2026).
 *
 * Root-level blog posts ARE now covered: the WordPress import generates one
 * explicit 301 per post into `lib/data/wp-redirects.json` (811 rows, appended
 * below). Verified at generation time to be root-level only, with no
 * self-referential loops and no path that shadows a real route here. Regenerate
 * with `node scripts/import-wp-posts.mjs` whenever slugs change.
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
  // renamed staging-era event slugs
  { source: "/events/veolia-chicago-open", destination: "/events/2026/veolia-chicago-cup" },
  { source: "/events/carvana-mesa-cup", destination: "/events/2026/veolia-arizona-open" },
  { source: "/events/veolia-cincinnati-cup", destination: "/events" },
  /**
   * Retired paths linked from inside the migrated blog posts. Found by
   * extracting all 509 ppatour.com links out of the 811 imported bodies and
   * requesting each against a real build: 126 of 146 distinct paths already
   * resolved, these are the ones that 404'd. After cutover, ppatour.com IS this
   * site, so these links are self-referential and would break in-article
   * navigation.
   */
  { source: "/pro-pickleball-players", destination: "/athletes" },
  { source: "/ppa-tour", destination: "/about/pro-tour" },
  { source: "/junior-ppa", destination: "/tour/junior" },
  { source: "/2021-season", destination: "/about/history" },
  // Old flat event URLs — this site uses /events/{year}/{slug}, and these are
  // 2023–24 stops with no page here. Listed explicitly rather than as
  // `/events/:slug`, which would shadow the real /events/volunteer and
  // /events/veolia-pickleball-national-championships-live routes: next.config
  // redirects are matched BEFORE filesystem routes.
  { source: "/events/orange-county-cup", destination: "/events" },
  { source: "/events/skechers-invitational", destination: "/events" },
  { source: "/events/atlanta-georgia-open", destination: "/events" },

  // patterns
  { source: "/athlete/:slug", destination: "/athletes/:slug" },
  // `/pro/:slug` was the other legacy profile prefix and had no rule; 6 of the
  // 9 links using it point at athletes who do have a page here.
  { source: "/pro/:slug", destination: "/athletes/:slug" },
  { source: "/tournament/:path*", destination: "/events" },
  { source: "/ppa-blog/:slug*", destination: "/news" },
];

const nextConfig: NextConfig = {
  images: {
    // Player headshots served by the Pickleball.com partner API (rankings feed).
    remotePatterns: [
      { protocol: "https", hostname: "images.pickleball.com" },
      // YouTube video thumbnails (tournament replay galleries).
      { protocol: "https", hostname: "i.ytimg.com" },
      // Rehosted media for the 811 migrated WordPress posts (Vercel Blob store
      // `ppatour-website-media`). This is the permanent home.
      {
        protocol: "https",
        hostname: "khubqvjky7bimx7i.public.blob.vercel-storage.com",
      },
      // NOTE: ppatour.com is deliberately NOT allowlisted. All 1,553 archive
      // assets are rehosted to Blob (`sync-wp-media.mjs --verify` passes at
      // 100%), so a next/image request for a ppatour.com URL now means an
      // unmapped asset — which must fail loudly here rather than silently
      // hotlinking an install that stops serving at cutover.
    ],
    // qualities must be allowlisted or next/image silently clamps to 75 —
    // the homepage hero uses 65 (perf/lcp-hero).
    qualities: [65, 75],
  },
  async redirects() {
    return [...LEGACY_REDIRECTS, ...wpRedirects].map((r) => ({
      ...r,
      permanent: true,
    }));
  },
};

export default nextConfig;
