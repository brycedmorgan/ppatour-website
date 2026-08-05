/**
 * Editorial content for the ESPN-style homepage — the points race, players to
 * watch, and new-fan explainers. Placeholder copy for the demo build; replace
 * with the Sanity CMS + scoring/rankings API.
 *
 * `leadStory` / `storylines` / the `Storyline` type lived here until 7/31.
 * They were invented headlines that every card linked to /watch with, and the
 * homepage newsroom grid now renders real posts from `lib/news.ts` instead.
 */


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
 * SOURCE OF TRUTH: marketing's approved roster ("New Sponsors Page Updates",
 * 8/4) — Platinum, Gold, Tour Sponsors, with Carvana billed apart as title.
 * That doc supersedes the 8/3 reconciliation against ppatour.com/sponsors,
 * which is now BEHIND it: the live page still shows a Silver tier and still
 * carries Hertz and Picklebalm, none of which survive the approved list.
 *
 * ⚠ SILVER IS GONE, by instruction ("There will be no 'Silver' tier moving
 * forward"). Tixr and PlaySight, its only occupants besides Hertz, moved to
 * Tour Sponsors. The key is removed from the union rather than left unused so
 * that a future hand-edit can't quietly resurrect the tier — assigning
 * `tier: "silver"` is now a type error, not a silent regression.
 *
 * ⚠ Do NOT re-derive tiers from the brand-asset zips. That's how this was first
 * built and it was wrong in four ways. The zips are the authority on ARTWORK,
 * the approved roster on TIER.
 *
 * `official` remains the fallback for a designated partner whose tier we can't
 * confirm. Currently EMPTY — `partnersByTier()` drops empty groups, so it
 * renders no heading. Kept for the next partner who turns up without a tier,
 * so nobody has to be dropped from the wall to be listed.
 */
export type PartnerTier = "title" | "platinum" | "gold" | "tour" | "official";

/** Non-title tiers in the order they're billed, with their wall headings. */
export const PARTNER_TIERS: { key: PartnerTier; label: string }[] = [
  { key: "platinum", label: "Platinum Sponsors" },
  { key: "gold", label: "Gold Sponsors" },
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
   * credited a title partner who doesn't sponsor it. Matching the full partner
   * name is no more reliable — it depends entirely on how marketing happens to
   * label a partner this month, and the 8/4 roster relabelled five of them
   * (Proton Sports → Proton, Pickleball Central → PBC, PickleballTV → PBTV,
   * Park Place Technologies → Park Place, Just Courts Design + Build → Just
   * Courts). So it's data, not a heuristic: unset means this partner never
   * titles an event, and nothing can be inferred about them.
   */
  eventNamePrefix?: string;
  /**
   * Suppress the designation line and let the logo stand alone (Bryce, 7/28 —
   * "we do not need to type out the partner names next to their logos when the
   * logo itself makes it obvious"). The partner NAME is never printed beside a
   * logo anywhere; this hides the ROLE line too.
   *
   * ⚠ NOTHING SETS THIS TODAY. Veolia and Humana were the only two, and both
   * had it removed on 8/4 when Wesley supplied designations to show under each
   * partner ("Humana = Official human care partner", "Veolia = Official
   * Sustainability Partner"). That is a deliberate reversal of the 7/28
   * treatment for those two, not drift.
   *
   * Kept rather than deleted because it is a real editorial lever and the
   * roster is hand-maintained — a partner may again arrive whose designation
   * adds nothing beside their mark. A partner with no confirmed designation
   * needs no flag at all: leave `role` unset and the card is logo-only.
   */
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

   TIERS + MEMBERSHIP come from marketing's approved roster ("New Sponsors Page
   Updates", 8/4). LOGOS come from the brand-asset drop of 8/3 (three zips:
   Platinum Partner Logos / Gold Partner Logos / Tour Sponsors), imported and
   optimized by `scripts/import-sponsor-logos.mjs` — re-run that when partners
   refresh their art rather than hand-placing files. Every file is trimmed of
   dead margin and capped at 900px so the cards size optically; logoWidth /
   logoHeight below are the SHIPPED dimensions, not the source art's.

   ORDER: listed alphabetically within each tier, as instructed, with Carvana
   billed apart from the Platinum block on title-partner status. The ordering is
   ALSO enforced in `partnersByTier()`, so it survives the next hand-edit that
   appends a partner to the end of a block — see the note there.

   ⚠ THREE PARTNERS CAME OFF THE ROSTER with the 8/4 list: Hertz (was Silver),
   Pickleball Tournaments (was Gold) and Picklebalm (was Tour). All three are on
   ppatour.com/sponsors TODAY and all three were added from it on 8/3, so this is
   the approved list disagreeing with the live page, not an omission on our side
   — flagged back to marketing. Their marks stay on disk (hertz.webp,
   pickleball-tournaments.png, picklebalm.png) and their importer jobs stay in
   place, so re-adding any of them is a record here plus a tier.

   ⚠ Two marks are the parent brand rather than the sponsoring brand. The 8/4
   list resolves both by NAMING both brands — "AstraZeneca / Fasenra" and
   "AT Sports Surfaces / Acrytech" — so the card no longer reads as a mismatch
   between the mark and the name. Both still flagged inline on the URL question. */
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

  /* ---- Platinum (alphabetical) ---- */
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
    // Designation restored 8/4 (Wesley: "Humana = Official human care partner").
    // It was already the right string, just suppressed by `hideRole` — see the
    // note on that field.
    name: "Humana",
    website: "https://www.humana.com",
    role: "Official Human Care Partner",
    category: "Insurance",
    note: "Keeping players and fans moving, on the court and off it.",
    tier: "platinum",
    logo: "/ppa/sponsors/humana.webp",
    logoWidth: 900,
    logoHeight: 176,
  },
  {
    name: "JOOLA",
    website: "https://www.joola.com",
    role: "Official Platinum Partner",
    category: "Paddle",
    note: "Presenting partner of the PPA Finals and the gear behind a generation of pros.",
    tier: "platinum",
    logo: "/ppa/sponsors/joola.png",
    logoWidth: 900,
    logoHeight: 284,
  },
  {
    /**
     * ⚠ LIFE TIME AND LT PRO 48 ARE TWO RECORDS AGAIN — Life Time at Platinum,
     * LT Pro 48 (Official Ball) under Tour Sponsors. That is what the 8/4
     * approved list says, and it REVERSES the 8/3 merge on this repo, which had
     * folded them into one Tour record on the reasoning that LT = Life Time and
     * the ball is their product (ppatour.com/sponsors lists a single "Lifetime —
     * Official Ball" under Tour). Marketing's list is the newer instruction and
     * separates them, so they're separated. Flagged back for confirmation, since
     * one partner billed in two tiers is exactly the shape of a copy/paste in a
     * hand-written roster.
     *
     * ⚠ Designation added 8/4 (Wesley: "Life Time = PPA Host facility"). Note
     * it is NOT the Official Ball designation — that one belongs to the LT Pro
     * 48 record, which is the same company billed separately under Tour
     * Sponsors. Two records, two different designations, on purpose.
     */
    name: "Life Time",
    website: "https://www.lifetime.life",
    // Bryce, 8/5: the four Platinum partners carry "Official Platinum Partner"
    // as their designation (JOOLA, Proton, Six Zero, Life Time).
    role: "Official Platinum Partner",
    category: "Host Facility",
    tier: "platinum",
    logo: "/ppa/sponsors/life-time.webp",
    logoWidth: 650,
    logoHeight: 147,
  },
  {
    // "Proton" per the 8/4 approved list (was "Proton Sports"). Side benefit:
    // the Malibu Cup's curated presenter string is "Proton", so the marquee card
    // on that event now resolves this record's mark by exact name.
    name: "Proton",
    // Verified 7/28 (Conner Ogden: sponsor tiles were bouncing to a PPA page
    // instead of the sponsor).
    website: "https://protonsports.com",
    eventNamePrefix: "Proton",
    role: "Official Platinum Partner",
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
    role: "Official Platinum Partner",
    category: "Paddle",
    note: "Performance gear built for the demands of the pro game.",
    tier: "platinum",
    // Rasterized from Six Zero's own vector wordmark (their site's
    // six-zero-logo.svg), recoloured to near-black for the white card at 1000px
    // wide. Replaces the old 320x126 JPEG, which was below display resolution
    // AND a stacked lockup whose primary wordmark read small next to JOOLA's
    // single line — Six Zero rendered visibly smaller in the Platinum grid.
    logo: "/ppa/sponsors/six-zero.png",
    logoWidth: 1000,
    logoHeight: 260,
  },
  {
    /**
     * STORM — renamed from "Reign Storm" per the 8/4 approved list.
     *
     * The mark needed no change: what we already ship was imported from the
     * brand kit's `Storm-Primary-blk-Horizontal`, i.e. it has read STORM all
     * along and only our record said Reign Storm. The file was renamed
     * reign-storm.png → storm.png so nothing on disk contradicts the roster.
     *
     * Designation carried over unchanged — the approved list renames the brand,
     * it doesn't restate categories.
     */
    name: "STORM",
    website: "https://www.reignstorm.com/en-us/",
    role: "Official Energy Drink Partner",
    category: "Energy Drink",
    note: "Fuel for the fans and the grind of a tour weekend.",
    tier: "platinum",
    logo: "/ppa/sponsors/storm.png",
    logoWidth: 900,
    logoHeight: 243,
  },
  {
    // Designation restored 8/4 (Wesley: "Veolia = Official Sustainability
    // Partner"). Already the right string, just suppressed by `hideRole`.
    name: "Veolia",
    website: "https://www.veolianorthamerica.com",
    eventNamePrefix: "Veolia",
    role: "Official Sustainability Partner",
    category: "Sustainability",
    note: "Backing the marquee stops in Atlanta, Chicago, and the National Championships.",
    tier: "platinum",
    logo: "/ppa/sponsors/veolia.png",
    logoWidth: 900,
    logoHeight: 222,
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

  /* ---- Gold (alphabetical) ---- */
  {
    /**
     * "AstraZeneca / Fasenra" — the name marketing approved on 8/4, and it
     * closes the flag this record has carried since the logo drop: the only art
     * supplied is the ASTRAZENECA corporate mark (Fasenra is one of their drugs),
     * so a card named Fasenra was showing an AstraZeneca wordmark. Naming both
     * brands makes the mark and the record agree.
     *
     * ⚠ URL still open. Kept on fasenra.com — Wesley's 8/3 call, and it's the
     * product site behind the Official Asthma Partner designation — while
     * ppatour.com/sponsors links this partner to astrazeneca.com. One-line
     * switch if marketing wants the corporate destination now that the mark and
     * the name both lead with AstraZeneca.
     *
     * ⚠ Fasenra (not AstraZeneca) presents the National Championships, so that
     * presenting credit still reads Fasenra in event copy. And at 575px this is
     * the lowest-resolution mark we hold — both resolve by getting Fasenra art.
     */
    name: "AstraZeneca / Fasenra",
    website: "https://www.fasenra.com",
    role: "Official Asthma Partner",
    category: "Medicinal",
    note: "The tour's exclusive asthma partner.",
    tier: "gold",
    logo: "/ppa/sponsors/astrazeneca.png",
    logoWidth: 575,
    logoHeight: 139,
  },
  {
    /**
     * "AT Sports Surfaces / Acrytech" — approved 8/4, and the same fix as
     * AstraZeneca / Fasenra above: the supplied art reads "AT SPORTS — High
     * Performance Sports Surfaces", so a card named Acrytech was showing a mark
     * that said something else. Both names now appear.
     *
     * ⚠ THIS PARTNER HAS THREE NAMES and only two of them are here. Acry-Tech
     * Coatings is what Conner verified on 7/28 and what we link to;
     * ppatour.com/sponsors calls it "Court Surfaces/Tennis Paint" and links
     * tennispaint.com. Staying on acrytech.com because a human on our side
     * verified that destination. Worth one confirmation from marketing.
     */
    name: "AT Sports Surfaces / Acrytech",
    website: "https://www.acrytech.com",
    role: "Official Court Surface Partner",
    category: "Court Surface",
    note: "The surface underfoot at PPA Tour stops.",
    tier: "gold",
    logo: "/ppa/sponsors/at-sports.webp",
    logoWidth: 900,
    logoHeight: 655,
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
    // "Just Courts" per the 8/4 approved list (was "Just Courts Design + Build").
    name: "Just Courts",
    website: "https://justcourts.com/",
    // Designation supplied 8/4 (Wesley: "Just courts = Official partner").
    // Was logo-only until then — neither the live page nor the 8/4 approved
    // list carried one.
    role: "Official Partner",
    tier: "gold",
    logo: "/ppa/sponsors/just-courts.png",
    logoWidth: 900,
    logoHeight: 520,
  },
  {
    /**
     * MOJO Energy Pouches — new on the 8/4 approved list.
     *
     * Mark landed 8/4 from the brand kit Bryce sent. Horizontal full-colour
     * SVG, taken straight from `Color Logos/SVG/` — true vector, no embedded
     * raster. The kit also ships stacked, black, white and reversed cuts if a
     * dark surface ever needs one.
     *
     * No designation either — not stated on the approved list, and inventing
     * one would put words in a sponsor's mouth on their own card.
     *
     * Destination verified 8/4: mojoenergypouches.com self-identifies as "MOJO
     * ENERGY POUCHES | THE OFFICIAL WEBSITE". Not to be confused with mojo.com.
     */
    name: "MOJO Energy Pouches",
    website: "https://mojoenergypouches.com",
    // Designation confirmed by Bryce at launch (8/5): Official Partner.
    role: "Official Partner",
    tier: "gold",
    // Rasterized from the brand-kit SVG — the wordmark (.cls-3) was #fff (the
    // reversed cut) so it was invisible on the white card; recoloured to
    // near-black, colour underline kept. next/image can't serve .svg (400).
    logo: "/ppa/sponsors/mojo.png",
    logoWidth: 1000,
    logoHeight: 188,
  },
  {
    // "Park Place" per the 8/4 approved list (was "Park Place Technologies").
    // The supplied mark still reads Park Place Technologies; the name is never
    // printed beside a logo, so it surfaces only as alt text and hover title.
    name: "Park Place",
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

  /* ---- Tour Sponsors (alphabetical) ---- */
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
    // The ball. Billed here under Tour; the Life Time parent brand is billed
    // separately at Platinum — see the ⚠ on that record, this split is the one
    // thing in the 8/4 list worth a second look.
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
    // "PBC" per the 8/4 approved list, and Gold → Tour with the same rebill.
    // ⚠ The name is the roster label, so it is also the image alt text and the
    // footer hover title — "PBC" is less legible than "Pickleball Central" to a
    // screen reader. Approved label wins; one word to change if that matters.
    name: "PBC",
    // URL already verified in this codebase (the header Shop link and every
    // athlete gear CTA point here).
    website: "https://www.pickleballcentral.com",
    role: "Official Store",
    category: "Retail",
    tier: "tour",
    logo: "/ppa/sponsors/pickleball-central.png",
    logoWidth: 900,
    logoHeight: 102,
  },
  {
    // "PBTV" per the 8/4 approved list, and Gold → Tour with the same rebill.
    // Same alt-text caveat as PBC above.
    name: "PBTV",
    website: "https://pickleballtv.com/",
    role: "Official Broadcast Partner",
    category: "Broadcast / Streaming",
    note: "Every court, every match — the tour's streaming home.",
    tier: "tour",
    // ⚠ Square lockup, so a height-capped card renders it optically small
    // beside the wordmarks. Still open: a horizontal PBTV lockup fixes it.
    logo: "/ppa/sponsors/pbtv.webp",
    logoWidth: 701,
    logoHeight: 900,
  },
  {
    // Silver → Tour. Silver no longer exists (8/4).
    name: "PlaySight",
    website: "https://playsight.com/",
    role: "Official AI Technology",
    category: "AI Technology",
    tier: "tour",
    logo: "/ppa/sponsors/playsight.png",
    logoWidth: 900,
    logoHeight: 200,
  },
  {
    /**
     * Destination verified 8/4 (thepicklr.com; picklr.com is a parked domain).
     *
     * Mark landed 8/4. ⚠ The kit ships BLACK and WHITE only, no colour cut, so
     * the black horizontal lockup is the one that works on the light sponsor
     * card. If a Picklr mark is ever needed on navy, use
     * "Picklr Lockup Horizontal White" from the same kit rather than filtering
     * this one.
     */
    name: "The Picklr",
    website: "https://thepicklr.com",
    // Designation supplied 8/4 (Wesley: "Picklr = Official partner").
    role: "Official Partner",
    tier: "tour",
    // Rasterized from the SVG — next/image returns 400 for .svg, so the mark
    // was rendering as an empty card.
    logo: "/ppa/sponsors/picklr.png",
    logoWidth: 900,
    logoHeight: 202,
  },
  {
    // Silver → Tour. Silver no longer exists (8/4).
    name: "Tixr",
    website: "https://www.tixr.com",
    role: "Official Ticketing Partner",
    category: "Ticketing",
    note: "How fans get into every PPA Tour event.",
    tier: "tour",
    logo: "/ppa/sponsors/tixr.png",
    logoWidth: 900,
    logoHeight: 186,
  },
  {
    /**
     * New on the 8/4 list. No mark supplied — see the MOJO note above.
     *
     * ⚠ Destination is the apparel brand ZYIA Active (zyiaactive.com, verified
     * 8/4). NOT zyia.com, which resolves to an industrial flow-meter
     * manufacturer — the obvious guess is the wrong company. Name kept exactly
     * as approved ("Zyia"), which matters more than usual here.
     *
     * ⚠ STOPGAP MARK, NOT A SUPPLIED ONE. No Zyia brand kit came with the MOJO
     * and Picklr links, so Bryce said grab it from their site for now. This is
     * their own `zyia-logo.svg` off zyiaactive.com — true vector, 7 paths, no
     * embedded raster, so it is at least the real artwork rather than a
     * screenshot or a favicon (favicons were already rejected once for this
     * page as too low-quality to sit beside the 2048px wordmarks).
     *
     * ⚠ ONE ALTERATION: their file is filled #FFFFFF for a dark header and is
     * invisible on this light card, so the fill is recoloured to near-black.
     * That is not an invented treatment — zyiaactive.com's own favicon
     * ("BlackMoon") is pure black, so black is a mark Zyia already uses.
     * Still, REPLACE THIS with the real kit when it arrives; a scraped mark is
     * a placeholder, and if their brand guide says otherwise theirs wins.
     */
    name: "Zyia",
    website: "https://zyiaactive.com",
    // Designation supplied 8/4 (Wesley: "Zyia = Official partner").
    role: "Official Partner",
    tier: "tour",
    // Rasterized from the SVG — next/image returns 400 for .svg, so the mark
    // was rendering as an empty card.
    logo: "/ppa/sponsors/zyia.png",
    logoWidth: 700,
    logoHeight: 413,
  },

  /**
   * ⚠ PARTNERS REMOVED — records kept here so re-adding one is a paste, not a
   * re-investigation. All four leave the `official` fallback tier empty, which
   * is fine: `partnersByTier()` drops empty groups, so no heading renders.
   *
   * SELKIRK, 8/3 (Wesley: "Remove selkirk for now"). On our exclusivity roster
   * as Official Net Partner but absent from ppatour.com/sponsors and from the
   * brand-asset drop; still absent from the 8/4 approved list, which is a second
   * source agreeing. `role: "Official Net Partner"`, `category: "Net"`,
   * `website: "https://www.selkirk.com"`.
   *
   * The next three come off with the 8/4 approved list, and all three are still
   * ON ppatour.com/sponsors today — so this is the approved roster disagreeing
   * with the live page, which is worth one confirmation before launch:
   *
   * HERTZ — was Silver, `role: "Official Rental Car"`,
   * `website: "https://www.hertz.com/rentacar/reservation/"`,
   * `logo: "/ppa/sponsors/hertz.webp"` (381x136).
   *
   * PICKLEBALL TOURNAMENTS — was Gold, `role: "Official Software"`,
   * `website: "https://www.pickleballtournaments.com"`,
   * `logo: "/ppa/sponsors/pickleball-tournaments.png"` (900x241). Note the site
   * still deep-links every amateur registration CTA to this platform; dropping
   * the SPONSOR record doesn't touch those links.
   *
   * PICKLEBALM — was Tour, `role: "Official Topical Pain Reliever"`,
   * `website: "https://picklebalm.com/"`,
   * `logo: "/ppa/sponsors/picklebalm.png"` (418x94).
   */
];

/** The title partner (Carvana) — top billing, rendered apart from the tiers. */
export const titlePartner = partners.find((p) => p.tier === "title");

/**
 * Resolve a partner record from a name written somewhere else in the codebase —
 * specifically an event's curated `presentedBy` string.
 *
 * ⚠ THIS EXISTS BECAUSE THE 8/4 RENAMES BROKE AN EXACT-MATCH LOOKUP. EventSponsors
 * finds the presenting partner's mark with `partners.find(p => p.name === presentedBy)`,
 * and the approved roster labels no longer line up with the presenter strings:
 * Nationals is presented by "Fasenra" (roster: "AstraZeneca / Fasenra") and the
 * Chicago Cup by "Storm" (roster: "STORM"). Both silently fell back to printing
 * the typed name instead of showing the logo.
 *
 * Deliberately NOT the loose matching that caused the 8/3 Worlds bug. That was
 * inferring a sponsorship *relationship* from a name prefix. Here the relationship
 * is already asserted by curated event data; all this does is decide which roster
 * row holds the artwork, and it only ever matches a full name or one whole
 * slash-separated segment of a name ("AstraZeneca / Fasenra" → "AstraZeneca" or
 * "Fasenra"). It cannot invent a credit: an unknown string still resolves to
 * undefined, and the caller keeps its typed-name fallback.
 */
export function partnerByDisplayName(name: string): Partner | undefined {
  const want = name.trim().toLowerCase();
  return (
    partners.find((p) => p.name.toLowerCase() === want) ??
    partners.find((p) =>
      p.name
        .split("/")
        .map((s) => s.trim().toLowerCase())
        .includes(want),
    )
  );
}

/**
 * Alphabetical within a tier — the ordering marketing asked for on 8/4 ("Within
 * each level: list partners alphabetically").
 *
 * Case-insensitive so STORM doesn't sort ahead of Six Zero, and applied in code
 * rather than trusted to the array's hand-maintained order: the roster is edited
 * by hand under time pressure and the natural edit is to append a new partner to
 * the end of its block, which would silently break the rule on the one page
 * sponsors read. The array is kept in this order too, for whoever is reading it.
 */
const byName = (a: Partner, b: Partner) =>
  a.name.localeCompare(b.name, "en", { sensitivity: "base" });

/**
 * Partners grouped by billing tier in `PARTNER_TIERS` order, alphabetical within
 * each tier, title partner excluded, empty tiers dropped.
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
    items: partners.filter((p) => p.tier === t.key).sort(byName),
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
    partners.filter((p) => p.tier === t.key && p.logo).sort(byName),
  ),
];

/**
 * The footer strip — title partner + Platinum only (Wesley, 8/3).
 *
 * The footer sits on all 1,174 pages, so the whole roster there was 29 marks
 * wrapping to several rows on every screen in the site and giving a Tour Sponsor
 * the same site-wide placement as the title partner. Top billing only; the full
 * directory is one click away via the "All Sponsors" link beside it.
 *
 * ⚠ This strip grew from 9 marks to 10 with the 8/4 roster (Life Time joined
 * Platinum). It already wrapped to 5 rows at 390px at nine — worth a look.
 */
export const footerPartners: Partner[] = logoPartnersInTierOrder.filter(
  (p) => p.tier === "title" || p.tier === "platinum",
);

/**
 * ⚠ The `matches` placeholder was DELETED on 2026-08-05, along with the
 * `Match`/`MatchSide` types and `components/home/ScoreRail.tsx`, its only
 * consumer. It held six hand-authored matches between invented players (Jade
 * Rau, Priya Anand, Bricker/Hartman), two of them flagged `status: "live"` with
 * a pulsing LIVE chip — and the homepage rendered it as the FALLBACK whenever
 * `lastCompletedChampions()` returned null, i.e. whenever the events or scores
 * API blipped. So an upstream 429 published fabricated live scores under a "Live
 * & Latest" heading, out of season. Deleted rather than left unused so nothing
 * can import it back; the band is omitted instead. Real live scores come from
 * `lib/ticker-api.ts` / `lib/scores-api.ts`.
 */

/**
 * ⚠ `news` / `NewsItem` deleted 8/5, same reasoning as `matches` above. It
 * projected the native demo articles into homepage cards and had no importers
 * left — the newsroom grid reads `allNews()` in `lib/news.ts`, which carries
 * the 811 human-written WordPress posts. Left in place it would have been an
 * empty array sitting under a "PPA Tour's own newsroom" comment, i.e. an
 * invitation to refill it by hand. Deleted so it cannot be imported back.
 */

/**
 * Coverage from Pickleball.com is fetched live in lib/pb-news.ts and linked
 * out to, not stored here. The four hardcoded items that used to live at this
 * spot were invented headlines pointing at the pickleball.com homepage.
 */

