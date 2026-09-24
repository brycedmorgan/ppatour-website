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
    // The default footer CTA sells tickets to the next PRO stop, which is the
    // wrong action on a junior announcement. Points at the Junior PPA page
    // instead — internal, so it renders same-tab with no UTM, and the TV
    // Schedule button stands down beside it.
    ctaUrl: "/tour/junior/",
    ctaLabel: "Explore the Junior PPA Tour",
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
  {
    // Jim Ramsey's Championship Sunday stats wrap for the Veolia Arizona Open,
    // supplied 9/23. Third post in this series written after the migration, and
    // the 38th "Championship Sunday Standout Stats" in the archive.
    //
    // ⚠ EVERY RESULT WAS CHECKED AGAINST THE LIVE FEED BEFORE PUBLISHING AND
    // ALL FIVE MATCH EXACTLY — winners, losers, seeds and every game score,
    // including the (15) seed on Acevedo/Funemizu and the 15-13 third game. The
    // changeover line checks out too: the five finals ran 2+3+3+3+2 = 13 games,
    // which is the denominator it quotes.
    //
    // ⚠ THE DATELINE WAS CORRECTED FROM "September 22" TO "September 20", AND
    // IT IS THE ONE SUBSTANTIVE EDIT TO THE SUPPLIED COPY. Championship Sunday
    // at this stop was Sunday, Sep 20: the curated record ends the event
    // 2026-09-20, Dave Fleming's own preview says "Sept. 14-20", and the feed
    // has the men's doubles final on Sun Sep 20 — the other four roll to "Mon,
    // Sep 21" only because a 2 PM Mesa first serve pushes them past UTC
    // midnight, the same rollover `endOfEvent` was fixed for on 9/20. Sep 22 is
    // a Tuesday, i.e. the day the document was written. Across all 37 archived
    // posts in this series the dateline is the SUNDAY and never the writing
    // date (May 10, May 3, Apr 19, Mar 29, Mar 15, Mar 8 — every one a Sunday),
    // and the headline says "Championship Sunday". One edit to revert.
    //
    // ⚠ ONE NAME FIXED: "Funemuzu" -> "Funemizu", in the bullet about his first
    // domestic medal. The supplied document spells it Funemizu twice and
    // Funemuzu once, and the feed and published-athletes.json both say **Yuta
    // Funemizu**, so it is an internal typo rather than a claim. Name spellings
    // are checked against the roster; punctuation and house style are left as
    // filed (the stray comma in "Waters 67, Johns, 80" is theirs and stays).
    //
    // ⚠ "Chris Haworth" and "Nico Acevedo" are deliberately left as written.
    // Haworth is published as Christopher Haworth and resolves through
    // ATHLETE_NAME_ALIASES, so the rail entry and the inline link both work.
    // Acevedo is `nicolas-acevedo` on the WPR board with no profile on this
    // site, so there is nothing to link and nothing to alias — deriving one is
    // the "Zoey Wang" failure.
    slug: "championship-sunday-standout-stats-from-the-veolia-arizona-open",
    wpId: 900003,
    status: "published",
    source: "wordpress",
    category: "Recap",
    series: "stats-wrap",
    categoryResolvedBy: "series",
    title: "Championship Sunday Standout Stats from the Veolia Arizona Open",
    dek: "Mesa, Arizona. September 20, 2026. Anna Leigh Waters doubles up in singles and mixed, Chris Haworth lands his first title of the season, and Rachel Rohrabacher plays two finals on Championship Sunday.",
    author: "Jim Ramsey",
    publishedAt: "2026-09-23T10:00:00",
    publishedAtGmt: "2026-09-23T15:00:00",
    modifiedAt: "2026-09-23T15:00:00",
    image: {
      // ⚠ NOT THE EVENT'S OWN FEATURED SHOT AND NOT THE STORYLINES FRAME.
      // `featured-mesa-cup.jpg` is pinned as this event's hero, card and OG
      // image in HERO_OVERRIDE_BY_EVENT_SLUG and `crowd-04.jpg` carries Dave
      // Fleming's 9/9 preview, so either would print the same picture twice
      // wherever two of those cards share a page.
      //
      // ⚠ AND THE CROWD FRAMES WERE RULED OUT BY LOOKING AT THEM, NOT BY
      // FILENAME. crowd-01..05 were all shot at the CARVANA MESA CUP in
      // February and carry "MESA ARIZONA CUP" readable on the court-side
      // banner — a different event, four months earlier, at the same venue. On
      // an article about the Arizona Open that is a caption a reader can catch.
      // This aerial is the grounds themselves at dusk with no event-specific
      // signage, which is true of this stop and of every other played here.
      url: "/ppa/venues/aag-mesa/aerial-02.jpg",
      // ⚠ NO NAMES. House style on this series is a generic description, and
      // nobody in this frame is identifiable or identified.
      alt: "Aerial view of the tournament courts at Arizona Athletic Grounds in Mesa at sunset.",
      width: 1800,
      height: 1200,
    },
    // Left empty deliberately: `detectAthleteMentions` reads the body and
    // resolves the roster itself, which is how every post in this series works.
    players: [],
    playerNames: [],
    wpEvent: { slug: "2026-veolia-arizona-open", name: "2026 Veolia Arizona Open" },
    tags: [],
    tagsRaw: [],
    wpCategories: ["2026-veolia-arizona-open", "stats-wrap"],
    embeds: [],
    inlineImages: [],
    // Never existed on WordPress, so its canonical home is this site and the
    // URL is the one it will be served at here.
    legacyUrl: "https://www.ppatour.com/championship-sunday-standout-stats-from-the-veolia-arizona-open/",
    seo: {
      title: "Veolia Arizona Open: Championship Sunday Stats | PPA Tour",
      description:
        "Championship Sunday stats from the Veolia Arizona Open in Mesa: Anna Leigh Waters wins singles and mixed, Chris Haworth takes men's singles, and Rohrabacher and Todd win women's doubles.",
      canonical:
        "https://www.ppatour.com/championship-sunday-standout-stats-from-the-veolia-arizona-open/",
    },
    bodyHtml: `
<p><strong>Mesa, Arizona.</strong></p>



<p><strong>September 20, 2026.</strong></p>



<hr class="wp-block-separator has-alpha-channel-opacity"/>



<h4 class="wp-block-heading"><strong>MIXED DOUBLES FINAL:&nbsp; (1) Anna Leigh Waters and Ben Johns def. (2) Rachel Rohrabacher and Christian Alshon, 11-3, 11-6.</strong>&nbsp;</h4>



<ul class="wp-block-list">
<li>Waters and Johns are 65-3 in finals together. (Career titles: Waters 67, Johns, 80)</li>



<li>Waters and Johns won a silver here in February, losing to Bright and Patriquin.</li>



<li>Waters and Johns won the last eight points of Game Two to finish the match.</li>



<li>Waters kept every Serve, Return, Third Shot and Dink &#8220;in play.&#8221;</li>



<li>Alshon had a match-high nine Clean Winners.</li>



<li>Longest rally: 36 shots.</li>
</ul>



<h4 class="wp-block-heading"><strong>MEN&#8217;S DOUBLES FINAL:&nbsp; (2) Christian Alshon and Andrei Daescu def. (15) Nico Acevedo and Yuta Funemizu, 11-7, 7-11, 15-13.</strong>&nbsp;</h4>



<ul class="wp-block-list">
<li>Fourth career title together for Alshon and Daescu.</li>



<li>First domestic PPA Tour medals for both Acevedo and Funemizu.</li>



<li>Acevedo and Funemizu had seven Match Points in Game Three.</li>



<li>Acevedo had a match-high 17 Clean Winners.</li>



<li>Longest rally: 44 shots.</li>
</ul>



<h4 class="wp-block-heading"><strong>WOMEN&#8217;S DOUBLES FINAL:&nbsp; (1) Rachel Rohrabacher and Parris Todd def. (2) Tyra Black and Meghan Dizon, 11-4, 10-12, 11-6.</strong>&nbsp;</h4>



<ul class="wp-block-list">
<li>Rohrabacher&#8217;s tenth career Women&#8217;s Doubles title (eight with Anna Bright).</li>



<li>Todd&#8217;s fourth career Women&#8217;s Doubles title, and second with Rohrabacher.</li>



<li>Rohrabacher and Todd kept every Serve, Return and Third Shot &#8220;in play.&#8221;</li>



<li>Rohrabacher and Todd had three Match Points in Game Two.</li>



<li>Black had a match-high ten Clean Winners.</li>



<li>Longest rally: 54 shots.</li>
</ul>



<h4 class="wp-block-heading"><strong>MEN&#8217;S SINGLES FINAL:&nbsp; (1) Chris Haworth def. (2) Federico Staksrud, 10-12, 11-9, 11-6.</strong>&nbsp;</h4>



<ul class="wp-block-list">
<li>Haworth&#8217;s ninth title, all since 2024, and first this season.</li>



<li>Staksrud has 20 Men&#8217;s Singles titles, and his 20 silver medals are the most all-time.</li>



<li>Haworth won the last eight points of Game Three.</li>



<li>Haworth had more Clean Winners, 18-11.</li>



<li>Longest rally: 16 shots.</li>
</ul>



<h4 class="wp-block-heading"><strong>WOMEN&#8217;S SINGLES FINAL:&nbsp; (1) Anna Leigh Waters def. (2) Kate Fahey, 11-9, 11-4.</strong>&nbsp;</h4>



<ul class="wp-block-list">
<li>Waters has a 65-3 career record in Singles finals.</li>



<li>Waters is 54-0 in Finals since losing in June 2022.</li>



<li>Waters has won the last 27 tournaments that she has entered, including eight finals vs Fahey this year.</li>



<li>Waters had fewer baseline Drive Errors, 12-4.</li>



<li>Longest rally: 12 shots.</li>
</ul>



<hr class="wp-block-separator has-alpha-channel-opacity"/>



<h4 class="wp-block-heading"><strong>LEADING AT THE CHANGEOVER:</strong></h4>



<p>Did the players or teams leading a game when they changed sides at six points go on to win that game?</p>



<ul class="wp-block-list">
<li>This tournament: Yes. 8 times in 13 games.</li>



<li>This season: Yes. 21 times in 28 games (75%).</li>
</ul>



<p><em>All career records are &#8220;Domestic PPA Tour only.&#8221;</em></p>



<p><strong>For the comprehensive stats of all these gold medal matches, please visit: </strong><a href="https://facebook.com/groups/propickleballstats" target="_blank" rel="noreferrer noopener"><strong>facebook.com/groups/propickleballstats</strong></a></p>
`.trim(),
  },
];
