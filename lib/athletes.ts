/**
 * Pro roster. Real PPA Tour athletes with official studio headshots (from the
 * PPA media library, cropped square + optimized into /public/ppa/pros/).
 * Bios are short original summaries of public, well-known facts (not copied
 * from source pages). Rankings live in `divisionRankings` (home-content.ts)
 * and reference these slugs.
 */

import { europeRoster } from "@/lib/europe-roster";

export type Athlete = {
  slug: string;
  name: string;
  country: string;
  headshot: string;
  /** Pro divisions this athlete competes in. */
  divisions: string[];
  /**
   * ⚠️ CAREER-BEST rank, hand-maintained, last touched May 2026 — NOT a current
   * rank. Verified 7/29: it disagrees with the live WPR board for 31 of the 40
   * pros here (Andre Mercado reads 10, he's live 108; Collin Johns 3 vs 36).
   * NEVER render this as a rank. Use `getRankingBySlug()` from lib/rankings-api
   * — one cached board fetch keyed by slug. Kept only as a rough seed for
   * ordering/priority, which is why it isn't deleted outright.
   */
  bestRank: number;
  tagline: string;
  bio: string;
};

const P = (slug: string) => `/ppa/pros/${slug}.jpg`;

/**
 * The curated US roster. Exported only through `athletes` below, which folds in
 * the PPA Tour Europe signings so each of them mints a real /athletes/[slug]
 * page instead of a second, parallel profile route. See lib/europe-roster.ts.
 */
const curatedUsAthletes: Athlete[] = [
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
    tagline: "The young gun winning majors with the best",
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
  {
    slug: "jack-sock",
    name: "Jack Sock",
    country: "USA",
    headshot: P("jack-sock"),
    divisions: ["Men's Doubles", "Mixed Doubles"],
    bestRank: 7,
    tagline: "The tennis star who crossed over",
    bio: "A former ATP world No. 2 in doubles and multiple Grand Slam champion, Jack Sock brings elite hands and one of the biggest serves in racquet sports to the pickleball doubles court.",
  },
  {
    slug: "tyler-loong",
    name: "Tyler Loong",
    country: "USA",
    headshot: P("tyler-loong"),
    divisions: ["Men's Singles", "Men's Doubles"],
    bestRank: 8,
    tagline: "A powerful, athletic all-court game",
    bio: "Tyler Loong is one of the tour's most athletic competitors, with a power game that keeps him deep in singles and doubles draws.",
  },
  {
    slug: "connor-garnett",
    name: "Connor Garnett",
    country: "USA",
    headshot: P("connor-garnett"),
    divisions: ["Men's Doubles", "Mixed Doubles"],
    bestRank: 9,
    tagline: "A steady doubles competitor",
    bio: "Connor Garnett is a consistent presence in the men's and mixed doubles draws, known for reliable hands at the kitchen line.",
  },
  {
    slug: "augie-ge",
    name: "Augustus Ge",
    country: "USA",
    headshot: P("augie-ge"),
    divisions: ["Men's Doubles", "Mixed Doubles"],
    bestRank: 9,
    tagline: "A crafty doubles specialist",
    bio: "Augustus Ge is a quick-handed doubles specialist who has worked his way into the men's and mixed brackets on the main tour.",
  },
  {
    slug: "pablo-tellez",
    name: "Pablo Tellez",
    country: "Colombia",
    headshot: P("pablo-tellez"),
    divisions: ["Men's Doubles", "Mixed Doubles"],
    bestRank: 8,
    tagline: "A rising international doubles talent",
    bio: "Pablo Tellez is one of the tour's rising international talents, a doubles competitor with a fast, aggressive style.",
  },
  {
    slug: "andre-mercado",
    name: "Andre Mercado",
    country: "USA",
    headshot: P("andre-mercado"),
    divisions: ["Men's Doubles"],
    bestRank: 10,
    tagline: "A young doubles climber",
    bio: "Andre Mercado is a young competitor steadily climbing the men's doubles rankings on the main tour.",
  },
  {
    slug: "eddie-perez",
    name: "Eddie Perez",
    country: "USA",
    headshot: P("eddie-perez"),
    divisions: ["Men's Doubles", "Mixed Doubles"],
    bestRank: 10,
    tagline: "A veteran doubles presence",
    bio: "Eddie Perez is an experienced doubles and mixed competitor and a familiar face across the tour brackets.",
  },
  {
    slug: "jaume-martinez-vich",
    name: "Jaume Martinez Vich",
    country: "Spain",
    headshot: P("jaume-martinez-vich"),
    divisions: ["Men's Singles", "Men's Doubles"],
    bestRank: 9,
    tagline: "Spain's pickleball standout",
    bio: "Jaume Martinez Vich is one of Spain's top pickleball exports, a racquet-sports crossover talent competing in singles and doubles.",
  },
  {
    slug: "kaitlyn-christian",
    name: "Kaitlyn Christian",
    country: "USA",
    headshot: P("kaitlyn-christian"),
    divisions: ["Women's Doubles", "Mixed Doubles"],
    bestRank: 6,
    tagline: "The WTA doubles pro turned pickleball force",
    bio: "A former WTA tour doubles professional, Kaitlyn Christian brings elite movement and net instincts to the women's and mixed doubles draws.",
  },
  {
    slug: "etta-tuionetoa",
    name: "Etta Tuionetoa",
    country: "USA",
    headshot: P("etta-tuionetoa"),
    divisions: ["Women's Doubles"],
    bestRank: 8,
    tagline: "A powerful rising competitor",
    bio: "Etta Tuionetoa is a powerful, fast-rising competitor making her mark in the women's doubles brackets.",
  },
  {
    slug: "judit-castillo",
    name: "Judit Castillo",
    country: "Spain",
    headshot: P("judit-castillo"),
    divisions: ["Women's Singles", "Women's Doubles"],
    bestRank: 7,
    tagline: "A Spanish talent on the rise",
    bio: "Judit Castillo is a Spanish competitor making her mark across the women's singles and doubles draws on the main tour.",
  },
  {
    slug: "genie-erokhina",
    name: "Genie Erokhina",
    country: "USA",
    headshot: P("genie-erokhina"),
    divisions: ["Women's Singles", "Women's Doubles"],
    bestRank: 7,
    tagline: "A young singles standout with a big game",
    bio: "Genie Erokhina is one of the most promising young players in the women's game, with a powerful baseline style.",
  },
  {
    slug: "rachel-rohrabacher",
    name: "Rachel Rohrabacher",
    country: "USA",
    headshot: P("rachel-rohrabacher"),
    divisions: ["Women's Doubles", "Mixed Doubles"],
    bestRank: 7,
    tagline: "A consistent doubles competitor",
    bio: "Rachel Rohrabacher is a steady doubles and mixed competitor, a regular in the deep rounds of the women's draws.",
  },
  {
    slug: "callie-smith",
    name: "Callie Smith",
    country: "USA",
    headshot: P("callie-smith"),
    divisions: ["Women's Doubles"],
    bestRank: 8,
    tagline: "A steady women's doubles presence",
    bio: "Callie Smith is a consistent women's doubles competitor and a familiar name across the tour brackets.",
  },
  {
    slug: "allyce-jones",
    name: "Allyce Jones",
    country: "USA",
    headshot: P("allyce-jones"),
    divisions: ["Women's Doubles"],
    bestRank: 9,
    tagline: "A competitive women's doubles player",
    bio: "Allyce Jones is a competitive doubles player working her way up the women's tour rankings.",
  },
  {
    slug: "lina-padegimaite",
    name: "Lina Padegimaite",
    country: "Lithuania",
    headshot: P("lina-padegimaite"),
    divisions: ["Women's Singles", "Women's Doubles"],
    bestRank: 8,
    tagline: "A Lithuanian competitor on the women's tour",
    bio: "Lina Padegimaite is one of the tour's international competitors, contesting both the women's singles and doubles draws.",
  },
];

/**
 * PPA Tour Europe signings as curated athlete records.
 *
 * ⚠ `bestRank` IS ZERO ON PURPOSE and must stay that way. The field is a
 * hand-maintained career-best that the profile page is already forbidden from
 * rendering as a rank (see the warning on the type). Europe pros have no such
 * figure, and inventing one would be inventing a ranking. A live world rank
 * still resolves normally through `getWprPlayerBySlug` for any Europe pro on
 * the board — which is why `europeRoster` keys on the pickleball.com slug.
 *
 * ⚠ A pro with no portrait yet (Alexia Alvarez) carries an EMPTY headshot, not
 * a placeholder path. `loadAthlete` treats the empty string as absent and falls
 * through to the API headshot, so she is never a broken image.
 */
const europeAthletes: Athlete[] = europeRoster.map((p) => ({
  slug: p.slug,
  name: p.name,
  country: p.country,
  headshot: p.portrait ?? "",
  divisions: p.divisions,
  bestRank: 0,
  tagline: p.tagline,
  bio: p.bio[0] ?? `${p.name} is a professional pickleball player on PPA Tour Europe.`,
}));

export const athletes: Athlete[] = [...curatedUsAthletes, ...europeAthletes];

export function getAthlete(slug: string): Athlete | undefined {
  return athletes.find((a) => a.slug === slug);
}
