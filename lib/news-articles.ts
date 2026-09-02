/**
 * PPA Tour newsroom — full articles behind every headline. Demo editorial:
 * original copy grounded in the site's own season data (roster, rankings,
 * calendar, purses, broadcast). No direct quotes are attributed to real
 * players. Swap for Sanity CMS when the content pipeline lands.
 *
 * ── APPROVAL GATE (Connor's directive, 7/20) ─────────────────────────────
 * Nothing AI-written goes live or silently mutates without a human click.
 * Every NEW or REWRITTEN article MUST be committed with `status: "draft"`.
 * Drafts never render anywhere (no index, no page, no sitemap, no event
 * coverage, no homepage). Dylan approves by flipping `status` to
 * "published" in a follow-up commit. When Sanity lands, this field maps
 * onto Sanity's native draft/publish and Dylan approves in the Studio.
 * Full workflow: docs/CONTENT-APPROVAL.md
 */

export type NewsArticle = {
  slug: string;
  /**
   * Approval gate — REQUIRED. New/updated AI-generated articles start as
   * "draft" (invisible site-wide) until Dylan flips them to "published".
   */
  status: "published" | "draft";
  category: string;
  title: string;
  /**
   * Optional standfirst under the H1, in the hero.
   *
   * Exists because a press-release headline is not a web headline. Comms
   * writes one line carrying the hook AND the date, time and venue — correct
   * for a media alert, and as an H1 it wraps to five or six lines of display
   * type over the artwork, which is what it did here. Splitting the hook into
   * `title` and the logistics into `subtitle` keeps every word without the
   * headline swallowing the hero.
   *
   * ⚠ NOT in `<title>`, the meta description or the OG card — those take
   * `title` and `dek`, which is the point of moving this out of the headline.
   * Anything a search result or a share card must carry belongs in the dek
   * too, not only here.
   */
  subtitle?: string;
  /** Display date, e.g. "May 17" (2026). */
  date: string;
  dek: string;
  image: string;
  /**
   * CSS `object-position` for the ARTICLE HERO only — optional, and unset means
   * today's behaviour (`object-center`) for every other article.
   *
   * Why it exists: the hero is a `min-h-[44svh]` full-bleed band, so it crops
   * the image to roughly 3.6:1. On a photo framed head-to-toe, a centred crop
   * of that shape lands on torsos and the sponsor banner and cuts the faces
   * off entirely. Nudging the anchor up is the fix; the card and OG crops are
   * unaffected and already show faces, so this deliberately does NOT touch them.
   */
  imagePosition?: string;
  /**
   * Set when `image` is a designed GRAPHIC — its own lockup, logos and type,
   * like the Canes/Stanley Cup key art — rather than a photograph. The hero
   * then shows it WHOLE (object-contain, uncropped) with the headline on a band
   * below, instead of cover-cropping it and overlaying the headline on the
   * artwork (which collides with the graphic's own text). Photos leave it unset.
   */
  heroGraphic?: boolean;
  /**
   * Byline override. Unset falls back to the "PPA Tour" house byline, which is
   * right for anything the newsroom writes itself — set this only when a named
   * person actually authored the piece (e.g. comms issuing a press release).
   */
  author?: string;
  whyItMatters: string;
  /** Ties coverage to a tour stop — event pages render these under "Coverage". */
  eventSlug?: string;
  /**
   * Overrides the article footer's "See It Live" ticket button.
   *
   * ⚠ THAT BUTTON OTHERWISE SELLS THE NEXT TOUR STOP, NOT THIS STORY. It is
   * built from `getNextTournament()`, which is right for editorial — a recap
   * should point at whatever is on next — and wrong for an announcement that
   * exists to sell its own ticket. A Pro-Am, a fan fest or a watch party is a
   * separate Tixr listing from general event admission, so without this the
   * page's one call to action sends readers to a different product than the
   * one the story is about.
   *
   * Give the CLEAN listing URL — it goes through `withUtm` with this article's
   * own `article-<slug>` content tag, so a pre-tagged link pasted from a press
   * release would double up and misreport the click.
   */
  ctaUrl?: string;
  /** Button label for `ctaUrl`. Unset falls back to the next-stop wording. */
  ctaLabel?: string;
  /** Featured athletes (slugs) — merged with auto-detected name mentions. */
  players?: string[];
  body: string[];
};

/**
 * ⚠ THE 15 DEMO ARTICLES WERE DELETED ON PURPOSE — Bryce, 8/5. They were
 * AI-written editorial about REAL, NAMED pros: original copy grounded in the
 * site's own season data, but not reporting. Fine as a demo, wrong on a live
 * tour site that the whole company was about to be pointed at.
 *
 * ⚠ THIS DID NOT EMPTY THE NEWSROOM. /news, search, the homepage rail and the
 * sitemap all read `lib/news.ts`, which merges this list with the 811 migrated
 * WordPress posts + 39 PPA Blog entries — every one of them written and
 * published by a human. Those are untouched and remain the entire feed.
 *
 * What DID go dark: `newsForEvent()` is native-only, so event pages no longer
 * render a Coverage section (every call site already guards on
 * `coverage.length > 0`). Mapping the 322 WP posts that carry an event
 * category onto this site's event slugs is what lights it back up — see the
 * note on `newsForEvent` in lib/news.ts.
 *
 * The approval gate below stays exactly as it was. Real articles land here as
 * `status: "draft"` and Dylan publishes them (docs/CONTENT-APPROVAL.md), or
 * they arrive from Sanity when that pipeline lands.
 *
 * ⚠ IT NOW HOLDS EXACTLY ONE ENTRY, AND IT IS NOT EDITORIAL. The Aug 5
 * World Pickleball Rankings / BE THE BEST. post is Jeff Watson's official
 * press release, published at Wesley's instruction on the day it went out —
 * comms copy with two real attributed quotes, not AI-written coverage of
 * real pros. That is the distinction the emptying was about, so it does not
 * reopen the decision above. Anything that IS editorial still lands as
 * `status: "draft"` for Dylan.
 */
export const newsArticles: NewsArticle[] = [
  /**
   * ⚠ HUMAN-AUTHORED EDITORIAL, published at the content owner's instruction —
   * Dave Fleming's Nationals "storylines" preview, supplied by Tyler Dodd
   * (marketing) on Aug 11 with a request to post it and to byline Dave Fleming.
   * Same exception path as the Six Zero and press-release entries below: the
   * 7/20 approval gate exists to stop AI-WRITTEN copy going live unreviewed, and
   * this is neither — it is a named broadcaster's own preview. Ships
   * `status: "published"`; flagged to Dylan, who can flip it back to "draft" in
   * one line if the newsroom would rather stage it.
   *
   * ⚠ FAITHFUL TRANSCRIPTION, NOT A REWRITE. The source is a bulleted doc with a
   * section per draw, and a native `body` renders as plain paragraphs
   * (ArticleView → linkifyPlayers: no lists, no headings). So each bullet is
   * flattened to one paragraph and each draw is led by a short label line. The
   * seeds, streaks and every "watch out for" are Fleming's, verbatim — the
   * doubles seed lines keep his surname-only shorthand rather than us guessing
   * first names onto real pros. Only clear typos were fixed ("Partriquin" →
   * "Patriquin") and "R16/R64" spelled out.
   *
   * No `players` list: the rail resolves the many full-name mentions by
   * detection against published-athletes.json, and `eventSlug` ties it to the
   * Nationals event page's Coverage rail. The footer CTA is left to default —
   * the next tour stop IS this event, so it already points at Nationals tickets.
   */
  {
    slug: "veolia-pickleball-national-championships-storylines",
    status: "published",
    category: "Tour News",
    title: "Storylines for the Veolia Pickleball National Championships",
    subtitle: "Presented by Fasenra · Aug. 31–Sept. 6, 2026 · Cary, NC",
    date: "Aug 11",
    image: "/ppa/nationals-crowd-stadium.jpg",
    author: "Dave Fleming",
    eventSlug: "veolia-pickleball-national-championships",
    dek: "The 2026–27 Carvana PPA Tour season opens in Cary with the first of four majors — 2,000 points on the line, more than 1,400 players in the draw, and the new World Pickleball Rankings in effect for the first time.",
    whyItMatters:
      "The Tour's new September-to-May season starts with a major, and it is the first event scored under the three-discipline World Pickleball Rankings: 50% gender doubles, 35% mixed, 15% singles.",
    body: [
      "Overall Top 5",
      "Happy New Year: the Carvana PPA Tour now follows a September-to-May format, like the NHL and NBA.",
      "Worldly affair: the new World Pickleball Rankings are three-dimensional, combining all disciplines — 50% gender doubles, 35% mixed, and 15% singles.",
      "No \"I\" in team: how will the MLP winners, and those that came up just short, fare with a quick turnaround?",
      "Rock you like a hurricane: who will hoist the trophy like the NHL's Canes? The pro-am is Thursday night.",
      "Major implications: the year starts with one of four majors, worth 2,000 points.",
      "Venue, Tourney & TV",
      "This is the first event of the 26/27 season, with over 1,400 players participating.",
      "A progressive draw on the pro side means one round per bracket per day, and no bronze matches.",
      "Coverage on PickleballTV begins at 10 a.m. Eastern Tuesday through Friday and Sunday, with a 9 a.m. start Saturday. Tennis Channel carries afternoon coverage Thursday through Sunday (non-exclusive).",
      "Women's Singles",
      "Top four seeds: 1) Anna Leigh Waters, 2) Kate Fahey, 3) Kaitlyn Christian, 4) Brooke Buckner.",
      "Anna Leigh Waters' unbeaten streak has reached 824 days at the start of the main draws in NC.",
      "Potential battle in the round of 16: Brooke Buckner (4) vs. Cailyn Campbell (13).",
      "Watch out for Sofia Sewing (46) — a very talented player who will move up the rankings quickly, but she has to start in the 40s and will be a tough out in Cary.",
      "Men's Singles",
      "Top four seeds: 1) Chris Haworth, 2) Federico Staksrud, 3) Hunter Johnson, 4) Christian Alshon.",
      "Haworth is No. 1 in the world and hoping to pick up where he left off from his win at the PPA Finals — but he has not had a good DreamBreaker season in MLP, just three points over .500.",
      "Ben Johns is playing singles as the 24 seed and Tyson McGuffin as the 39 seed, and they meet in the round of 64. Theater.",
      "Another round-of-64 thriller: JW Johnson (28) vs. Max Freeman (33).",
      "Watch out for Grayson Goldin (26) — he battles a stroke, perseveres, and just won the PPA Asia event in China.",
      "Mixed Doubles",
      "Top four seeds: 1) Anna Leigh Waters / Ben Johns, 2) Anna Bright / Hayden Patriquin, 3) JW Johnson / Jorja Johnson, 4) Rachel Rohrabacher / Christian Alshon.",
      "Ben Johns is the only player among the top four seeds not playing in the MLP semifinals.",
      "Eric Oncins and Tina Pisnik are paired as the 7 seed, having made the Newport final earlier in the year.",
      "Round-of-64 barnburner: Catherine Parenteau / Riley Newman (10) vs. Sofia Sewing / Casey Diamond (64).",
      "Watch out for Hurricane Tyra Black and Gabe Tardio (5) — a dangerous, talented duo that will be tough to beat. They have not played together in the US in over two years, and finished third in Hanoi in April.",
      "Women's Doubles",
      "Top four seeds: 1) Bright / Waters, 2) Black / Johnson, 3) Rohrabacher / Todd, 4) Schneemann / Pisnik.",
      "Waters and Bright are undefeated in 2026.",
      "A new, dangerous team lands as the 5 seed: Sofia Sewing and Catherine Parenteau.",
      "Potential round of 16: Etta Tuionetoa / Meghan Dizon (7) vs. Kaitlyn Christian / Brooke Buckner (9).",
      "Watch out for Kate Fahey and Lea Jansen (6) — can they make a run to the semis or farther?",
      "Men's Doubles",
      "Top four seeds: 1) Johns / Tardio, 2) Alshon / Daescu, 3) Patriquin / Staksrud, 4) JW Johnson / Shimabukuro.",
      "Ben Johns and Gabe Tardio are undefeated in 2026.",
      "What's old is new again: Patriquin/Staksrud (3) and Alshon/Daescu (2) pair up again, both seeking their gold-medal-winning ways of 2025.",
      "Potential round of 16: Will Howells / CJ Klinger (5) vs. Roscoe Bellamy / Connor Garnett (9).",
      "Watch out for Tama Shimabukuro and JW Johnson (4) — what will Tama Time plus the Flickwizard produce? A fascinating new pairing that will be must-see TV.",
    ],
  },
  /**
   * ⚠ SPONSORED PARTNER ANNOUNCEMENT, not editorial — Six Zero's own signing
   * copy, supplied by Hannah Johns (PPA comms) on Aug 10 with a request to
   * publish the same day. Same class as Jeff Watson's press release below: it
   * is neither AI-written nor unreviewed, so the 7/20 approval gate (which
   * exists to stop AI copy going live) does not apply — it ships
   * `status: "published"`. Flagged to Dylan all the same.
   *
   * ⚠ IT IS SPONSORED CONTENT AND IS LABELLED AS SUCH, three ways: the
   * "Partner News" category, the "Six Zero" byline (the brand authored it), and
   * the closing disclosure line in `body`. Do not strip any of the three — a
   * sponsored announcement presented as tour reporting is the thing the label
   * prevents.
   *
   * ⚠ THE TWO QUOTES ARE REAL AND ATTRIBUTED (Cailyn Campbell; Dale Young,
   * Founder of Six Zero) — verbatim from the supplied release. Do not reword
   * them. The stats are the brand's own claim (three PPA bronze medals across
   * all three disciplines; Hard Eights MLP team; age 16); left as supplied.
   *
   * ⚠ NO "Official Paddle Partner" DESIGNATION IS CLAIMED. The disclosure says
   * "an official partner of the PPA Tour" only — Six Zero's Platinum status is
   * confirmed, but the exclusive paddle-partner label is contested (JOOLA /
   * Proton / Six Zero all carry it) and the live sponsors page designates none
   * of them. Don't upgrade the wording.
   *
   * Both Campbell siblings have profiles, so the "Players in This Story" rail
   * resolves them by name detection (they're in published-athletes.json). They
   * are NOT in the curated `lib/athletes.ts`, so the body linkifier does not
   * link them inline — the rail is the link surface here.
   */
  {
    slug: "cailyn-campbell-signs-with-six-zero",
    status: "published",
    category: "Partner News",
    title: "Six Zero Signs 16-Year-Old Rising Star Cailyn Campbell",
    date: "Aug 10",
    /* Cailyn at the kitchen line with the Coral Pro — the one paddle the story
       is about, and clearly in frame. Landscape 3:2 original (5585×3723)
       encoded to 2400×1600 (524KB, in line with the other heroes); the hero
       renders `sizes="100vw"`. Her head sits near the top of the frame, so the
       3.6:1 hero crop is anchored up to keep her face and the paddle. Supplied
       by Six Zero via Hannah; ArticleView renders the hero with alt="". */
    image: "/ppa/six-zero-cailyn-campbell.jpg",
    imagePosition: "50% 25%",
    /* Six Zero authored the announcement; the byline doubles as the sponsored
       disclosure. */
    author: "Six Zero",
    players: ["cailyn-campbell", "cason-campbell"],
    dek: "Six Zero has signed 16-year-old PPA Tour standout Cailyn Campbell — one of the sport's brightest rising young stars — with the Coral Pro paddle in her hand for both singles and doubles.",
    whyItMatters:
      "At 16, Campbell already owns three PPA bronze medals across all three disciplines and plays for the Hard Eights in MLP. Six Zero, an official PPA Tour partner, is investing in the next generation of the pro game.",
    body: [
      "Six Zero has welcomed Cailyn Campbell to its family of players. At just 16 years old, Campbell is already making a name for herself on the professional pickleball scene and has quickly become one of the brightest rising young stars in the sport.",
      "Before pickleball, she played competitive tennis. Everything changed when her older brother, Cason Campbell — who also competes on the PPA Tour — needed someone to practice with. What started as helping her brother quickly turned into a passion, and before long, a professional career.",
      "Today, Campbell competes on the PPA Tour and is a member of the Hard Eights MLP team. She has already earned three professional PPA bronze medals across women's singles, women's doubles, and mixed doubles, competing alongside and against some of the best players in the world.",
      "While her results speak for themselves, it was her attitude that stood out to the brand. Campbell plays with confidence, works hard, and is always looking for ways to improve — a mindset Six Zero says fits perfectly with what the company is all about.",
      "“I'm beyond excited to join the Six Zero family! I'm pretty paddle picky, so I never wanted to partner with a company unless I truly loved what I was playing with. The Coral Pro is the first paddle I've used that gives me everything I want for both singles and doubles. From the moment I connected with the Six Zero team, they've welcomed me with open arms and made me feel like family. I can't wait to represent this brand!”",
      "Finding the right paddle wasn't something Campbell took lightly, and Six Zero says the Coral Pro gives her the confidence she wants every time she steps on court. When she's not competing, you'll probably find her searching for the best matcha in whatever city she's visiting, fitting in another workout, or spending time with family and friends.",
      "“We're incredibly excited to have Cailyn join the Six Zero family,” said Dale Young, Founder of Six Zero. “What impressed us most wasn't just her results, it was her character. She's driven, humble, and loves the process of getting better. Those are the kinds of people we want representing Six Zero, and we're looking forward to supporting her as she continues to grow.”",
      "Six Zero says it's proud to be part of Campbell's journey and can't wait to see what the future holds. She's only getting started.",
      "This announcement is sponsored content supplied by Six Zero, an official partner of the PPA Tour.",
    ],
  },
  /**
   * ⚠ OFFICIAL PRESS RELEASE, not editorial — Jeff Watson's comms copy
   * (DALLAS, Aug 5 2026), supplied by Wesley. Both quotes are REAL and
   * attributed: Connor Pardoe (Founder/CEO) and Jeff Watson (SVP Marketing &
   * Comms). Do not reword them, and do not "correct" the figures — 50/35/15,
   * the trailing 52 weeks, the 14 best results and the top-eight Finals fields
   * are all from the release.
   *
   * ⚠ It ships `status: "published"` rather than "draft" — the 7/20 approval
   * gate exists to stop AI-WRITTEN copy going live unreviewed, and this is
   * neither AI-written nor unreviewed. Flagged to Dylan all the same.
   *
   * ⚠ ONE WORD IS NOT THE RELEASE'S. It reads "the sport's biggest Majors and
   * the Pickleball World Championships", which presents Worlds as a peer
   * category to the Majors — exactly the framing the 7/29 standing ruling had
   * us fix in the tier table, the TV label and the "Worlds, majors, cups,
   * opens" pattern. Rendered here as "Majors, including the Pickleball World
   * Championships", which keeps the release's meaning and the ruling intact.
   * If comms wants the original wording, that is their call — but then the
   * ruling needs revisiting, not just this string.
   *
   * The 50/35/15 weighting and the 52-week window ALREADY ship on
   * /about/how-it-works (8/4). ⚠ The "14 best results" figure is NEW and is
   * not on that page yet — worth adding there so the two agree.
   */
  {
    slug: "world-pickleball-rankings-be-the-best",
    status: "published",
    category: "Tour News",
    title: "Carvana PPA Tour Announces the World Pickleball Rankings",
    date: "Aug 5",
    dek: "A first-of-its-kind global ranking pulls every PPA Tour event in the world onto one leaderboard — and the Tour unveils a new rallying cry: BE THE BEST.",
    /**
     * Supplied by Wesley (8/5). Mixed doubles at the PPA Finals — the right
     * frame for this story, since the WPR is a composite and mixed is 35% of
     * it. Encoded with sharp from the 5276×3517 original to 2400×1600 (571KB,
     * in line with the other heroes); the hero renders at `sizes="100vw"`, so
     * it wants the width.
     *
     * ⚠ The source file names the players ("ALW X BEN"), but ArticleView
     * renders the hero with `alt=""` — decorative — so NO player claim is
     * published here. Don't add alt text naming them without checking the
     * frame against someone who can confirm it.
     */
    image: "/ppa/action-mxd-ppa-finals.jpg",
    /* Wesley, 8/5 — the centred hero crop cut both faces off. */
    imagePosition: "0 10%",
    /* Wesley, 8/5. He is the release's author and its media contact, so the
       byline is accurate rather than decorative. */
    author: "Jeff Watson",
    whyItMatters:
      "One number, one global standard. The World Pickleball Rankings decide event entries, byes for the top players and teams, and who fills the eight-player fields at the season-ending PPA Finals.",
    body: [
      "DALLAS — The Carvana PPA Tour today announced the launch of the World Pickleball Rankings, a first-of-its-kind system designed to identify the best overall professional pickleball players on the planet. Debuting with the 2026–2027 season, the World Pickleball Rankings brings every Professional Pickleball Association event around the world under one unified, global leaderboard — giving players, fans, and media a single, definitive answer to the question: who is the best pickleball player in the world?",
      "Unlike traditional rankings built around a single discipline, the World Pickleball Rankings is a composite measure of a player's performance across all three: gender doubles, mixed doubles, and singles. Results are weighted to reflect the modern professional game — gender doubles at 50%, mixed doubles at 35%, and singles at 15% — and are drawn from each player's 14 best results over the trailing 52 weeks. The system rewards complete players: the ones who show up and compete everywhere, in every format.",
      "At the heart of the ranking is a globally unified point system. Every PPA event, from PPA Challengers to international stops to the sport's biggest Majors, including the Pickleball World Championships, feeds into the same leaderboard, with points scaled to the size of each event. No matter where in the world a player competes, their results count toward the same ranking. One tour, one point system, one path to the top.",
      "The World Pickleball Rankings will also shape the competitive season itself, informing event entries, byes for the top-ranked players and teams, and qualification for the season-ending PPA Finals, where the top eight men and top eight women compete across all three disciplines to be crowned PPA Finals Champion.",
      "“Greatness isn't one-dimensional. The World Pickleball Rankings is about clarity and credibility — one number and one global standard, that tells the story of who the best players in the world truly are,” said Connor Pardoe, Founder and CEO of the Carvana PPA Tour. “As pickleball grows into a truly global sport, our athletes deserve a ranking that matches that ambition and rewards greatness across every discipline, everywhere they play.”",
      "Alongside the new ranking, the Carvana PPA Tour is unveiling BE THE BEST., a new rallying cry for the PPA Tour and its community. The Tour showcases elite athletes with unique personalities within the greatest community in sports on an unrivaled global stage, and BE THE BEST. was developed to capture that identity in a single, unifying idea — one that speaks to world-class professionals and to the millions of amateurs around the world who love the game alike. The message was built to be inclusive and aspirational rather than presumptuous: everyone, at every level, has their own best to chase. It will come to life across the Carvana PPA Tour experience, appearing on-site at PPA events through both professional and amateur touchpoints, and extending into the Tour's marketing and merchandise.",
      "“BE THE BEST. is more than a tagline, it's an invitation,” said Jeff Watson, SVP, Marketing and Communications, Carvana PPA Tour. “Whether you're competing for a world title or stepping onto a court for the first time, the challenge is the same: be your best. Paired with the World Pickleball Rankings, it gives every player in our community something to strive for.”",
      "The full mechanics of the World Pickleball Rankings — the weighting, the 52-week window, and how Current Seed differs from your world rank — are laid out on How Pro Pickleball Works.",
    ],
  },
  /**
   * ⚠ OFFICIAL PRESS RELEASE, not editorial — comms copy dated Cary, NC,
   * Aug 24 2026, supplied by Wesley as a Google Doc. Jeff Watson is its named
   * media contact, so the byline is accurate rather than decorative. Ships
   * `status: "published"` for the same reason the WPR release above does: the
   * 7/20 gate exists to stop AI-WRITTEN copy going live, and this is neither
   * AI-written nor unreviewed.
   *
   * ⚠ EVERY CREDENTIAL HERE IS THE RELEASE'S, AND SEVERAL ARE CHECKABLE FACTS
   * ABOUT REAL PEOPLE — three Cups and the 2014 Conn Smythe for Williams, the
   * 2006 Cup and Conn Smythe for Ward, 2026 Cups for Aho and Svechnikov. Don't
   * "tidy" them; if one is wrong it is a correction to make with comms, not a
   * wording call.
   *
   * ⚠ THE BULLETS AND HYPERLINKS OF THE ORIGINAL ARE GONE, BECAUSE A NATIVE
   * BODY CANNOT CARRY THEM. `ArticleView` renders `body` as plain paragraphs
   * through `linkifyPlayers` — no lists, no anchors. The What/Who/When/Where
   * structure is therefore flattened to prose and the release's four inline
   * links are dropped. The ticket link is the one that actually matters, and
   * it survives as `ctaUrl` below rather than as body text.
   *
   * ⚠ THE PPA FIELD IS DELIBERATELY UNNAMED. The release says "Top Carvana PPA
   * Tour players to be named later", so this post names no pro. Add them when
   * comms does — and only then.
   *
   * No `players` rail: the four names are NHL players, not PPA pros, and none
   * collides with an athlete on our roster (checked against
   * published-athletes.json). Nothing here should link to a player profile.
   *
   * ⚠ CAM WARD IS OUT AND JALEN CHATFIELD IS IN (9/2, via the event team —
   * Delaney reissued both graphics). Ward's line in the body carried the 2006
   * Cup and that season's Conn Smythe, which are his alone, so it was replaced
   * rather than renamed. Three surfaces carry this night and ALL THREE had to
   * move together: this article, the homepage promo modal
   * (`lib/site-promo.ts`, which points at the SQUARE cut of the same art) and
   * the Nationals event page's spotlight block — the last one reads its
   * headline, blurb and thumbnail straight back out of this entry, so it
   * followed for free. There is no fourth copy of the roster.
   */
  {
    slug: "canes-and-the-cup-pro-am",
    status: "published",
    category: "Tour News",
    /* Comms' single headline, split at its semicolon (Wesley, 8/24): the hook
       is the H1, the logistics are the standfirst. Both halves are verbatim —
       no words added, none dropped. */
    title: "Canes and the Cup Pro-Am at the Veolia Pickleball National Championships",
    subtitle: "Thursday, Sept. 3, 6-9 p.m. at Cary Tennis Park",
    date: "Aug 24",
    /* The event's own key art, supplied with the release (1920×1080 PNG) and
       encoded to mozjpeg q80 at native size — 315KB, in line with the other
       heroes. NOT upscaled to the 2400px the other two use: the source is 1920
       wide and enlarging it adds bytes, not detail.

       ⚠ THE FILENAME CARRIES A VERSION, AND IT IS NOT COSMETIC. The
       first pass overwrote the original file in place; the URL never changed,
       so the optimizer served the CACHED first-cut bytes and the modal kept
       publishing Cam Ward — reproduced locally with the new file on disk. The
       optimized variant is cached against the URL, so a same-name replacement
       can keep serving the superseded roster for as long as the TTL holds. A
       new name is a new cache key. Version it again on the next reissue.

       ⚠ THIS IS A DESIGNED GRAPHIC, NOT A PHOTOGRAPH, AND THE HERO CROPS IT.
       The hero is `min-h-[44svh]` at `sizes="100vw"`, roughly 3.6:1, so it
       keeps about half the height of a 16:9 image — the anchor below is
       measured to hold the CANES / & THE CUP / PICKLEBALL PRO-AM lockup. The
       Stanley Cup Champions and Carvana PPA Tour marks along the foot fall
       outside that band at desktop widths and cannot be saved by an anchor;
       a purpose-built wide crop is the only fix if they must appear. */
    image: "/ppa/canes-and-the-cup-pro-am-v2.jpg",
    // Designed key art (Canes / Stanley Cup / Carvana PPA Tour lockup), not a
    // photo — show it whole with the headline below, so the two don't overlap.
    // `imagePosition` no longer applies in the graphic layout; kept harmless.
    imagePosition: "50% 100%",
    heroGraphic: true,
    author: "Jeff Watson",
    /* The release's own ticket link, cleaned of its pre-baked UTMs — it
       arrived tagged `utm_content=event-hero-buy-tickets`, which would have
       reported every click from this article as an event-page hero click. */
    ctaUrl:
      "https://www.tixr.com/groups/ppa/events/canes-night-at-the-veolia-pickleball-national-championships-202083",
    ctaLabel: "Get Canes Night Tickets",
    eventSlug: "veolia-pickleball-national-championships",
    dek: "Stanley Cup champions Andrei Svechnikov, Jalen Chatfield, Sebastian Aho and Justin Williams take Humana Championship Court alongside top Carvana PPA Tour pros — with the Stanley Cup on site for photos.",
    whyItMatters:
      "Four Stanley Cup champions and the Cup itself land in the middle of the tour's biggest week, on the same court the pros play on. A portion of proceeds goes to the Carolina Hurricanes Foundation.",
    body: [
      "CARY, N.C. — The Carolina Hurricanes and the Veolia Pickleball National Championships today announced the Canes and the Cup Pro-Am, a fun, lively and entertaining event pairing Carolina Hurricanes Stanley Cup champions with top players from the Carvana PPA Tour. Fans will have the opportunity for exclusive player meet-and-greets and a chance to have their photo taken with the Stanley Cup.",
      "Four Hurricanes champions headline the field. Justin “Mr. Game 7” Williams is a three-time Stanley Cup champion and winner of the 2014 Conn Smythe Trophy. Sebastian Aho, a 2026 Stanley Cup champion, is a three-time NHL All-Star. Andrei Svechnikov, also a 2026 champion, was a 2023 NHL All-Star, and defenseman Jalen Chatfield is a 2026 champion as well. The top Carvana PPA Tour players joining them will be named later.",
      "The Pro-Am runs Thursday, Sept. 3 from 6-9 p.m. ET and is built in three parts. From 6-7 p.m., a Stormy meet-and-greet, photos with the Stanley Cup and Carolina Hurricanes activations open for courtside ticket holders at Courtside Commons. The Canes and the Cup Pro-Am itself takes Humana Championship Court from 7-8 p.m. From 8-9 p.m., VIP ticket holders mix and mingle with the Canes legends and the Stanley Cup.",
      "Everything takes place at Humana Championship Court and Courtside Commons at the Veolia Pickleball National Championships, held at Cary Tennis Park, 2727 Louis Stephens Dr., Cary, NC 27519.",
      "VIP tickets carry the player meet-and-greet opportunities, reserved priority seating, food and beverage, and priority access to photos with the Stanley Cup. They are expected to sell out quickly, and fans are encouraged to purchase today. A portion of proceeds goes to the Carolina Hurricanes Foundation.",
      "Media covering the event can apply for credentials through the Carvana PPA Tour's media credential application. Further tournament information and details regarding the Veolia Pickleball National Championships will be coming soon.",
    ],
  },
];

/**
 * Approved articles only — the ONLY list any page should render from.
 * Drafts (pending Dylan's approval) are invisible everywhere.
 */
export const publishedArticles: NewsArticle[] = newsArticles.filter(
  (a) => a.status === "published",
);

/** A single approved article; drafts resolve to undefined (→ 404). */
export function getArticle(slug: string): NewsArticle | undefined {
  return publishedArticles.find((a) => a.slug === slug);
}

/** Approved coverage attached to a tour stop — the event's editorial history. */
export function getArticlesForEvent(eventSlug: string): NewsArticle[] {
  return publishedArticles.filter((a) => a.eventSlug === eventSlug);
}
