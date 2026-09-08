/**
 * Posts written after the WordPress migration — hand-authored, not imported.
 *
 * ⚠ THIS FILE EXISTS BECAUSE `lib/data/news-posts.json` IS NOT SAFE TO EDIT.
 * `scripts/import-wp-posts.mjs` is re-runnable and rewrites that file WHOLESALE
 * (`writeFile(jsonPath, JSON.stringify(out))`), so a post added there survives
 * only until the next import and then vanishes with no error. Same trap the
 * `BYLINES` map and `scripts/wp-body-edits.mjs` were built to dodge. Anything
 * written from here on goes in this file instead, and the importer never
 * touches it.
 *
 * ⚠ WHY THESE ARE WP-SHAPED RATHER THAN NATIVE ARTICLES. `lib/news-articles.ts`
 * renders `body: string[]` as flat paragraphs and requires a `whyItMatters`
 * callout. That is right for newsroom editorial and wrong for a stats wrap,
 * which is headings and bullet lists — the native path would flatten the whole
 * structure, and the required callout would mean writing editorial copy under
 * somebody else's byline. WP-shaped posts render real HTML through
 * `renderPostHtml`, which is what this series has always used.
 *
 * ⚠ THE AI APPROVAL GATE DOES NOT APPLY TO THESE. `docs/CONTENT-APPROVAL.md`
 * governs AI-GENERATED tour coverage — "AI-generated tour coverage must not go
 * live without a human click", approver Dylan. A post here is human-written and
 * supplied by the tour, so it publishes like any other filed copy. If anything
 * AI-written ever needs to ship, it belongs in `lib/news-articles.ts` behind
 * that gate, not in this file.
 *
 * ⚠ `wpId` IS A LOCAL SENTINEL, NOT A WORDPRESS ID. These posts have no WP
 * record. Numbering starts at 900001 to stay clear of the real ids (the archive
 * tops out around 30k) so a collision cannot quietly shadow a migrated post.
 */
import type { WpPost } from "@/lib/wp-news";

/** Hand-authored posts, in the same shape the importer produces. */
export const authoredPosts: Omit<WpPost, "postType">[] = [
  {
    slug: "championship-sunday-standout-stats-from-the-veolia-pickleball-national-championships",
    wpId: 900001,
    status: "published",
    source: "wordpress",
    category: "Recap",
    series: "stats-wrap",
    categoryResolvedBy: "series",
    title: "Championship Sunday Standout Stats from the Veolia Pickleball National Championships",
    dek: "Cary, North Carolina. September 6, 2026. Bright and Patriquin take mixed, Johns and Tardio a 19th title together, and Anna Leigh Waters completes the weekend with her 64th career title.",
    author: "Jim Ramsey",
    publishedAt: "2026-09-08T10:00:00",
    publishedAtGmt: "2026-09-08T15:00:00",
    modifiedAt: "2026-09-08T15:00:00",
    image: {
      url: "/ppa/news/championship-sunday-standout-stats-nationals-2026.jpg",
      // ⚠ NO NAMES. House style on this series is a generic description (the
      // May post reads "Female athlete holding trophy at PPA Tour pickleball
      // event"), and naming a player from a photograph is how the wrong athlete
      // gets captioned. The supplied file is an Atlanta Slam mixed-doubles
      // frame, not Cary — a placeholder Wesley said he would swap.
      alt: "Pickleball pro following through on a forehand at a PPA Tour event.",
      width: 2048,
      height: 1365,
    },
    // Left empty deliberately: `detectAthleteMentions` reads the body and
    // resolves the roster itself, which is how every migrated post in this
    // series behaves.
    players: [],
    playerNames: [],
    wpEvent: {
      slug: "2026-veolia-pickleball-national-championships",
      name: "2026 Veolia Pickleball National Championships",
    },
    tags: [],
    tagsRaw: [],
    wpCategories: ["2026-veolia-pickleball-national-championships", "stats-wrap"],
    embeds: [],
    inlineImages: [],
    // ⚠ Every migrated post carries the ppatour.com URL it was served at, and
    // that string is the source of the 301 map. This post never existed on
    // WordPress, so its canonical home is this site and the URL is the one it
    // will be served at here.
    legacyUrl: "https://www.ppatour.com/championship-sunday-standout-stats-from-the-veolia-pickleball-national-championships/",
    seo: {
      title: "Veolia Pickleball National Championships: Championship Sunday Stats | PPA Tour",
      description:
        "Championship Sunday stats from the Veolia Pickleball National Championships in Cary: Bright and Patriquin win mixed, a 19th title for Johns and Tardio, and a 64th for Anna Leigh Waters.",
      canonical:
        "https://www.ppatour.com/championship-sunday-standout-stats-from-the-veolia-pickleball-national-championships/",
    },
    bodyHtml: `
<p><strong>Cary, North Carolina.</strong></p>



<p><strong>September 6, 2026.</strong></p>



<hr class="wp-block-separator has-alpha-channel-opacity"/>



<h4 class="wp-block-heading"><strong>MIXED DOUBLES FINAL:&nbsp; (2) Anna Bright and Hayden Patriquin def. (3) Jorja Johnson and JW Johnson, 11-9, 11-3, 11-7.</strong>&nbsp;</h4>



<ul class="wp-block-list">
<li>Second title together for Bright and Patriquin. (Mesa, Feb. 2026, beat Waters/Johns)</li>



<li>Bright&#8217;s sixth career title joins Jorja Johnson, JW Johnson and Riley Newman for a fifth-place tie.</li>



<li>Johnsons beat Waters and Johns in the semis.</li>



<li>Bright and Patriquin had fewer Dinks into the net or wide, 9-4.</li>



<li>Bright and Patriquin had fewer Volleys into the net, 11-4.</li>



<li>Longest rally: 60 shots.</li>
</ul>



<h4 class="wp-block-heading"><strong>MEN&#8217;S DOUBLES FINAL:&nbsp; (1) Ben Johns and Gabe Tardio def. (2) Christian Alshon and Andre Daescu, 11-8, 11-8, 5-11, 11-5.</strong>&nbsp;</h4>



<ul class="wp-block-list">
<li>19<sup>th</sup> title together for Johns and Tardio. (Johns has 65; Tardio has 25)</li>



<li>Johns and Tardio had fewer Dinks into the net or wide, 8-1.</li>



<li>Johns and Tardio had fewer Serve/Return/Third Shot Errors, 4-2.</li>



<li>Alshon had a match-high 15 Clean Winners, more than Johns and Tardio combined (13).</li>



<li>Longest rally: 46 shots.</li>
</ul>



<h4 class="wp-block-heading"><strong>WOMEN&#8217;S DOUBLES FINAL:&nbsp; (1) Anna Bright and Anna Leigh Waters def. (2) Tyra Black and Jorja Johnson, 11-5, 11-6, 11-3.</strong>&nbsp;</h4>



<ul class="wp-block-list">
<li>24<sup>th</sup> title together for Bright and Waters. (Bright has 33; Waters has 66).</li>



<li>Bright and Waters had fewer Dinks into the net or wide, 6-0.</li>



<li>Bright and Waters had fewer Volleys into the net, 17-11.</li>



<li>Black and Johnson is only the fourth team in <em>any</em> final to have no errors on Serves/Returns/Third Shots, i.e., keeping them all &#8220;in play.&#8221;</li>



<li>Every Serve and Return during this match was kept in play.</li>



<li>Longest rally: 61 shots.</li>
</ul>



<h4 class="wp-block-heading"><strong>MEN&#8217;S SINGLES FINAL:&nbsp; (3) Hunter Johnson def. (2) Federico Staksrud, 7-11, 11-3, 11-0.</strong>&nbsp;</h4>



<ul class="wp-block-list">
<li>Ninth career title for Johnson, third all-time behind Johns (42) and Staksrud (20).</li>



<li>Johnson had more Clean Winners, 17-5.</li>



<li>Johnson had fewer Serve &amp; Return Errors, 7-3.</li>



<li>Longest rally: 13 shots.</li>
</ul>



<h4 class="wp-block-heading"><strong>WOMEN&#8217;S SINGLES FINAL:&nbsp; (1) Anna Leigh Waters def. (2) Kate Fahey, 11-1, 11-9.</strong>&nbsp;</h4>



<ul class="wp-block-list">
<li>Waters&#8217;s 64<sup>th</sup> career title.</li>



<li>Waters is now 12-0 in finals vs Fahey.</li>



<li>Waters and Fahey played five of the ten finals from January to May.</li>



<li>Waters had no errors on Serves and Returns.</li>



<li>Waters had fewer Baseline Drive Errors, 11-6.</li>



<li>Longest rally: 23 shots. That was the most in <em>any</em> singles final since Roscoe Bellamy and Hunter Johnson had a 28-shot rally at the Lakeland Open final in November 2025.</li>
</ul>



<hr class="wp-block-separator has-alpha-channel-opacity"/>



<h4 class="wp-block-heading"><strong>LEADING AT THE CHANGEOVER:</strong></h4>



<ul class="wp-block-list">
<li>Did the players or teams leading a game when they changed sides at six points go on to win that game? Yes, 13 times in 15 games.</li>
</ul>



<p><strong>For the comprehensive stats of all these gold medal matches, please visit: </strong><a href="https://facebook.com/groups/propickleballstats" target="_blank" rel="noreferrer noopener"><strong>facebook.com/groups/propickleballstats</strong></a></p>
`.trim(),
  },
];
