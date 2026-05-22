/**
 * Pro roster. Real PPA Tour athletes with official studio headshots (from the
 * PPA media library, cropped square + optimized into /public/ppa/pros/).
 * Bios are short original summaries of public, well-known facts (not copied
 * from source pages). Rankings live in `divisionRankings` (home-content.ts)
 * and reference these slugs.
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

const P = (slug: string) => `/ppa/pros/${slug}.jpg`;

export const athletes: Athlete[] = [
  {
    slug: "ben-johns",
    name: "Ben Johns",
    country: "USA",
    headshot: P("ben-johns"),
    divisions: ["Men's Singles", "Men's Doubles", "Mixed Doubles"],
    bestRank: 1,
    tagline: "The most dominant player in the sport's history",
    bio: "Ben Johns is the most decorated player pickleball has produced — a triple-crown threat who has held the No. 1 ranking in singles, doubles, and mixed at the same time. His control game and unmatched consistency are the standard every other pro is measured against.",
  },
  {
    slug: "anna-leigh-waters",
    name: "Anna Leigh Waters",
    country: "USA",
    headshot: P("anna-leigh-waters"),
    divisions: ["Women's Singles", "Women's Doubles", "Mixed Doubles"],
    bestRank: 1,
    tagline: "The most dominant woman in the game",
    bio: "Anna Leigh Waters turned pro as a teenager and has been the world's No. 1 woman ever since — a triple-crown machine whose speed and shot-making have made her the face of the sport.",
  },
  {
    slug: "federico-staksrud",
    name: "Federico Staksrud",
    country: "Argentina",
    headshot: P("federico-staksrud"),
    divisions: ["Men's Singles", "Men's Doubles"],
    bestRank: 2,
    tagline: "Argentina's relentless singles force",
    bio: "Federico Staksrud is one of the fittest, most relentless singles players on tour — an Argentine baseliner who has pushed his way into the very top tier of the men's game.",
  },
  {
    slug: "christian-alshon",
    name: "Christian Alshon",
    country: "USA",
    headshot: P("christian-alshon"),
    divisions: ["Men's Singles", "Men's Doubles"],
    bestRank: 3,
    tagline: "Power-first and fearless off the bounce",
    bio: "A former college tennis standout, Christian Alshon plays one of the biggest, most aggressive games on tour. His drives and speed-ups have made him one of singles' most feared hitters.",
  },
  {
    slug: "gabe-tardio",
    name: "Gabriel Tardio",
    country: "USA",
    headshot: P("gabe-tardio"),
    divisions: ["Men's Singles", "Men's Doubles", "Mixed Doubles"],
    bestRank: 2,
    tagline: "The young gun winning Slams with the best",
    bio: "Gabriel Tardio is one of the brightest young stars in the sport, a teenage talent who has won major doubles titles alongside the game's elite and is climbing fast in singles.",
  },
  {
    slug: "collin-johns",
    name: "Collin Johns",
    country: "USA",
    headshot: P("collin-johns"),
    divisions: ["Men's Doubles", "Mixed Doubles"],
    bestRank: 3,
    tagline: "Half of the most successful doubles team ever",
    bio: "Collin Johns is one of the best defensive players in the game and, alongside his brother Ben, part of the most successful men's doubles team pickleball has seen.",
  },
  {
    slug: "jw-johnson",
    name: "JW Johnson",
    country: "USA",
    headshot: P("jw-johnson"),
    divisions: ["Men's Singles", "Men's Doubles", "Mixed Doubles"],
    bestRank: 1,
    tagline: "The tour's most complete all-court player",
    bio: "JW Johnson is equally lethal in singles, doubles, and mixed — a smooth, technical shotmaker whose hands at the net are among the best in the game, and a perennial title contender across every discipline.",
  },
  {
    slug: "dylan-frazier",
    name: "Dylan Frazier",
    country: "USA",
    headshot: P("dylan-frazier"),
    divisions: ["Men's Doubles", "Mixed Doubles"],
    bestRank: 2,
    tagline: "A doubles specialist with elite hands",
    bio: "Dylan Frazier is one of the best pure doubles players on tour, a fixture in men's and mixed finals known for his lightning reflexes at the kitchen line.",
  },
  {
    slug: "riley-newman",
    name: "Riley Newman",
    country: "USA",
    headshot: P("riley-newman"),
    divisions: ["Men's Doubles", "Mixed Doubles"],
    bestRank: 2,
    tagline: "One of the hardest hitters in doubles",
    bio: "Riley Newman pairs raw power with a big serve and return, making him one of the most dangerous and consistent doubles players in the men's and mixed draws.",
  },
  {
    slug: "hayden-patriquin",
    name: "Hayden Patriquin",
    country: "USA",
    headshot: P("hayden-patriquin"),
    divisions: ["Men's Singles", "Men's Doubles"],
    bestRank: 4,
    tagline: "The teenage phenom beating players twice his age",
    bio: "One of the brightest young talents in the sport, Hayden Patriquin's all-court craft and composure have him trading games with the tour's veterans well before his twentieth birthday.",
  },
  {
    slug: "hunter-johnson",
    name: "Hunter Johnson",
    country: "USA",
    headshot: P("hunter-johnson"),
    divisions: ["Men's Doubles", "Mixed Doubles"],
    bestRank: 4,
    tagline: "The big-serving lefty in every doubles final",
    bio: "A powerful left-hander, Hunter Johnson has become a fixture in men's doubles finals, using his reach and firepower to control the middle of the court.",
  },
  {
    slug: "andrei-daescu",
    name: "Andrei Daescu",
    country: "Romania",
    headshot: P("andrei-daescu"),
    divisions: ["Men's Doubles", "Mixed Doubles"],
    bestRank: 5,
    tagline: "A doubles tactician at the kitchen line",
    bio: "Andrei Daescu is one of the tour's sharpest doubles minds — patient, precise, and dangerous at the net, with a long résumé of doubles and mixed finals.",
  },
  {
    slug: "jay-devilliers",
    name: "Jay Devilliers",
    country: "France",
    headshot: P("jay-devilliers"),
    divisions: ["Men's Singles", "Men's Doubles"],
    bestRank: 5,
    tagline: "The fan-favorite Frenchman",
    bio: "Jay Devilliers is one of the tour's most entertaining and athletic competitors, a French veteran who brings energy and a deep all-court game to every match.",
  },
  {
    slug: "dekel-bar",
    name: "Dekel Bar",
    country: "Israel",
    headshot: P("dekel-bar"),
    divisions: ["Men's Singles", "Men's Doubles"],
    bestRank: 6,
    tagline: "A steady, strategic shotmaker",
    bio: "Dekel Bar is a consistent, cerebral competitor who has climbed the rankings on the strength of smart point construction in both singles and doubles.",
  },
  {
    slug: "anna-bright",
    name: "Anna Bright",
    country: "USA",
    headshot: P("anna-bright"),
    divisions: ["Women's Singles", "Women's Doubles", "Mixed Doubles"],
    bestRank: 2,
    tagline: "A top-tier force across all three disciplines",
    bio: "A Cal grad with a smart, aggressive game, Anna Bright is one of the most versatile women on tour — a genuine threat to win in singles, doubles, and mixed at every stop.",
  },
  {
    slug: "catherine-parenteau",
    name: "Catherine Parenteau",
    country: "Canada",
    headshot: P("catherine-parenteau"),
    divisions: ["Women's Singles", "Women's Doubles", "Mixed Doubles"],
    bestRank: 3,
    tagline: "One of the most decorated women in the game",
    bio: "Catherine Parenteau is a Canadian standout and one of the most accomplished women in pickleball, with a long list of singles and doubles titles and a reputation for clutch finals play.",
  },
  {
    slug: "tyra-black",
    name: "Tyra Black",
    country: "USA",
    headshot: P("tyra-black"),
    divisions: ["Women's Singles", "Women's Doubles"],
    bestRank: 3,
    tagline: "A rising singles standout",
    bio: "A former junior tennis prospect, Tyra Black has become one of the most exciting young singles players in the women's game, with a powerful, athletic style.",
  },
  {
    slug: "jessie-irvine",
    name: "Jessie Irvine",
    country: "USA",
    headshot: P("jessie-irvine"),
    divisions: ["Women's Singles", "Women's Doubles", "Mixed Doubles"],
    bestRank: 4,
    tagline: "A veteran threat in every discipline",
    bio: "Jessie Irvine is one of the most experienced and consistent women on tour, a finals regular across singles, doubles, and mixed.",
  },
  {
    slug: "lea-jansen",
    name: "Lea Jansen",
    country: "USA",
    headshot: P("lea-jansen"),
    divisions: ["Women's Singles", "Women's Doubles"],
    bestRank: 5,
    tagline: "A fierce, all-court competitor",
    bio: "Lea Jansen is known for her grit and shot-making, a consistent presence deep in the women's singles and doubles draws.",
  },
  {
    slug: "paris-todd",
    name: "Paris Todd",
    country: "USA",
    headshot: P("paris-todd"),
    divisions: ["Women's Singles", "Women's Doubles", "Mixed Doubles"],
    bestRank: 4,
    tagline: "A dynamic young all-court talent",
    bio: "Paris Todd is one of the most dynamic young players in the women's game, with a fast, aggressive style that translates across all three disciplines.",
  },
  {
    slug: "kate-fahey",
    name: "Kate Fahey",
    country: "USA",
    headshot: P("kate-fahey"),
    divisions: ["Women's Singles", "Women's Doubles"],
    bestRank: 4,
    tagline: "A relentless baseline competitor",
    bio: "Kate Fahey is a fierce competitor whose endurance and consistency have made her a mainstay near the top of the women's singles rankings.",
  },
  {
    slug: "jorja-johnson",
    name: "Jorja Johnson",
    country: "USA",
    headshot: P("jorja-johnson"),
    divisions: ["Women's Singles", "Women's Doubles"],
    bestRank: 5,
    tagline: "Part of pickleball's first family",
    bio: "Jorja Johnson is a young standout already winning at the pro level, part of one of the sport's most successful families and a regular in the women's draws.",
  },
  {
    slug: "brooke-buckner",
    name: "Brooke Buckner",
    country: "USA",
    headshot: P("brooke-buckner"),
    divisions: ["Women's Singles", "Women's Doubles"],
    bestRank: 6,
    tagline: "A fast-rising all-court talent",
    bio: "Brooke Buckner is one of the fastest-rising players in the women's game, climbing the rankings on the strength of an aggressive, all-court style.",
  },
  {
    slug: "megan-dizon",
    name: "Megan Dizon",
    country: "USA",
    headshot: P("megan-dizon"),
    divisions: ["Women's Doubles", "Mixed Doubles"],
    bestRank: 6,
    tagline: "A sharp, steady doubles competitor",
    bio: "Megan Dizon is a reliable doubles and mixed competitor, known for her steady hands and smart positioning at the net.",
  },
];

export function getAthlete(slug: string): Athlete | undefined {
  return athletes.find((a) => a.slug === slug);
}
