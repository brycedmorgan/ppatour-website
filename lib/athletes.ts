/**
 * Pro roster. Real PPA Tour athletes with official headshots mirrored from
 * ppatour.com to /public/ppa/pros/. Bios are short original summaries of
 * public, well-known facts (not copied from source pages). Rankings live in
 * `divisionRankings` (home-content.ts) and reference these slugs.
 */

export type Athlete = {
  slug: string;
  name: string;
  country: string;
  headshot: string;
  /** Pro divisions this athlete competes in. */
  divisions: string[];
  /** Best current ranking across divisions. */
  bestRank: number;
  tagline: string;
  bio: string;
};

export const athletes: Athlete[] = [
  {
    slug: "ben-johns",
    name: "Ben Johns",
    country: "USA",
    headshot: "/ppa/pros/Ben-Johns.png",
    divisions: ["Men's Singles", "Men's Doubles", "Mixed Doubles"],
    bestRank: 1,
    tagline: "The most dominant player in the sport's history",
    bio: "Ben Johns is the most decorated player pickleball has produced — a triple-crown threat who has held the No. 1 ranking in singles, doubles, and mixed at the same time. His control game and unmatched consistency have made him the standard every other pro is measured against.",
  },
  {
    slug: "federico-staksrud",
    name: "Federico Staksrud",
    country: "Argentina",
    headshot: "/ppa/pros/federico-staksrud.png",
    divisions: ["Men's Singles", "Men's Doubles"],
    bestRank: 2,
    tagline: "Argentina's relentless singles force",
    bio: "Federico Staksrud is one of the fittest, most relentless singles players on tour — a baseline grinder from Argentina who has pushed his way into the very top tier of the men's game.",
  },
  {
    slug: "christian-alshon",
    name: "Christian Alshon",
    country: "USA",
    headshot: "/ppa/pros/Christian-Alshon.png",
    divisions: ["Men's Singles", "Men's Doubles"],
    bestRank: 3,
    tagline: "Power-first and fearless off the bounce",
    bio: "A former college tennis standout, Christian Alshon plays one of the biggest, most aggressive games on tour. His drives and speed-ups have made him one of singles' most feared hitters.",
  },
  {
    slug: "hayden-patriquin",
    name: "Hayden Patriquin",
    country: "USA",
    headshot: "/ppa/pros/Hayden-Patriquin-1.png",
    divisions: ["Men's Singles", "Men's Doubles", "Mixed Doubles"],
    bestRank: 4,
    tagline: "The teenage phenom beating players twice his age",
    bio: "One of the brightest young talents in the sport, Hayden Patriquin's all-court craft and composure have him trading games with the tour's veterans well before his twentieth birthday.",
  },
  {
    slug: "jw-johnson",
    name: "JW Johnson",
    country: "USA",
    headshot: "/ppa/pros/JW-Johnson-1.png",
    divisions: ["Men's Singles", "Men's Doubles", "Mixed Doubles"],
    bestRank: 1,
    tagline: "The tour's most complete all-court player",
    bio: "JW Johnson is equally lethal in singles, doubles, and mixed — a smooth, technical shotmaker whose hands at the net are among the best in the game. A perennial title contender across every discipline.",
  },
  {
    slug: "andrei-daescu",
    name: "Andrei Daescu",
    country: "Romania",
    headshot: "/ppa/pros/Andrei-Daescu.png",
    divisions: ["Men's Doubles", "Mixed Doubles"],
    bestRank: 3,
    tagline: "A doubles tactician at the kitchen line",
    bio: "Andrei Daescu is one of the tour's sharpest doubles minds — patient, precise, and dangerous at the net, with a long résumé of doubles and mixed finals.",
  },
  {
    slug: "hunter-johnson",
    name: "Hunter Johnson",
    country: "USA",
    headshot: "/ppa/pros/Hunter-Johnson.png",
    divisions: ["Men's Doubles", "Mixed Doubles"],
    bestRank: 4,
    tagline: "The big-serving lefty in every doubles final",
    bio: "A powerful left-hander, Hunter Johnson has become a fixture in men's doubles finals, using his reach and firepower to control the middle of the court.",
  },
  {
    slug: "anna-bright",
    name: "Anna Bright",
    country: "USA",
    headshot: "/ppa/pros/Anna-Bright.png",
    divisions: ["Women's Singles", "Women's Doubles", "Mixed Doubles"],
    bestRank: 1,
    tagline: "A top-five force across all three disciplines",
    bio: "A Cal grad with a smart, aggressive game, Anna Bright is one of the most versatile women on tour — a genuine threat to win in singles, doubles, and mixed at every stop.",
  },
  {
    slug: "catherine-parenteau",
    name: "Catherine Parenteau",
    country: "Canada",
    headshot: "/ppa/pros/Catherine-Parenteau.png",
    divisions: ["Women's Singles", "Women's Doubles", "Mixed Doubles"],
    bestRank: 2,
    tagline: "One of the most decorated women in the game",
    bio: "Catherine Parenteau is a Canadian veteran and one of the most accomplished women in pickleball, with a long list of singles and doubles titles and a reputation for clutch finals play.",
  },
  {
    slug: "brooke-buckner",
    name: "Brooke Buckner",
    country: "USA",
    headshot: "/ppa/pros/Brooke-Buckner.png",
    divisions: ["Women's Singles", "Women's Doubles"],
    bestRank: 3,
    tagline: "A rising all-court talent",
    bio: "Brooke Buckner is one of the fastest-rising players in the women's game, climbing the rankings on the strength of an aggressive, all-court style.",
  },
  {
    slug: "jorja-johnson",
    name: "Jorja Johnson",
    country: "USA",
    headshot: "/ppa/pros/Jorja-Johnson.png",
    divisions: ["Women's Singles", "Women's Doubles", "Mixed Doubles"],
    bestRank: 4,
    tagline: "Part of pickleball's first family",
    bio: "Jorja Johnson is a young standout already winning at the pro level, part of one of the sport's most successful families and a regular in the women's and mixed draws.",
  },
  {
    slug: "lacy-schennan",
    name: "Lacy Schennan",
    country: "USA",
    headshot: "/ppa/pros/Lacy-Schennan.png",
    divisions: ["Women's Doubles", "Mixed Doubles"],
    bestRank: 5,
    tagline: "A steady hand in the women's draws",
    bio: "Lacy Schennan is a consistent doubles competitor and a mainstay across the women's and mixed brackets on the main tour.",
  },
  {
    slug: "tammy-emmrich",
    name: "Tammy Emmrich",
    country: "USA",
    headshot: "/ppa/pros/Tammy-Emmrich-1.png",
    divisions: ["Women's Doubles"],
    bestRank: 5,
    tagline: "A respected veteran of the women's game",
    bio: "Tammy Emmrich is a veteran competitor and one of the most respected players in women's doubles, with years of deep runs on the pro tour.",
  },
];

export function getAthlete(slug: string): Athlete | undefined {
  return athletes.find((a) => a.slug === slug);
}
