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
  {
    // Bryan Renahan's request, 9/21: the Junior PPA Select Team press release
    // as a post. Body is the release verbatim (Google Doc
    // 1omskvlw37hBSBg84k4DHUwON0y2_Qg7IYJDej0Q21yA, linked from Asana
    // 1218609240918483). Nothing is added, cut or reordered.
    //
    // ⚠ EMBARGOED TO 2026-09-22 10:00 CT, AND THE DATE BELOW DOES NOT ENFORCE
    // THAT. Nothing filters posts on publishedAt — it is the sort key and the
    // displayed date, nothing more — so this post is live the moment it is
    // deployed. The embargo is held by not deploying, exactly like the Select
    // Team section on /tour/junior.
    //
    // Title and dek are the release's own headline and sub-heading. The
    // earlier draft had neither and they had to be written; this revision
    // supplies both, so nothing on this post is authored here.
    slug: "junior-ppa-tour-announces-the-junior-ppa-select-team",
    wpId: 900002,
    status: "published",
    source: "wordpress",
    // Chosen by hand: this is an announcement, and "Tour News" is what the
    // archive's other 343 announcements carry.
    category: "Tour News",
    series: null,
    categoryResolvedBy: "fallback",
    title: "Carvana Junior PPA Tour Launches Junior PPA Select Team to Develop Elite Youth Pickleball Talent",
    dek: "18u and 14u Junior PPA Select Team player selections to take place after Junior PPA competition at Opendoor Pickleball World Championships",
    // The release carries no byline. "PPA Tour" is the archive's house byline
    // for unsigned tour announcements (154 posts) — inventing a writer would
    // attribute a real person's name to copy they may not have written.
    author: "PPA Tour",
    publishedAt: "2026-09-22T10:00:00",
    publishedAtGmt: "2026-09-22T15:00:00",
    modifiedAt: "2026-09-22T15:00:00",
    image: {
      // Supplied by Wesley on launch morning, 9/22 — Junior PPA stadium-court
      // doubles under the lights. Replaces the interim gallery frame.
      //
      // ⚠ NO NAMES. House style on this archive is a generic description, and
      // these are photographs of minors — the same rule the Junior PPA gallery
      // ships under. A spectator sign reading "ELLA" is visible in the crowd;
      // it is a fan's sign, not an identification of either player, and
      // nothing here captions anyone.
      //
      // Encoded to the house news standard: 2048x1365, mozjpeg q64, 4:4:4.
      url: "/ppa/news/junior-ppa-select-team.jpg",
      alt: "Junior PPA Tour players competing in a doubles match on stadium court.",
      width: 2048,
      height: 1365,
    },
    // Empty on purpose: detectAthleteMentions reads the body and resolves the
    // roster itself. This release names no pros, so it correctly finds none.
    players: [],
    playerNames: [],
    wpEvent: null,
    tags: [],
    tagsRaw: [],
    wpCategories: [],
    embeds: [],
    inlineImages: [],
    // Never existed on WordPress, so its canonical home is this site.
    legacyUrl: "https://www.ppatour.com/junior-ppa-tour-announces-the-junior-ppa-select-team/",
    seo: {
      title: "Carvana Junior PPA Tour Launches Junior PPA Select Team | PPA Tour",
      description:
        "The Junior PPA Select Team commences Jan. 1, 2027 with 18u and 14u development squads, with players selected after the Junior Pickleball World Championships in Dallas, Nov. 5-8, 2026.",
      canonical:
        "https://www.ppatour.com/junior-ppa-tour-announces-the-junior-ppa-select-team/",
    },
    bodyHtml: `
<p>The Carvana Junior PPA Tour has announced the formation of the Junior PPA Select Team, a premier development pathway aimed at identifying, training, and elevating the next generation of elite pickleball athletes. The program is set to commence on Jan. 1, 2027, following player selections made after the Junior Pickleball World Championships in Dallas, Texas, scheduled for Nov. 5-8, 2026, as part of the larger <a href="/events/2026/pickleball-world-championships/">Opendoor Pickleball World Championships</a> held at Brookhaven Country Club from Nov. 2-8.</p>



<p>The Junior PPA Select Team will consist of two high-level development squads: 18-and-under (18u) and 14-and-under (14u). Each team is designed to cultivate rising talent and prepare young athletes for future competition on the Carvana PPA Tour. Players selected for the Junior PPA Select Team will receive exclusive competition perks, advanced training sessions, specialized coaching, significant exposure, and mentorship from PPA Tour professionals.</p>



<p>Selection criteria for the Junior PPA Select Team include commitment, work ethic, professional potential, Junior PPA ranking points, and past achievements across PPA competitions. This initiative aligns with the Junior PPA&#8217;s mission to promote, encourage, and advance youth pickleball by maximizing the physical and mental development of promising athletes on the Junior PPA Tour.</p>



<p>&#8220;Junior pickleball players have been making their mark on the broader pickleball community in extraordinary ways, and now it&#8217;s time to take the next step in advancing the elite talent nurtured in the Junior PPA ranks,&#8221; said Jake Weinbach, Director of Junior PPA Tour, Professional Pickleball Association. &#8220;The PPA has worked incredibly hard to create an encouraging and inclusive environment where kids can unlock their skill set, potential, and have fun playing the fastest-growing sport in the country. The Junior PPA Select Team is the stage where elite talents can further enhance their game and elevate their mental and physical development on the road to becoming the next pickleball superstar.&#8221;</p>



<p>The Junior PPA Select Team aims to provide a structured environment for young athletes to develop their skills and gain exposure to higher levels of competition. By offering specialized coaching and mentorship, the program seeks to bridge the gap between junior and professional levels, ensuring a seamless transition for athletes aspiring to compete on the PPA Tour.</p>



<p>The Junior Pickleball World Championships in Dallas will serve as a pivotal event for the selection process, bringing together top junior players from across the country. The championships will feature a series of competitive matches, providing a platform for athletes to showcase their skills and vie for a spot on the Junior PPA Select Team.</p>



<p>The Junior PPA Tour has experienced significant growth since its inception, with over 1,200 junior pickleball players registered in the program. The introduction of the Junior PPA Select Team represents a strategic expansion of the tour&#8217;s commitment to fostering young talent and elevating the sport&#8217;s profile nationally and internationally.</p>
`.trim(),
  },
];
