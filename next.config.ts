import type { NextConfig } from "next";

/**
 * 301s from the current WordPress ppatour.com URL structure to this site's
 * routes — the launch-critical piece of the migration: without these, every
 * ranking the old site holds resets to zero at cutover. Harmless before
 * cutover (none of these paths exist here). Sources: page-sitemap.xml,
 * athlete-sitemap.xml, tournament-sitemap.xml on the live site (Jul 2026).
 *
 * Blog posts need NO redirect: `app/[slug]` serves them at the same root URL
 * WordPress used, so ppatour.com/some-post-slug keeps working byte-for-byte
 * after cutover. (An earlier pass mapped each post to /news/{slug} and shipped
 * 811 redirects; both are gone.) Verified: none of the 826 slugs collides with a
 * route segment, a public/ path, or a redirect source below — and Next matches
 * static segments before the dynamic `[slug]`, so /events, /athletes and friends
 * always win.
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
  // Articles briefly lived at /news/{slug}; fold those into the root URL so the
  // two paths don't compete for the same content.
  { source: "/news/:slug", destination: "/:slug" },
  { source: "/athlete/:slug", destination: "/athletes/:slug" },
  // `/pro/:slug` was the other legacy profile prefix and had no rule; 6 of the
  // 9 links using it point at athletes who do have a page here.
  { source: "/pro/:slug", destination: "/athletes/:slug" },
  { source: "/tournament/:path*", destination: "/events" },
  { source: "/ppa-blog/:slug*", destination: "/news" },
];

const nextConfig: NextConfig = {
  /**
   * Every WordPress URL ended in a slash — all 811 migrated posts carry a Yoast
   * canonical of `https://ppatour.com/{slug}/`. With the default (false) each of
   * those indexed URLs would take a 308 to the bare path forever; with this on,
   * the old URL is served directly and the migration is byte-for-byte invisible
   * to crawlers and to anything already linking in.
   *
   * It applies site-wide, which is the right call rather than a side effect:
   * WordPress used trailing slashes everywhere, so this matches the old site's
   * convention on every route, not just the blog.
   */
  trailingSlash: true,
  images: {
    // Player headshots served by the Pickleball.com partner API (rankings feed).
    remotePatterns: [
      { protocol: "https", hostname: "images.pickleball.com" },
      // YouTube video thumbnails (tournament replay galleries).
      { protocol: "https", hostname: "i.ytimg.com" },
      // Hero images on live pickleball.com articles (lib/pb-news.ts). Those
      // articles are linked out to, never republished — only the card thumbnail
      // is served here.
      { protocol: "https", hostname: "cdn.pickleball.com" },
      { protocol: "https", hostname: "www.pickleball.com" },
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
    return LEGACY_REDIRECTS.map((r) => ({ ...r, permanent: true }));
  },
  /**
   * The two static decks live as `public/<name>/index.html`. They resolved at
   * `/app-tour` and `/pbtv` purely through Vercel's static directory-index
   * behavior — which never worked under `next start`, and which now has a
   * dynamic `app/[slug]` route competing for the same paths. `beforeFiles` runs
   * ahead of both the filesystem and dynamic routes, so these are pinned
   * regardless of match order. /app-tour is forwarded to stakeholders outside
   * the company, so it must not 404.
   */
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/app-tour", destination: "/app-tour/index.html" },
        { source: "/pbtv", destination: "/pbtv/index.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
