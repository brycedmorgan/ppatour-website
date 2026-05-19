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
  name: string;
  division: string;
  points: number;
  /** Positions moved since the last stop. + up, - down, 0 steady. */
  move: number;
};

export const pointsRace: RaceEntry[] = [
  { rank: 1, name: "Jade Rau", division: "Women's Singles", points: 9840, move: 0 },
  { rank: 2, name: "Austin Bricker", division: "Men's Doubles", points: 9510, move: 1 },
  { rank: 3, name: "Mehvish Safdar", division: "Women's Doubles", points: 9275, move: -1 },
  { rank: 4, name: "Diego Marín", division: "Men's Singles", points: 8990, move: 2 },
  { rank: 5, name: "Priya Anand", division: "Women's Singles", points: 8640, move: 0 },
  { rank: 6, name: "Cole Hartman", division: "Men's Doubles", points: 8210, move: 3 },
  { rank: 7, name: "Naomi Frost", division: "Mixed Doubles", points: 7980, move: -2 },
  { rank: 8, name: "Tomás Reyes", division: "Men's Singles", points: 7650, move: 1 },
  { rank: 9, name: "Hannah Boyd", division: "Women's Doubles", points: 7420, move: 0 },
  { rank: 10, name: "Eli Tanaka", division: "Men's Doubles", points: 7180, move: 4 },
];

export type PlayerWatch = {
  image: string;
  name: string;
  division: string;
  rank: number;
  hook: string;
};

export const playersToWatch: PlayerWatch[] = [
  {
    image: "/ppa/player-rau.webp",
    name: "Jade Rau",
    division: "Women's Singles",
    rank: 1,
    hook: "Unbeaten in singles finals this season. In Atlanta the streak meets its toughest draw yet.",
  },
  {
    image: "/ppa/player-bricker.webp",
    name: "Austin Bricker",
    division: "Men's Doubles",
    rank: 2,
    hook: "Riding a 14-match win streak into a home-region stop — and chasing the No. 1 doubles seed for Nationals.",
  },
  {
    image: "/ppa/player-safdar.webp",
    name: "Mehvish Safdar",
    division: "Women's Doubles",
    rank: 3,
    hook: "Lost the top ranking by 35 points in Las Vegas. Atlanta is where she comes to take it back.",
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
};

export const partners: Partner[] = [
  {
    name: "Carvana",
    role: "Title Partner",
    note: "The named partner of the tour — on every court, every broadcast, all 25 stops.",
    tier: "title",
  },
  {
    name: "Veolia",
    role: "Official Sustainability Partner",
    note: "Backing the marquee stops in Atlanta, Chicago, and the National Championships.",
    tier: "official",
  },
  {
    name: "JOOLA",
    role: "Official Equipment Partner",
    note: "Presenting partner of the PPA Finals and the gear behind a generation of pros.",
    tier: "official",
  },
  {
    name: "Humana",
    role: "Official Health Partner",
    note: "Keeping players and fans moving, on the court and off it.",
    tier: "official",
  },
  {
    name: "Ensure",
    role: "Official Nutrition Partner",
    note: "Fueling the longest weekends on tour.",
    tier: "official",
  },
  {
    name: "Proton Sports",
    role: "Official Paddle Partner",
    note: "Engineering the paddles behind the tour's hardest hitters.",
    tier: "official",
  },
  {
    name: "Six Zero",
    role: "Official Performance Partner",
    note: "Performance gear built for the demands of the pro game.",
    tier: "official",
  },
];
