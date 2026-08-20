import type { NextConfig } from "next";

/**
 * 301s from the current WordPress ppatour.com URL structure to this site's
 * routes — the launch-critical piece of the migration: without these, every
 * ranking the old site holds resets to zero at cutover. Harmless before
 * cutover (none of these paths exist here). Sources: page-sitemap.xml,
 * athlete-sitemap.xml, tournament-sitemap.xml on the live site (Jul 2026).
 *
 * Posts need NO redirect: `app/[slug]` serves them at the same root URL
 * WordPress used, so ppatour.com/some-post-slug keeps working byte-for-byte
 * after cutover. (An earlier pass mapped each post to /news/{slug} and shipped
 * 811 redirects; both are gone.) Verified: none of the 826 slugs collides with a
 * route segment, a public/ path, or a redirect source below — and Next matches
 * static segments before the dynamic `[slug]`, so /events, /athletes and friends
 * always win.
 *
 * ⚠ NOR DO THE 39 PPA BLOG POSTS, AND TWO REDIRECTS WERE DELETED HERE ON
 * 2026-08-04 TO MAKE THAT TRUE. `/ppa-blog/:slug*` → `/news` and `/blog` →
 * `/news` collapsed the tour's best-ranking evergreen pages ("how to play
 * pickleball", "pickleball scoring guide", "what is an erne") into one index,
 * which Google reads as a soft 404 and drops. The posts were never imported —
 * `import-wp-posts.mjs` pulls post_type=post only, and ppa-blog is a separate
 * post type with its own taxonomy and its own sitemap. `app/ppa-blog/[slug]`
 * and `app/blog` now serve both paths for real. Flagged by Hannah Johns.
 *
 * ⚠ The 8/3 legacy-sitemap crawl reported "ppa-blog 40/40 resolve" while this
 * was broken. It checked status codes, and a 301 to /news is a 200. **A
 * coverage check that does not compare CONTENT cannot see a wrong destination.**
 */
const LEGACY_REDIRECTS = [
  /**
   * Consolidate the old standalone Pickleball Vacations app: everything on
   * vacations.ppatour.com moves to www.ppatour.com, path + query preserved.
   * FIRST so it wins on that host in one hop. Punta Cana/Turks guests hold
   * `vacations.ppatour.com/success?session_id=cs_live_…` links; the query rides
   * through, and the www-side `/success → /vacations/success/` rule below adds
   * the prefix. Only fires for that exact host, so www/apex are unaffected.
   */
  {
    source: "/:path*",
    has: [{ type: "host" as const, value: "vacations.ppatour.com" }],
    destination: "https://www.ppatour.com/:path*",
  },
  // sections
  { source: "/schedule", destination: "/events" },
  { source: "/player-rankings", destination: "/rankings" },
  { source: "/player-rankings-table", destination: "/rankings" },
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
  { source: "/hospitality", destination: "/tour/hospitality" },

  /**
   * Pickleball Vacations moved onto this site (Aug 2026) — it used to be a
   * standalone Next app on vacations.ppatour.com. Both the legacy WordPress
   * `/travel` URL and the tour-program page that fronted it now land on the
   * real thing.
   *
   * ⚠ The subdomain itself must ALSO be redirected here, path- and
   * query-preserving, and that is a Vercel domain setting rather than a line in
   * this file: guests hold Stripe confirmation links of the form
   * `vacations.ppatour.com/success?session_id=cs_live_…` in their inboxes, and
   * Lainey's collateral prints the subdomain. The rules below give every one of
   * those paths a destination once the domain points here. See docs/VACATIONS.md.
   */
  // Destinations carry the trailing slash on purpose: `trailingSlash: true`
  // would otherwise add a SECOND 308 onto every one of these, and the guest
  // confirmation links below are the ones paying for it.
  { source: "/travel", destination: "/vacations/" },
  { source: "/tour/travel", destination: "/vacations/" },
  // Paths that existed on the standalone site, in its own URL shape.
  { source: "/register", destination: "/vacations/register/" },
  { source: "/success", destination: "/vacations/success/" },
  { source: "/trips", destination: "/vacations/" },
  { source: "/trips/punta-cana", destination: "/vacations/trips/punta-cana/" },
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

  /**
   * Orphans from ppatour.com's page-sitemap, found by crawling all five legacy
   * sitemaps against this build (2026-08-02). Coverage was otherwise excellent —
   * post 812/812, blog 40/40, athlete 218/218, tournament 178/178 all resolve —
   * but 10 of the 37 page-sitemap URLs had nowhere to land. All 10 are live 200s
   * on ppatour.com today, so each is a real 404 the moment the domain moves.
   *
   * Only the three with an unambiguous destination are mapped here. The other
   * seven need a human call and are listed in docs/LAUNCH.md — guessing a
   * destination for a sponsor-named campaign page is worse than a 404, the same
   * reasoning that left the Chicago hotel link unmapped on 7/29.
   */
  { source: "/opt-out-preferences", destination: "/about/privacy" },
  { source: "/content-policy", destination: "/about/terms" },
  { source: "/ppa-tour-event-inquiry-form", destination: "/about/host-tournament" },
  /**
   * The rest of the page-sitemap orphans, ruled on by Bryce 8/3. All were live
   * 200s on ppatour.com and would have 404'd at cutover.
   *
   * `/vote/` was the Carvana Driving Pickleball Forward Award and
   * `/ppa-survey-ticket-giveaway/` a campaign page — both expired, both go home
   * rather than to a dead campaign. `/video-submission/` is retired "for now",
   * so if the intake comes back it wants a real page, not this line.
   */
  { source: "/social-media-landing-page", destination: "/" },
  { source: "/vote", destination: "/" },
  { source: "/vote/thank-you", destination: "/" },
  { source: "/ppa-survey-ticket-giveaway", destination: "/" },
  { source: "/video-submission", destination: "/" },
  { source: "/welcome-email", destination: "/" },
  /**
   * The video game page is the one orphan Bryce wanted KEPT, not redirected
   * away — rebuilt at /game (short enough to say out loud on a broadcast) with
   * the legacy URL forwarding into it so the existing links and search equity
   * still land.
   */
  { source: "/ppa-pickleball-tour-video-game", destination: "/game" },

  /**
   * Duplicate athlete profiles (2026-08-05). WordPress mints a `-2` slug for a
   * second post under an existing name, and four of those came through the
   * profile scrape as real pages on this site — each one alongside the canonical
   * page and each one WINNING on /athletes, since the roster grid is built from
   * the scrape. Fixed in `lib/data/published-athletes.json`; these keep the URLs
   * alive, because they are live 200s on ppatour.com today AND have been served
   * here, so both indexes point at them.
   *
   * ⚠ `luana-stanciu-1` is deliberately absent. The suffix is not the test:
   * that IS the Partner API's canonical slug for her (world No. 91, and there is
   * no `luana-stanciu` on the board), so redirecting it would break the page.
   * Same for `/athlete/ben-johns-3` — a different, real player. See
   * lib/athlete-slugs.ts.
   */
  // Destinations carry the trailing slash for the same reason the vacations
  // rules above do: `trailingSlash: true` would otherwise stack a second 308 on
  // top of each 301.
  { source: "/athletes/elsie-hendershot-2", destination: "/athletes/elsie-hendershot/" },
  { source: "/athletes/danna-funaro-2", destination: "/athletes/danna-funaro/" },
  { source: "/athletes/ella-cosma-2", destination: "/athletes/ella-cosma/" },
  { source: "/athletes/edward-perez-2", destination: "/athletes/edward-perez/" },
  // The legacy `/athlete/{slug}` form chains through the `/athlete/:slug` rule
  // below into the four above.

  // patterns
  // Articles briefly lived at /news/{slug}; fold those into the root URL so the
  // two paths don't compete for the same content.
  { source: "/news/:slug", destination: "/:slug" },
  { source: "/athlete/:slug", destination: "/athletes/:slug" },
  // `/pro/:slug` was the other legacy profile prefix and had no rule; 6 of the
  // 9 links using it point at athletes who do have a page here.
  { source: "/pro/:slug", destination: "/athletes/:slug" },
  { source: "/tournament/:path*", destination: "/events" },

  /**
   * The two PPA Blog posts not carried over (Bryce, 8/4 — the only two with no
   * `blog-category` in WordPress). Both are live 200s on ppatour.com today, so
   * without these they become brand-new 404s the moment DNS moves. 301'd to
   * /blog rather than dropped: same topic, and a relevant index keeps whatever
   * links and equity they hold instead of throwing it away.
   *
   * ⚠ These must sit ABOVE nothing and BELOW nothing in particular, but they
   * MUST outlive the import: `DROPPED` in scripts/import-wp-blog.mjs is what
   * keeps the posts out, and these two lines are what keeps their URLs alive.
   * Delete one without the other and the pair stops making sense.
   */
  { source: "/ppa-blog/pickleball-kitchen-rules-what-you-should-know", destination: "/blog" },
  { source: "/ppa-blog/is-pickleball-an-olympic-sport", destination: "/blog" },

  /**
   * The 12 native demo articles, removed 8/5 (Bryce) — see the header of
   * `lib/news-articles.ts`. They were AI-written editorial about real, named
   * pros, and they were live and in the sitemap on an indexable site from 8/3,
   * so their URLs may be crawled. Sent to the newsroom index rather than left
   * to 404: the archive they belonged to still exists and is full of real
   * posts.
   *
   * ⚠ Verified against all 848 migrated slugs before adding — redirects are
   * matched BEFORE filesystem routes, so a collision here would take a real
   * WordPress article off the site. Zero collisions. Re-run that check if any
   * source below is ever reworded.
   *
   * The other 3 articles from that file needed no rule: they were `draft` and
   * never rendered a URL at all.
   */
  { source: "/vegas-final-five-stats", destination: "/news/" },
  { source: "/atlanta-draw-decoded", destination: "/news/" },
  { source: "/rookie-class-rankings", destination: "/news/" },
  { source: "/race-report-spring-swing", destination: "/news/" },
  { source: "/record-25-event-season", destination: "/news/" },
  { source: "/atlanta-court-surface", destination: "/news/" },
  { source: "/two-game-comeback-strategy", destination: "/news/" },
  { source: "/junior-ppa-pipeline", destination: "/news/" },
  { source: "/top-10-drop-shots-vegas", destination: "/news/" },
  { source: "/2026-rule-changes", destination: "/news/" },
  { source: "/ranking-points-explained", destination: "/news/" },
  { source: "/day-in-the-life-on-tour", destination: "/news/" },
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
  /**
   * ⚠ AN ESCAPE HATCH FOR VERIFYING A BUILD WHILE `next dev` IS RUNNING, and it
   * exists because not having it shipped a broken deploy. A dev server owns
   * `.next`, and building against the same directory is what produced the "Jest
   * worker" mystery of 8/5 pt.19 — so builds kept getting skipped, and a
   * `useSearchParams()` outside a Suspense boundary reached Vercel, where it
   * failed every prerendered page. tsc and eslint were both clean; only
   * `next build` catches that class of error.
   *
   *   BUILD_DIST_DIR=.next-buildcheck npx next build
   *
   * Unset in normal use, so nothing changes for dev, CI or Vercel.
   */
  distDir: process.env.BUILD_DIST_DIR || ".next",

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
        // Per-show pages under the same static deck (public/pbtv/shows/<slug>/).
        { source: "/pbtv/shows/:slug", destination: "/pbtv/shows/:slug/index.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
