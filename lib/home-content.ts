/**
 * Editorial content for the ESPN-style homepage — the points race, players to
 * watch, and new-fan explainers. Placeholder copy for the demo build; replace
 * with the Sanity CMS + scoring/rankings API.
 *
 * `leadStory` / `storylines` / the `Storyline` type lived here until 7/31.
 * They were invented headlines that every card linked to /watch with, and the
 * homepage newsroom grid now renders real posts from `lib/news.ts` instead.
 */

import { publishedArticles } from "@/lib/news-articles";

export type RaceEntry = {
  rank: number;
  /** Athlete slug — resolves to name + headshot + profile via lib/athletes. */
  slug: string;
  points: number;
  /** Positions moved since the last stop. + up, - down, 0 steady. */
  move: number;
};

export type DivisionKey = "ms" | "md" | "mxd" | "ws" | "wd" | "wxd";

export type Division = {
  key: DivisionKey;
  /** Full label, shown under names. */
  label: string;
  /** Tab label. */
  short: string;
  entries: RaceEntry[];
};

/* Per-division points race — real pros (slugs map to lib/athletes). Order
   mirrors ppatour.com's leaderboards selector. */
export const divisionRankings: Division[] = [
  {
    key: "ms",
    label: "Men's Singles",
    short: "Men's Singles",
    entries: [
      { rank: 1, slug: "ben-johns", points: 9840, move: 0 },
      { rank: 2, slug: "federico-staksrud", points: 8990, move: 1 },
      { rank: 3, slug: "christian-alshon", points: 8210, move: 2 },
      { rank: 4, slug: "gabe-tardio", points: 7620, move: 1 },
      { rank: 5, slug: "hayden-patriquin", points: 6980, move: -1 },
      { rank: 6, slug: "jw-johnson", points: 6540, move: 0 },
      { rank: 7, slug: "jay-devilliers", points: 6080, move: 2 },
      { rank: 8, slug: "dekel-bar", points: 5720, move: -1 },
    ],
  },
  {
    key: "md",
    label: "Men's Doubles",
    short: "Men's Doubles",
    entries: [
      { rank: 1, slug: "ben-johns", points: 9510, move: 0 },
      { rank: 2, slug: "gabe-tardio", points: 9120, move: 1 },
      { rank: 3, slug: "riley-newman", points: 8240, move: -1 },
      { rank: 4, slug: "collin-johns", points: 7860, move: 0 },
      { rank: 5, slug: "jw-johnson", points: 7410, move: 2 },
      { rank: 6, slug: "dylan-frazier", points: 7050, move: 1 },
      { rank: 7, slug: "hunter-johnson", points: 6620, move: -2 },
      { rank: 8, slug: "andrei-daescu", points: 6210, move: 0 },
    ],
  },
  {
    key: "mxd",
    label: "Mixed Doubles",
    short: "Men's Mixed",
    entries: [
      { rank: 1, slug: "ben-johns", points: 8580, move: 0 },
      { rank: 2, slug: "jw-johnson", points: 8210, move: 1 },
      { rank: 3, slug: "dylan-frazier", points: 7780, move: 2 },
      { rank: 4, slug: "riley-newman", points: 7220, move: -1 },
      { rank: 5, slug: "hunter-johnson", points: 6680, move: 1 },
      { rank: 6, slug: "gabe-tardio", points: 6320, move: 0 },
      { rank: 7, slug: "andrei-daescu", points: 5980, move: 1 },
      { rank: 8, slug: "jack-sock", points: 5610, move: 3 },
    ],
  },
  {
    key: "ws",
    label: "Women's Singles",
    short: "Women's Singles",
    entries: [
      { rank: 1, slug: "anna-leigh-waters", points: 9920, move: 0 },
      { rank: 2, slug: "anna-bright", points: 8640, move: 1 },
      { rank: 3, slug: "tyra-black", points: 8010, move: 2 },
      { rank: 4, slug: "kate-fahey", points: 7320, move: 1 },
      { rank: 5, slug: "lea-jansen", points: 6740, move: -1 },
      { rank: 6, slug: "catherine-parenteau", points: 6380, move: 0 },
      { rank: 7, slug: "genie-erokhina", points: 6020, move: 3 },
      { rank: 8, slug: "judit-castillo", points: 5680, move: 1 },
    ],
  },
  {
    key: "wd",
    label: "Women's Doubles",
    short: "Women's Doubles",
    entries: [
      { rank: 1, slug: "anna-leigh-waters", points: 9780, move: 0 },
      { rank: 2, slug: "anna-bright", points: 8820, move: 1 },
      { rank: 3, slug: "catherine-parenteau", points: 8210, move: -1 },
      { rank: 4, slug: "jessie-irvine", points: 7610, move: 1 },
      { rank: 5, slug: "paris-todd", points: 7020, move: 2 },
      { rank: 6, slug: "jorja-johnson", points: 6680, move: 0 },
      { rank: 7, slug: "kaitlyn-christian", points: 6240, move: 2 },
      { rank: 8, slug: "rachel-rohrabacher", points: 5910, move: -1 },
    ],
  },
  {
    key: "wxd",
    label: "Mixed Doubles",
    short: "Women's Mixed",
    entries: [
      { rank: 1, slug: "anna-leigh-waters", points: 9240, move: 0 },
      { rank: 2, slug: "anna-bright", points: 8490, move: 1 },
      { rank: 3, slug: "jessie-irvine", points: 7650, move: 2 },
      { rank: 4, slug: "paris-todd", points: 7100, move: 1 },
      { rank: 5, slug: "catherine-parenteau", points: 6520, move: -1 },
      { rank: 6, slug: "kaitlyn-christian", points: 6180, move: 1 },
      { rank: 7, slug: "rachel-rohrabacher", points: 5840, move: 0 },
      { rank: 8, slug: "megan-dizon", points: 5510, move: 2 },
    ],
  },
];

export type PlayerWatch = {
  slug: string;
  image: string;
  name: string;
  division: string;
  rank: number;
  hook: string;
};

export const playersToWatch: PlayerWatch[] = [
  {
    slug: "anna-leigh-waters",
    image: "/ppa/pros/anna-leigh-waters.jpg",
    name: "Anna Leigh Waters",
    division: "Women's · No. 1",
    rank: 1,
    hook: "The world No. 1 arrives chasing another triple crown — singles, doubles, and mixed in one weekend.",
  },
  {
    slug: "ben-johns",
    image: "/ppa/pros/ben-johns.jpg",
    name: "Ben Johns",
    division: "Men's Singles · No. 1",
    rank: 1,
    hook: "The most dominant player in the sport's history, still the one to beat in every discipline.",
  },
  {
    slug: "gabe-tardio",
    image: "/ppa/pros/gabe-tardio.jpg",
    name: "Gabriel Tardio",
    division: "Men's Doubles · No. 2",
    rank: 2,
    hook: "The young star already winning majors alongside the game's best — and climbing fast in singles.",
  },
];

export type Explainer = {
  q: string;
  a: string;
};

export const explainers: Explainer[] = [
  {
    q: "What is the PPA Tour?",
    a: "The top professional pickleball circuit — 20 stops a year, the best players in the world, all chasing one points race.",
  },
  {
    q: "How do ranking points work?",
    a: "Every result moves a player up or down. Tour stops are worth 1,000+ points; the majors pay double.",
  },
  {
    q: "Why does this matter now?",
    a: "Pickleball is the fastest-growing sport in America — sold-out arenas, national TV windows, and real prize money.",
  },
  {
    q: "New here — where do I start?",
    a: "Pick a stop, watch a Championship Sunday, and follow one player. The race takes care of the rest.",
  },
];

/**
 * Partner tiers, in billing order.
 *
 * SOURCE OF TRUTH: ppatour.com/sponsors — Platinum, Gold, Silver, Tour Sponsors.
 * Reconciled against it on 8/3 (Wesley pointed at the live page).
 *
 * ⚠ Do NOT re-derive these from the brand-asset zips. That's how this was first
 * built and it was wrong in four ways: there is no Silver folder at all, and the
 * folders filed Pickleball Central, Tixr and PlaySight under tiers the live page
 * contradicts. The zips are the authority on ARTWORK, the live page on TIER.
 *
 * `official` remains the fallback for a designated partner whose tier we can't
 * confirm. Currently EMPTY — `partnersByTier()` drops empty groups, so it
 * renders no heading. Kept for the next partner who turns up without a tier,
 * so nobody has to be dropped from the wall to be listed.
 */
export type PartnerTier =
  | "title"
  | "platinum"
  | "gold"
  | "silver"
  | "tour"
  | "official";

/** Non-title tiers in the order they're billed, with their wall headings. */
export const PARTNER_TIERS: { key: PartnerTier; label: string }[] = [
  { key: "platinum", label: "Platinum Sponsors" },
  { key: "gold", label: "Gold Sponsors" },
  { key: "silver", label: "Silver Sponsors" },
  { key: "tour", label: "Tour Sponsors" },
  { key: "official", label: "Official Partners" },
];

export type Partner = {
  name: string;
  /**
   * Public-facing designation — "Official {X} of the PPA Tour".
   *
   * ⚠ Optional, and the absence is meaningful. The nine partners added from the
   * 8/3 logo drop arrived as artwork only, with no designation attached. The
   * designation is the thing we SELL ("the designation IS the value", 7/21), so
   * inventing one would be putting words in a sponsor's mouth on their own
   * card. They render logo-only until marketing confirms each one.
   */
  role?: string;
  /** Exclusive category the partner owns (from the exclusivity roster). */
  category?: string;
  note?: string;
  tier: PartnerTier;
  /** Partner's own site — clicking their logo/card forwards here (Connor, 7/23).
      Only set where we're confident of the destination; unset = no outbound
      link (card stays put) so we never send a fan to a wrong/dead page. */
  website?: string;
  /**
   * The exact leading string this partner's name takes in an EVENT title, when
   * they title a stop — "Veolia Chicago Cup", "Rate Las Vegas Open".
   *
   * ⚠ Curated on purpose. `EventSponsors` used to infer this by testing whether
   * an event name began with the partner's first word, which was fine while the
   * roster was small and became wrong the moment Pickleball Central joined:
   * "Pickleball World Championships" starts with "Pickleball", so Worlds
   * credited a title partner who doesn't sponsor it. Matching the full name
   * doesn't work either — the Daytona event reads "Proton" while the partner is
   * "Proton Sports". So it's data, not a heuristic: unset means this partner
   * never titles an event, and nothing can be inferred about them.
   */
  eventNamePrefix?: string;
  /** Suppress the designation line and let the logo stand alone (Bryce, 7/28 —
      "we do not need to type out the partner names next to their logos when
      the logo itself makes it obvious"). Set where the written designation
      added nothing: Veolia and Humana. The partner name is never printed
      beside a logo anywhere; this hides the ROLE line too. */
  hideRole?: boolean;
  /** Real wordmark logo path + intrinsic pixel dimensions (when we have the
      brand-kit file). Partners without a mark yet render as designation cards
      until their logo lands. */
  logo?: string;
  logoWidth?: number;
  logoHeight?: number;
};

/* The official partner family — every current designated partner of the PPA
   Tour. Each owns a category ("Official {X} of the PPA Tour"), which is what
   confers the value.

   LOGOS + TIERS come from marketing's brand-asset drop of 8/3 (three zips:
   Platinum Partner Logos / Gold Partner Logos / Tour Sponsors), imported and
   optimized by `scripts/import-sponsor-logos.mjs` — re-run that when partners
   refresh their art rather than hand-placing files. Every file is trimmed of
   dead margin and capped at 900px so the cards size optically; logoWidth /
   logoHeight below are the SHIPPED dimensions, not the source art's.

   The drop also resolved the long-standing "10 partners with no mark" gap. Two
   of those marks are the parent brand rather than the sponsoring brand — see
   Fasenra and Acrytech, both flagged inline. */
export const partners: Partner[] = [
  {
    name: "Carvana",
    website: "https://www.carvana.com",
    eventNamePrefix: "Carvana",
    role: "Title Partner",
    category: "Auto Retailer",
    note: "The named partner of the tour — on every court, every broadcast, all twenty stops.",
    tier: "title",
    logo: "/ppa/sponsors/carvana.png",
    logoWidth: 900,
    logoHeight: 197,
  },

  /* ---- Platinum ---- */
  {
    name: "Veolia",
    website: "https://www.veolianorthamerica.com",
    eventNamePrefix: "Veolia",
    role: "Official Sustainability Partner",
    category: "Sustainability",
    note: "Backing the marquee stops in Atlanta, Chicago, and the National Championships.",
    tier: "platinum",
    hideRole: true,
    logo: "/ppa/sponsors/veolia.png",
    logoWidth: 900,
    logoHeight: 222,
  },
  {
    name: "JOOLA",
    website: "https://www.joola.com",
    role: "Official Paddle Partner",
    category: "Paddle",
    note: "Presenting partner of the PPA Finals and the gear behind a generation of pros.",
    tier: "platinum",
    logo: "/ppa/sponsors/joola.png",
    logoWidth: 900,
    logoHeight: 284,
  },
  {
    name: "Humana",
    website: "https://www.humana.com",
    role: "Official Human Care Partner",
    category: "Insurance",
    note: "Keeping players and fans moving, on the court and off it.",
    tier: "platinum",
    hideRole: true,
    logo: "/ppa/sponsors/humana.webp",
    logoWidth: 900,
    logoHeight: 176,
  },
  {
    name: "Ensure Max Protein",
    website: "https://www.ensure.com",
    role: "Official Nutrition Partner",
    category: "Nutritional Beverage",
    note: "Fueling the longest weekends on tour.",
    tier: "platinum",
    logo: "/ppa/sponsors/ensure.png",
    logoWidth: 900,
    logoHeight: 586,
  },
  {
    name: "Proton Sports",
    // Verified 7/28 (Conner Ogden: sponsor tiles were bouncing to a PPA page
    // instead of the sponsor).
    website: "https://protonsports.com",
    // The Daytona stop is branded "Proton", not "Proton Sports".
    eventNamePrefix: "Proton",
    role: "Official Paddle Partner",
    category: "Paddle",
    note: "Engineering the paddles behind the tour's hardest hitters.",
    tier: "platinum",
    logo: "/ppa/sponsors/proton.webp",
    logoWidth: 900,
    logoHeight: 198,
  },
  {
    name: "Six Zero",
    website: "https://sixzeropickleball.com",
    role: "Official Paddle Partner",
    category: "Paddle",
    note: "Performance gear built for the demands of the pro game.",
    tier: "platinum",
    // Kept from the earlier import: the 8/3 drop shipped the identical 320x126
    // file, so re-importing would have gained nothing. This is the one mark
    // we hold below display resolution — worth asking for a bigger one.
    logo: "/ppa/sponsors/six-zero.jpg",
    logoWidth: 320,
    logoHeight: 126,
  },
  {
    name: "Reign Storm",
    website: "https://www.reignstorm.com/en-us/",
    role: "Official Energy Drink Partner",
    category: "Energy Drink",
    note: "Fuel for the fans and the grind of a tour weekend.",
    tier: "platinum",
    logo: "/ppa/sponsors/reign-storm.png",
    logoWidth: 900,
    logoHeight: 243,
  },
  {
    name: "Zimmer Biomet",
    website: "https://www.zimmerbiomet.com/en",
    role: "Official MedTech and Joint Replacement Partner",
    category: "MedTech / Joint Replacement",
    tier: "platinum",
    logo: "/ppa/sponsors/zimmer-biomet.png",
    logoWidth: 470,
    logoHeight: 238,
  },

  /* ---- Gold ---- */
  {
    name: "Rate",
    website: "https://www.rate.com",
    eventNamePrefix: "Rate",
    role: "Official Mortgage Partner",
    category: "Mortgage",
    note: "Title partner of the Rate Las Vegas Open.",
    tier: "gold",
    logo: "/ppa/sponsors/rate.webp",
    logoWidth: 900,
    logoHeight: 366,
  },
  {
    name: "Fasenra",
    // ⚠ ppatour.com/sponsors links this partner to astrazeneca.com, not here.
    // Kept on fasenra.com because that matches the name we display; switch if
    // the record is renamed to AstraZeneca (see the logo note below).
    website: "https://www.fasenra.com",
    role: "Official Asthma Partner",
    category: "Medicinal",
    note: "The tour's exclusive asthma partner.",
    tier: "gold",
    /**
     * ⚠ This is the ASTRAZENECA corporate mark, not a Fasenra mark — that is
     * the only art in the Gold folder for this partner (Fasenra is one of their
     * drugs). Wesley's call, 8/3: keep the partner as Fasenra and use the logo
     * we have. It reads coherently because PartnerWall prints the designation
     * and NOT the name wherever a logo exists, so the card shows the
     * AstraZeneca mark over "Official Asthma Partner".
     *
     * Two things to watch: Fasenra presents the National Championships, so that
     * presenting credit still says Fasenra in copy while the mark beside it says
     * AstraZeneca; and at 575px this is the lowest-resolution file we hold.
     * Both resolve by getting the Fasenra mark.
     */
    logo: "/ppa/sponsors/astrazeneca.png",
    logoWidth: 575,
    logoHeight: 139,
  },
  {
    name: "Holland America Line",
    website: "https://www.hollandamerica.com",
    role: "Official Cruise Line",
    category: "Cruise / Hospitality",
    note: "The exclusive cruise line of the PPA Tour.",
    tier: "gold",
    // Vertical lockup — the only art supplied. Tall marks are capped by height
    // in the cards so it can't tower over the horizontal wordmarks beside it.
    logo: "/ppa/sponsors/holland-america.png",
    logoWidth: 900,
    logoHeight: 570,
  },
  {
    name: "Joma",
    website: "https://www.joma-sport.com",
    role: "Official Footwear Partner",
    category: "Footwear",
    note: "On-court footwear for the pro game.",
    tier: "gold",
    logo: "/ppa/sponsors/joma.png",
    logoWidth: 900,
    logoHeight: 179,
  },
  {
    name: "Park Place Technologies",
    website: "https://www.parkplacetechnologies.com",
    role: "Official Technology Partner",
    category: "Technology",
    note: "Powering the tour's infrastructure.",
    tier: "gold",
    // Stacked lockup, as supplied.
    logo: "/ppa/sponsors/park-place.png",
    logoWidth: 900,
    logoHeight: 520,
  },
  {
    name: "Acrytech",
    // Acry-Tech Coatings — verified 7/28 (Conner Ogden).
    // ⚠ ppatour.com/sponsors calls this partner "Tennis Paint" and links to
    // tennispaint.com. Likely the same company under a different brand; kept on
    // acrytech.com because a human on our side verified it and it matches the
    // name we display. Resolve alongside the name/logo question below.
    website: "https://www.acrytech.com",
    role: "Official Court Surface Partner",
    category: "Court Surface",
    note: "The surface underfoot at PPA Tour stops.",
    tier: "gold",
    // ⚠ The supplied art reads "AT SPORTS — High Performance Sports Surfaces",
    // not Acrytech. Wesley's call, 8/3: keep the partner name as Acrytech. Same
    // situation as Fasenra above — the card shows the mark over the
    // designation, never the typed name, so it doesn't contradict itself.
    logo: "/ppa/sponsors/at-sports.webp",
    logoWidth: 900,
    logoHeight: 655,
  },

  {
    name: "PickleballTV",
    website: "https://pickleballtv.com/",
    role: "Official Broadcast Partner",
    category: "Broadcast / Streaming",
    note: "Every court, every match — the tour's streaming home.",
    tier: "gold",
    logo: "/ppa/sponsors/pbtv.webp",
    logoWidth: 701,
    logoHeight: 900,
  },
  {
    name: "Pickleball Central",
    // URL already verified in this codebase (the header Shop link and every
    // athlete gear CTA point here).
    website: "https://www.pickleballcentral.com",
    role: "Official Store",
    category: "Retail",
    tier: "gold",
    logo: "/ppa/sponsors/pickleball-central.png",
    logoWidth: 900,
    logoHeight: 102,
  },
  {
    name: "Pickleball Tournaments",
    // The registration platform the site already links every amateur CTA to.
    website: "https://www.pickleballtournaments.com",
    role: "Official Software",
    category: "Tournament Software",
    tier: "gold",
    logo: "/ppa/sponsors/pickleball-tournaments.png",
    logoWidth: 900,
    logoHeight: 241,
  },
  {
    name: "Just Courts Design + Build",
    website: "https://justcourts.com/",
    // ⚠ Listed on the live sponsors page with no designation printed, so this
    // card is intentionally logo-only.
    tier: "gold",
    logo: "/ppa/sponsors/just-courts.png",
    logoWidth: 900,
    logoHeight: 520,
  },

  /* ---- Silver ---- */
  {
    name: "Tixr",
    website: "https://www.tixr.com",
    role: "Official Ticketing Partner",
    category: "Ticketing",
    note: "How fans get into every PPA Tour event.",
    tier: "silver",
    logo: "/ppa/sponsors/tixr.png",
    logoWidth: 900,
    logoHeight: 186,
  },
  {
    name: "PlaySight",
    website: "https://playsight.com/",
    role: "Official AI Technology",
    category: "AI Technology",
    tier: "silver",
    logo: "/ppa/sponsors/playsight.png",
    logoWidth: 900,
    logoHeight: 200,
  },
  {
    name: "Hertz",
    website: "https://www.hertz.com/rentacar/reservation/",
    role: "Official Rental Car",
    category: "Rental Car",
    tier: "silver",
    logo: "/ppa/sponsors/hertz.webp",
    logoWidth: 381,
    logoHeight: 136,
  },

  /* ---- Tour Sponsors ---- */
  {
    /**
     * Life Time / LT Pro 48 — ONE partner, not two.
     *
     * The first pass had them as separate records in separate tiers: "LT Pro 48"
     * (Tour, Official Ball) from the Tour Sponsors folder, and "Life Time"
     * (Platinum) because the LIFE TIME wordmark sat in the Platinum folder. The
     * live page lists a single "Lifetime — Official Ball" under Tour Sponsors,
     * and LT stands for Life Time: the ball is their product.
     *
     * ⚠ Which mark to show is still open. Using the LT PRO48 ball mark because
     * the designation is Official Ball; `life-time.webp` is still on disk, so
     * switching to the parent wordmark is a one-line change.
     */
    name: "LT Pro 48",
    website: "https://shop.lifetime.life/lt-pro-48-pickleball",
    role: "Official Ball",
    category: "Ball",
    note: "The official ball of PPA Tour play.",
    tier: "tour",
    logo: "/ppa/sponsors/lt-pro48.png",
    logoWidth: 900,
    logoHeight: 168,
  },
  {
    name: "DUPR",
    website: "https://www.dupr.com/",
    // Already referenced across the site as the rating shown on athlete
    // profiles, but not listed as a sponsor until 8/3.
    role: "Official Rating",
    category: "Rating System",
    tier: "tour",
    logo: "/ppa/sponsors/dupr.webp",
    logoWidth: 900,
    logoHeight: 280,
  },
  {
    name: "Black Clover",
    website: "https://blackcloverusa.com/",
    role: "Official Apparel",
    category: "Apparel",
    tier: "tour",
    logo: "/ppa/sponsors/black-clover.png",
    logoWidth: 900,
    logoHeight: 367,
  },
  {
    name: "Engine",
    website: "https://engine.com/partner/ppa",
    role: "Official Travel Partner",
    category: "Travel",
    tier: "tour",
    logo: "/ppa/sponsors/engine.png",
    logoWidth: 900,
    logoHeight: 310,
  },
  {
    name: "Mineragua",
    website: "https://mineragua.com/",
    role: "Official Sparkling Water",
    category: "Sparkling Water",
    tier: "tour",
    logo: "/ppa/sponsors/mineragua.png",
    logoWidth: 900,
    logoHeight: 428,
  },
  {
    name: "O2 Sports Insurance",
    website: "https://www.o2sportsinsurance.com/programs/pickleball-insurance/",
    role: "Official Sports Insurance",
    category: "Sports Insurance",
    tier: "tour",
    logo: "/ppa/sponsors/o2-sports-insurance.png",
    logoWidth: 900,
    logoHeight: 212,
  },
  {
    name: "Picklebalm",
    website: "https://picklebalm.com/",
    role: "Official Topical Pain Reliever",
    category: "Topical Pain Reliever",
    tier: "tour",
    logo: "/ppa/sponsors/picklebalm.png",
    logoWidth: 418,
    logoHeight: 94,
  },

  /**
   * ⚠ SELKIRK REMOVED, 8/3 (Wesley: "Remove selkirk for now").
   *
   * They were on our exclusivity roster as Official Net Partner, but appear
   * NOWHERE on ppatour.com/sponsors — not Platinum, Gold, Silver or Tour — and
   * no mark came in the brand-asset drop. Absent from both sources is what a
   * lapsed designation looks like, and "for now" is the operative phrase: if the
   * deal is live, re-add them with a tier and a logo. The old record was
   * `role: "Official Net Partner"`, `category: "Net"`,
   * `website: "https://www.selkirk.com"`.
   *
   * This leaves the `official` fallback tier empty, which is fine —
   * `partnersByTier()` drops empty groups, so no heading renders.
   */
];

/** The title partner (Carvana) — top billing, rendered apart from the tiers. */
export const titlePartner = partners.find((p) => p.tier === "title");

/**
 * Partners grouped by billing tier in `PARTNER_TIERS` order, title partner
 * excluded, empty tiers dropped.
 *
 * Every surface that lists partners reads this rather than filtering `partners`
 * itself — before tiers existed the filters were `tier === "official"`, which
 * silently became "Selkirk only" the moment real tiers landed. One ordering,
 * one place to change it.
 */
export function partnersByTier(): {
  key: PartnerTier;
  label: string;
  items: Partner[];
}[] {
  return PARTNER_TIERS.map((t) => ({
    ...t,
    items: partners.filter((p) => p.tier === t.key),
  })).filter((g) => g.items.length > 0);
}

/**
 * Every partner we hold a mark for, in billing order — for the logo strips
 * (footer, homepage marquee, spotlight) where tier drives sequence but isn't
 * labelled. Title partner leads.
 */
export const logoPartnersInTierOrder: Partner[] = [
  ...(titlePartner?.logo ? [titlePartner] : []),
  ...PARTNER_TIERS.flatMap((t) =>
    partners.filter((p) => p.tier === t.key && p.logo),
  ),
];

/**
 * The footer strip — title partner + Platinum only (Wesley, 8/3).
 *
 * The footer sits on all 1,174 pages, so the whole roster there was 29 marks
 * wrapping to several rows on every screen in the site and giving a Tour Sponsor
 * the same site-wide placement as the title partner. Top billing only; the full
 * directory is one click away via the "All Sponsors" link beside it.
 */
export const footerPartners: Partner[] = logoPartnersInTierOrder.filter(
  (p) => p.tier === "title" || p.tier === "platinum",
);

export type MatchSide = {
  name: string;
  /** Game scores in order; empty until a match starts. */
  games: number[];
  winner?: boolean;
};

export type Match = {
  id: string;
  division: string;
  round: string;
  status: "live" | "final" | "upcoming";
  /** Court name (live/final) or start time (upcoming). */
  detail: string;
  sides: [MatchSide, MatchSide];
};

export const matches: Match[] = [
  {
    id: "ws-sf",
    division: "Women's Singles",
    round: "Semifinal",
    status: "live",
    detail: "Stadium Court",
    sides: [
      { name: "Jade Rau", games: [11, 7] },
      { name: "Priya Anand", games: [8, 6] },
    ],
  },
  {
    id: "md-qf",
    division: "Men's Doubles",
    round: "Quarterfinal",
    status: "live",
    detail: "Court 2",
    sides: [
      { name: "Bricker / Hartman", games: [9, 11, 4] },
      { name: "Reyes / Tanaka", games: [11, 6, 3] },
    ],
  },
  {
    id: "xd-sf",
    division: "Mixed Doubles",
    round: "Semifinal",
    status: "final",
    detail: "Stadium Court",
    sides: [
      { name: "Marín / Frost", games: [11, 11], winner: true },
      { name: "Bricker / Boyd", games: [9, 7] },
    ],
  },
  {
    id: "wd-qf",
    division: "Women's Doubles",
    round: "Quarterfinal",
    status: "final",
    detail: "Court 3",
    sides: [
      { name: "Safdar / Boyd", games: [11, 9, 11], winner: true },
      { name: "Rau / Anand", games: [6, 11, 8] },
    ],
  },
  {
    id: "ms-sf",
    division: "Men's Singles",
    round: "Semifinal",
    status: "upcoming",
    detail: "4:30 PM ET",
    sides: [
      { name: "Diego Marín", games: [] },
      { name: "Tomás Reyes", games: [] },
    ],
  },
  {
    id: "ws-final",
    division: "Women's Singles",
    round: "Final",
    status: "upcoming",
    detail: "6:00 PM ET",
    sides: [
      { name: "Hannah Boyd", games: [] },
      { name: "Naomi Frost", games: [] },
    ],
  },
];

export type NewsItem = {
  category: string;
  title: string;
  date: string;
  href: string;
};

/** PPA Tour's own newsroom — APPROVED articles only (drafts never surface). */
export const news: NewsItem[] = publishedArticles.map((a) => ({
  category: a.category,
  title: a.title,
  date: a.date,
  href: `/${a.slug}`,
}));

/**
 * Coverage from Pickleball.com is fetched live in lib/pb-news.ts and linked
 * out to, not stored here. The four hardcoded items that used to live at this
 * spot were invented headlines pointing at the pickleball.com homepage.
 */

