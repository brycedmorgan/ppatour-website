/**
 * Editorial content for the ESPN-style homepage — storylines, the points
 * race, players to watch, and new-fan explainers. Placeholder copy for the
 * demo build; replace with the Sanity CMS + scoring/rankings API.
 */

export type Storyline = {
  kicker: string;
  headline: string;
  dek: string;
  whyItMatters: string;
  image: string;
};

export const leadStory: Storyline = {
  kicker: "Championship Race",
  headline: "Atlanta Reopens the Fight for No. 1",
  dek: "Six weeks, six 1,000-point stops, one ranking. The Veolia Atlanta Championships restart a title race that's been decided by a single bad weekend all season.",
  whyItMatters:
    "The top two are 340 points apart — one final weekend swings the whole season.",
  image: "/ppa/action-waters-bright.jpg",
};

export const storylines: Storyline[] = [
  {
    kicker: "The Rivalry",
    headline: "The Rematch Three Months in the Making",
    dek: "They split the last two finals down to the wire. The Atlanta bracket lines up a third.",
    whyItMatters: "Bragging rights — and the No. 1 seed heading into Nationals.",
    image: "/ppa/action-md-final.jpg",
  },
  {
    kicker: "The Streak",
    headline: "Fourteen Straight. Can Anyone End It?",
    dek: "A doubles pairing hasn't dropped a match since the spring swing opened.",
    whyItMatters: "One loss reshuffles every projected bracket on tour.",
    image: "/ppa/action-mxd.jpg",
  },
  {
    kicker: "Breakout",
    headline: "The Rookie Who Crashed the Top 10",
    dek: "An unseeded run in Las Vegas turned into a permanent address near the top.",
    whyItMatters: "First-year players almost never climb the race this fast.",
    image: "/ppa/action-singles.jpg",
  },
  {
    kicker: "Upset Watch",
    headline: "Three Seeds Built to Fall Early",
    dek: "The draw wasn't kind to a few favorites at this stop.",
    whyItMatters: "A first-round exit can cost a player a full season of points.",
    image: "/ppa/action-masters.jpg",
  },
];

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
    hook: "The young star already winning Slams alongside the game's best — and climbing fast in singles.",
  },
];

export type Explainer = {
  q: string;
  a: string;
};

export const explainers: Explainer[] = [
  {
    q: "What is the PPA Tour?",
    a: "The top professional pickleball circuit — 25 stops a year, the best players in the world, all chasing one points race.",
  },
  {
    q: "How do ranking points work?",
    a: "Every result moves a player up or down. Main-tour stops are worth 1,000+ points; Grand Slams pay double.",
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

export type Partner = {
  name: string;
  role: string;
  note: string;
  tier: "title" | "official";
  /** Logo path under /public + intrinsic pixel dimensions. */
  logo: string;
  logoWidth: number;
  logoHeight: number;
};

/* Logos are the partners' official marks, mirrored from ppatour.com to
   /public/ppa/sponsors/ for the rebuild. Swap in the latest brand-kit
   files when partners refresh. */
export const partners: Partner[] = [
  {
    name: "Carvana",
    role: "Title Partner",
    note: "The named partner of the tour — on every court, every broadcast, all 25 stops.",
    tier: "title",
    logo: "/ppa/sponsors/carvana.png",
    logoWidth: 2048,
    logoHeight: 449,
  },
  {
    name: "Veolia",
    role: "Official Sustainability Partner",
    note: "Backing the marquee stops in Atlanta, Chicago, and the National Championships.",
    tier: "official",
    logo: "/ppa/sponsors/veolia.png",
    logoWidth: 2048,
    logoHeight: 836,
  },
  {
    name: "JOOLA",
    role: "Official Equipment Partner",
    note: "Presenting partner of the PPA Finals and the gear behind a generation of pros.",
    tier: "official",
    logo: "/ppa/sponsors/joola.png",
    logoWidth: 2048,
    logoHeight: 647,
  },
  {
    name: "Humana",
    role: "Official Health Partner",
    note: "Keeping players and fans moving, on the court and off it.",
    tier: "official",
    logo: "/ppa/sponsors/humana.png",
    logoWidth: 2048,
    logoHeight: 891,
  },
  {
    name: "Ensure Max Protein",
    role: "Official Nutrition Partner",
    note: "Fueling the longest weekends on tour.",
    tier: "official",
    logo: "/ppa/sponsors/ensure.png",
    logoWidth: 1200,
    logoHeight: 781,
  },
  {
    name: "Proton Sports",
    role: "Official Paddle Partner",
    note: "Engineering the paddles behind the tour's hardest hitters.",
    tier: "official",
    logo: "/ppa/sponsors/proton.webp",
    logoWidth: 792,
    logoHeight: 174,
  },
  {
    name: "Six Zero",
    role: "Official Performance Partner",
    note: "Performance gear built for the demands of the pro game.",
    tier: "official",
    logo: "/ppa/sponsors/six-zero.jpg",
    logoWidth: 320,
    logoHeight: 126,
  },
];

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

/** PPA Tour's own newsroom. */
export const news: NewsItem[] = [
  {
    category: "Recap",
    title: "Championship Sunday: Five Stats That Defined the Vegas Final",
    date: "May 17",
    href: "/news",
  },
  {
    category: "Analysis",
    title: "The Atlanta Draw, Decoded: Where the Bracket Breaks",
    date: "May 16",
    href: "/news",
  },
  {
    category: "Feature",
    title: "Inside the Rookie Class Rewriting the Rankings",
    date: "May 14",
    href: "/news",
  },
  {
    category: "The Race",
    title: "Race Report: Who Moved After the Spring Swing",
    date: "May 12",
    href: "/news",
  },
  {
    category: "Tour News",
    title: "PPA Tour Adds Two Stops to a Record 25-Event Season",
    date: "May 9",
    href: "/news",
  },
  {
    category: "Recap",
    title: "Hartman & Bricker Take Down Top Seeds in Chicago",
    date: "May 6",
    href: "/news",
  },
  {
    category: "Feature",
    title: "Anand's Singles Run Continues Into Virginia Beach",
    date: "May 4",
    href: "/news",
  },
  {
    category: "Analysis",
    title: "How the Atlanta Court Surface Plays",
    date: "May 2",
    href: "/news",
  },
  {
    category: "Profile",
    title: "Mehvish Safdar on Repeat Final Appearances",
    date: "Apr 30",
    href: "/news",
  },
  {
    category: "Analysis",
    title: "Inside the Strategy Behind a Two-Game Comeback",
    date: "Apr 28",
    href: "/news",
  },
  {
    category: "Junior",
    title: "The Junior PPA Pipeline: Five Names to Watch",
    date: "Apr 25",
    href: "/news",
  },
  {
    category: "Highlights",
    title: "Top 10 Drop Shots from the Las Vegas Open",
    date: "Apr 23",
    href: "/news",
  },
  {
    category: "Tour News",
    title: "What's New in the 2026 Tournament Rules",
    date: "Apr 20",
    href: "/news",
  },
  {
    category: "Explainer",
    title: "How Ranking Points Are Calculated, Explained",
    date: "Apr 17",
    href: "/news",
  },
  {
    category: "Feature",
    title: "Behind the Scenes: A Day in the Life on Tour",
    date: "Apr 14",
    href: "/news",
  },
];

/** Linked coverage from Pickleball.com — opens off-site. */
export const ecosystemNews: NewsItem[] = [
  {
    category: "Pickleball.com",
    title: "Pickleball's Fastest-Growing Markets, Ranked",
    date: "May 16",
    href: "https://www.pickleball.com/?utm_source=ppatour&utm_medium=website&utm_campaign=ecosystem&utm_content=home-ecosystem-news",
  },
  {
    category: "Pickleball.com",
    title: "Gear Guide: The Paddles the Pros Are Switching To",
    date: "May 13",
    href: "https://www.pickleball.com/?utm_source=ppatour&utm_medium=website&utm_campaign=ecosystem&utm_content=home-ecosystem-news",
  },
  {
    category: "Pickleball.com",
    title: "How Ranking Points Translate to Tournament Seeding",
    date: "May 11",
    href: "https://www.pickleball.com/?utm_source=ppatour&utm_medium=website&utm_campaign=ecosystem&utm_content=home-ecosystem-news",
  },
  {
    category: "Pickleball.com",
    title: "From Rec Courts to the Pro Tour: One Player's Climb",
    date: "May 8",
    href: "https://www.pickleball.com/?utm_source=ppatour&utm_medium=website&utm_campaign=ecosystem&utm_content=home-ecosystem-news",
  },
];
