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
   * Byline override. Unset falls back to the "PPA Tour" house byline, which is
   * right for anything the newsroom writes itself — set this only when a named
   * person actually authored the piece (e.g. comms issuing a press release).
   */
  author?: string;
  whyItMatters: string;
  /** Ties coverage to a tour stop — event pages render these under "Coverage". */
  eventSlug?: string;
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
