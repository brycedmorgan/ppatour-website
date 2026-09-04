/**
 * PPA Tour Europe signed roster — the Europe region's pro record.
 *
 * Source: "PPA Europe Roster Profile Info", owned by Katherina 'Catie' Preis
 * (Director, PPA Tour Europe), Drive folder shared by Payton Pemberton
 * 2026-09-03. Portraits come from the "Euro Player Portrait Pictures" subfolder
 * of that same folder, cropped square and optimized into /public/europe/pros/.
 *
 * ⚠ `slug` IS THE pickleball.com PLAYER SLUG, NOT A NAME WE INVENTED, and that
 * is load-bearing. It is the same key the Partner API's ranking board uses, so
 * a Europe pro on the board picks up a live world rank on /athletes/[slug] for
 * free. Copy it from the `PBCOM profile` column of Catie's sheet — several do
 * NOT match the name (Matteo Cugliari is `mat-teo`, Ellie Tomkinson is
 * `eleanor-tomkinson`, Katie Morris is `katie-morris-3`). Guessing one mints a
 * page with no rank on a slug nobody links to.
 *
 * ⚠ SEVEN OF THESE PROS ALREADY HAVE A PROFILE from the WordPress scrape
 * (`lib/data/published-athletes.json`) — Owczarek, Platel, Cugliari, Amaro,
 * Paque, Seccia, Protzek. Feeding this roster through `lib/athletes.ts` adds a
 * portrait and a tagline to those pages rather than minting a second one. Do
 * NOT build a parallel /europe/players/[slug] route; that is exactly the
 * duplicate-profile problem `lib/athlete-slugs.ts` exists to clean up.
 *
 * ⚠ ONE MISSING RECORD IS DELIBERATE. Alexia Alvarez has a pickleball.com
 * profile but no portrait and no bio in the sheet. She ships as a card with a
 * silhouette so the gap is visible to Catie rather than hidden by omission.
 * Fill `portrait` and `bio` when they arrive; nothing else needs to change.
 *
 * Bios are Catie's text. Two arrived in the first person (Biedermann,
 * Tomkinson) and were put into the third person to match the other 23 and every
 * US athlete page — same facts, nothing added. Tell Catie when the roster is
 * next updated so the sheet and the site do not drift.
 */

export type EuroPro = {
  /** pickleball.com / WPR board slug. See the warning above. */
  slug: string;
  name: string;
  /** Country as Catie's sheet records it — the flag the player competes under. */
  country: string;
  /** ISO-3, for the flag chip and for sorting. */
  countryCode: string;
  age: number;
  divisions: string[];
  sponsors: string[];
  instagram?: string;
  /** Square portrait in /public/europe/pros. Absent → silhouette card. */
  portrait?: string;
  /** One line, drawn from the bio. Never a rank. */
  tagline: string;
  /** Paragraphs. Empty array → the card links out and prints no bio. */
  bio: string[];
};

/**
 * ⚠ RETURNS `undefined` UNTIL THE PORTRAIT FILES ARE ACTUALLY IN THE REPO, AND
 * THAT FLAG IS NOT BUREAUCRACY — IT IS THE BUG IT WAS ADDED FOR. This helper
 * used to build `/europe/pros/<slug>.jpg` unconditionally, so every one of the
 * 25 records carried a path to a file that does not exist. The silhouette
 * fallback only fires on a MISSING `portrait`, so it never fired: the roster
 * shipped 25 broken images to production, and Alexia Alvarez — the one record
 * with no path — was the only card that looked right.
 *
 * The per-player mapping below stays written down so nothing has to be
 * re-derived. **Flip this to `true` in the same commit that adds the files**,
 * and never before: a path is not a picture.
 */
const PORTRAITS_IN_REPO = false;

const P = (slug: string): string | undefined =>
  PORTRAITS_IN_REPO ? `/europe/pros/${slug}.jpg` : undefined;

const MD = ["Men's Doubles"];
const WD = ["Women's Doubles"];
const MS = ["Men's Singles"];
const WS = ["Women's Singles"];
const XD = ["Mixed Doubles"];

export const europeRoster: EuroPro[] = [
  {
    slug: "karolina-owczarek",
    name: "Karolina Owczarek",
    country: "Poland",
    countryCode: "POL",
    age: 28,
    divisions: [...WD, ...XD],
    sponsors: ["Diadem"],
    instagram: "https://www.instagram.com/kangurtrenuje/",
    portrait: P("karolina-owczarek"),
    tagline: "Five-time Polish champion and 2025 RTA Pickleball Tour overall leader",
    bio: [
      "Karolina Owczarek is a Polish pickleball player on the PPA Tour. She came to pickleball from tennis in early 2024 and finished 2025 as the overall leader on the RTA Pickleball Tour.",
      "A left-side women's doubles specialist who also plays mixed, she is a five-time Polish champion with 53 career podiums, 27 of them gold, and has competed across Europe as well as in China, India and Egypt. In 2026 she played the MLP Mid-Season Tournament for Team Europe, and before that Season 1 of the World Pickleball League with the Hyderabad Superstars.",
      "Off the tour she is Head Coach at PBC Center in Berlin, coaching in Polish, English and German. She coaches the way she competes — positive, and not afraid to be funny on court, because players learn faster when they are enjoying themselves. Having made the switch from tennis herself, she especially likes working with players going through the same thing, since she knows which habits carry over and which ones quietly get in the way.",
    ],
  },
  {
    slug: "theo-platel",
    name: "Théo Platel",
    country: "France",
    countryCode: "FRA",
    age: 24,
    divisions: [...MS, ...MD, ...XD],
    sponsors: ["Diadem"],
    instagram: "https://www.instagram.com/theoplatel_pb/",
    portrait: P("theo-platel"),
    tagline: "Multiple-time French and European champion",
    bio: [
      "Théo Platel is a French professional pickleball player who represents France in international team competition. A multiple-time French Champion and European Champion, Platel has established himself as one of the country's top players.",
      "Over the past three years, Platel has competed internationally across Europe, the United States, Asia and Australia. He has represented France at the European level and achieved top European rankings across singles, men's doubles and mixed doubles.",
    ],
  },
  {
    slug: "bartosz-karbownik",
    name: "Bartosz Karbownik",
    country: "Poland",
    countryCode: "POL",
    age: 24,
    divisions: [...MS, ...MD, ...XD],
    sponsors: ["Joola Europe"],
    instagram: "https://www.instagram.com/karbo.pb/",
    portrait: P("bartosz-karbownik"),
    tagline: "European men's singles champion and Poland's No. 1 in all three disciplines",
    bio: [
      "Bartosz Karbownik transitioned from competitive tennis to pickleball and quickly established himself among the top players in Europe. He is the European Champion in men's singles and currently ranked No. 1 in Poland across singles, men's doubles and mixed doubles.",
      "A four-time Polish National Champion, Karbownik has won international tournaments in the United States, Spain, Germany, Sweden, Italy and Austria. He has also represented Poland at the European Championships, earning silver in men's singles and bronze in men's doubles.",
      "Karbownik was the only Polish player selected in the World Pickleball League Draft in both 2025 and 2026.",
    ],
  },
  {
    slug: "molly-odonoghue",
    name: "Molly O'Donoghue",
    country: "United Kingdom",
    countryCode: "GBR",
    age: 24,
    divisions: [...WS, ...WD, ...XD],
    sponsors: ["Franklin", "Skechers UK"],
    instagram: "https://www.instagram.com/mollycodonoghue/",
    portrait: P("molly-odonoghue"),
    tagline: "Found the sport studying abroad in Melbourne, turned pro two years later",
    bio: [
      "Molly O'Donoghue is a 24-year-old professional pickleball player from England, signed with the PPA Tour. She discovered her passion for the sport two years ago while studying abroad in Melbourne, Australia, and was instantly hooked.",
      "After returning home to England she started winning local tournaments before turning her sights to Europe. Fuelled by determination, hard work and a desire to be the best, she continues to grow and develop her game at the highest level of the professional circuit.",
    ],
  },
  {
    slug: "mikolaj-biedermann",
    name: "Mikolaj Biedermann",
    country: "Poland",
    countryCode: "POL",
    age: 21,
    divisions: [...MS, ...MD, ...XD],
    sponsors: ["Diadem"],
    instagram: "https://www.instagram.com/mikobiedermann_pb/",
    portrait: P("mikolaj-biedermann"),
    tagline: "Top-six finish in the 2025 RTA European Championship in his first full season",
    bio: [
      "Mikolaj Biedermann is a 21-year-old professional player from Poland, signed with PPA Tour Europe. A friend talked him into trying pickleball in the summer of 2024 and he fell for the sport immediately. He had played tennis his whole life, but it was pickleball that became his real passion.",
      "In 2025, his first full competitive season, he improved through the whole year and finished in the top six of the RTA European Championship. 2026 has already become the biggest year of his career, with signing a PPA contract the significant step forward.",
    ],
  },
  {
    slug: "alberto-seccia",
    name: "Alberto Seccia",
    country: "Italy",
    countryCode: "ITA",
    age: 27,
    divisions: [...MS, ...MD, ...XD],
    sponsors: [],
    instagram: "https://www.instagram.com/alberto.rf/",
    portrait: P("alberto-seccia"),
    tagline: "Italian champion two years running",
    bio: [
      "Alberto Seccia is a professional pickleball player from Italy competing on the PPA Tour in men's singles, men's doubles and mixed doubles.",
      "Tennis was his first sport. He picked up pickleball two years ago and played it for fun at first, but day after day he started taking it seriously. He climbed and then topped the Italian rankings, becoming Italian champion for two consecutive years. He trains every day to improve his game and to compete at the highest level of professional pickleball.",
    ],
  },
  {
    slug: "raquel-amaro",
    name: "Raquel Amaro",
    country: "Spain",
    countryCode: "ESP",
    age: 26,
    divisions: [...WS, ...WD, ...XD],
    sponsors: ["Joola Europe", "Joola Spain"],
    instagram: "https://www.instagram.com/raquelamarov/",
    portrait: P("raquel-amaro"),
    tagline: "Former Billie Jean King Cup player, now top three in Spain",
    bio: [
      "Raquel Amaro is a professional pickleball player competing on the PPA Tour in women's singles, women's doubles and mixed doubles. A former professional tennis player and NCAA All-American, she competed internationally and represented Venezuela in the Billie Jean King Cup before moving to pickleball.",
      "Raquel is a member of the Spanish National Team and has represented Spain at the 2025 and 2026 World Cups. She is a top-three ranked player in Spain, has competed across Europe, and has played MLP Europe alongside some of the top players in the sport.",
      "Based in Madrid, she continues to compete at the highest level while contributing to the growth of pickleball across Europe.",
    ],
  },
  {
    slug: "boris-paque",
    name: "Boris Paque",
    country: "Belgium",
    countryCode: "BEL",
    age: 27,
    divisions: [...MS, ...MD, ...XD],
    sponsors: ["Fox Pickleball"],
    instagram: "https://www.instagram.com/boris_paque/",
    portrait: P("boris-paque"),
    tagline: "Belgium's No. 1, two years after picking up a paddle",
    bio: [
      "Boris Paque is a professional pickleball player from Liège, Belgium, competing on the PPA Tour in men's singles, men's doubles and mixed doubles. As Belgium's No. 1 ranked player he has quickly established himself as one of Europe's most promising competitors.",
      "Paque, 27, came from tennis and football before discovering pickleball just two years ago. He wasted no time turning his passion into a career, entering professional tournaments in Europe only a few months after picking up the sport.",
      "A turning point came when he spent two months training at the Mouratoglou Academy in Zephyrhills, Florida — an experience that convinced him he could compete at the highest level. He now calls the Mouratoglou Academy his club, and continues to sharpen his game across all three disciplines.",
    ],
  },
  {
    slug: "james-ling",
    name: "James Ling",
    country: "United Kingdom",
    countryCode: "GBR",
    age: 29,
    divisions: [...MS, ...MD, ...XD],
    sponsors: ["Fox Pickleball"],
    instagram: "https://www.instagram.com/jamesling.pb/",
    portrait: P("james-ling"),
    tagline: "Fifteen professional medals in his first year of competition",
    bio: [
      "James Ling has been playing pickleball for just over a year and has quickly established himself as one of the top emerging players in Europe. In his first year of competition he earned 15 professional medals across the European circuit.",
      "His results include singles gold, men's doubles silver and mixed doubles bronze at the Egypt Open; singles silver and mixed doubles bronze at the Rome Open; and singles silver, men's doubles bronze and mixed doubles bronze at RTA 500 England. He also recorded a top-five finish in mixed doubles and a top-seven finish in men's doubles at PPA Italy.",
      "Ling has reached the top ten in singles on the RTA European Tour, and currently ranks among the top three singles and top five doubles players in the UK.",
    ],
  },
  {
    slug: "eleanor-tomkinson",
    name: "Ellie Tomkinson",
    country: "United Kingdom",
    countryCode: "GBR",
    age: 19,
    divisions: [...WS, ...WD, ...XD],
    sponsors: [],
    instagram: "https://www.instagram.com/ellie.tomkinson.pb/",
    portrait: P("eleanor-tomkinson"),
    tagline: "National singles champion and England international at 19",
    bio: [
      "Ellie Tomkinson started playing tennis at four and worked her way up to competing nationally before discovering pickleball in 2023 through her dad, who played the sport. She entered her first pickleball tournament in August 2023 and has not looked back since.",
      "She turned professional halfway through the 2024 season and has since become a National Singles Champion, a multiple-time European medallist, and an England international, representing her country at the Pickleball World Cup.",
    ],
  },
  {
    slug: "cyril-peltier",
    name: "Cyril Peltier",
    country: "France",
    countryCode: "FRA",
    age: 37,
    divisions: [...MS, ...MD, ...XD],
    sponsors: ["Joola Europe"],
    instagram: "https://www.instagram.com/cyril_peltier_pickleball/",
    portrait: P("cyril-peltier"),
    tagline: "Playing since 2019, and a multiple French major titlist",
    bio: [
      "Cyril Peltier is a French professional pickleball player competing at the highest level in men's singles, men's doubles and mixed doubles. His pickleball journey began in North America in 2019, where he competed across the United States, Canada and Mexico while developing his game alongside some of the continent's top players.",
      "After finding success in France and capturing multiple major national titles, Peltier moved to the European circuit in 2021. His game is defined by tactical awareness, shot variety and an ability to find and exploit an opponent's weaknesses.",
      "He continues to compete at the professional level while helping establish French pickleball on the European and international stage.",
    ],
  },
  {
    slug: "myriam-enmer",
    name: "Myriam Enmer",
    country: "France",
    countryCode: "FRA",
    age: 28,
    divisions: [...WS, ...WD, ...XD],
    sponsors: ["Joola Europe"],
    instagram: "https://www.instagram.com/myriamenmer/",
    portrait: P("myriam-enmer"),
    tagline: "Two-time 2026 French Open runner-up, and No. 2 in France",
    bio: [
      "Myriam Enmer is a French professional pickleball player and one of the top women's singles players in France. She earned runner-up finishes at both the 2026 Winter French Open and the 2026 Summer French Open, along with a third-place finish at the 2026 Skechers Paris Open.",
      "Enmer has reached as high as No. 2 in the French women's singles rankings.",
    ],
  },
  {
    slug: "hector-sanchez-vidal-1",
    name: "Héctor Sánchez Vidal",
    country: "Spain",
    countryCode: "ESP",
    age: 18,
    divisions: [...MS, ...MD, ...XD],
    sponsors: ["Luzz", "Jomasport"],
    instagram: "https://www.instagram.com/hectorsanchez_pb/",
    portrait: P("hector-sanchez-vidal-1"),
    tagline: "First pro title less than a year after picking up the sport",
    bio: [
      "Héctor Sánchez Vidal began playing pickleball in June 2025 at just 17 years old and quickly emerged as a rising talent in Spain. Less than a year after picking up the sport he captured his first professional title at the 2026 WPC Malaga Open.",
      "Since then he has earned podium finishes at the Rome Open Championships, Top Series Sevilla, PickleProTour Gran Canaria, Top Series Salamanca, PickleProTour Madrid, PickleProTour La Coruña and WPC Alba. He has also won the Spanish Junior Championships in every category.",
    ],
  },
  {
    slug: "viktoria-kanichova",
    name: "Viktória Kanichová",
    country: "Slovakia",
    countryCode: "SVK",
    age: 27,
    divisions: [...WS, ...WD, ...XD],
    sponsors: [],
    instagram: "https://www.instagram.com/viki_kanich/",
    portrait: P("viktoria-kanichova"),
    tagline: "Twenty-two medals in a single European Tour season, and founder of the Slovak Pickleball Association",
    bio: [
      "Viktória Kanichová is a professional pickleball player from Slovakia who moved to the sport in 2024 after 18 years of competitive tennis. Her breakthrough came in an outstanding 2025 season, where she collected 22 medals across the European Tour and closed the year with silver at the European Masters Finals in Arlberg in December.",
      "She has established herself among Europe's top players, reaching the top five in the European singles rankings and winning titles in doubles and mixed as well. She is known for her competitive mindset and her athleticism.",
      "Beyond her playing career, Viktória founded the Slovak Pickleball Association and plays an active role in growing the sport in Central Europe.",
    ],
  },
  {
    slug: "mat-teo",
    name: "Matteo Cugliari",
    country: "Italy",
    countryCode: "ITA",
    age: 25,
    divisions: [...MS, ...MD],
    sponsors: ["Joola Europe"],
    instagram: "https://www.instagram.com/matteocugliari_pb/",
    portrait: P("mat-teo"),
    tagline: "The Italian player with the most team championship titles",
    bio: [
      "Matteo Cugliari is a professional pickleball player and official PPA Tour athlete competing in men's singles and men's doubles. Born in Rome in August 2000, he brings a strong foundation in racquet sports to the court, with more than a decade of competitive tennis (2nd FITP Category) and padel (3rd FITP Category) behind him.",
      "He discovered pickleball in September 2024. After a few months of playing purely for fun he dedicated himself to the sport in January 2025, turning it into his profession. He has risen quickly since, and is the Italian player with the most team championship titles.",
      "Cugliari is a member of the Italian Pickleball National Team, taking bronze at the European Championships at the Foro Italico in Rome. He is a double Italian Absolute Champion in men's singles and men's doubles, and a two-time consecutive Italian Team Champion with New Country Frascati. He was selected for Team Europe twice for international competition in China, earning silver in 2025 and bronze in 2026, and has two Pickleball Champions League bronze medals, from Málaga and Alba.",
    ],
  },
  {
    slug: "anna-marija-bukina",
    name: "Anna Marija Bukina",
    country: "Latvia",
    countryCode: "LVA",
    age: 27,
    divisions: [...WS, ...WD, ...XD],
    sponsors: ["Arronax"],
    instagram: "https://www.instagram.com/bukina__/",
    portrait: P("anna-marija-bukina"),
    tagline: "Latvia's No. 1 woman in all three disciplines",
    bio: [
      "Anna Marija Bukina is Latvia's No. 1 female pickleball player in singles, women's doubles and mixed doubles. Latvian Champion in 2024 and 2025, she has established herself as one of the country's leading players on the international stage.",
      "Her recent results include a quarterfinal finish in women's doubles at the 2026 PPA Portorož, bronze in singles and women's doubles at 2026 WPC Sweden, and a semifinal finish in women's doubles at RTA Kerpen 2026. She was also a semifinalist at the 2025 US Minor League Nationals, a champion at the 2025 DUPR 15 Women's 3v3 Baltic Cup, and part of the championship team at the 2025 Mississippi Regional.",
    ],
  },
  {
    slug: "arwid-dahlin",
    name: "Arwid Dahlin",
    country: "Sweden",
    countryCode: "SWE",
    age: 18,
    divisions: [...MS, ...MD, ...XD],
    sponsors: ["Joola Europe"],
    instagram: "https://www.instagram.com/arwiddahlin_pb/",
    portrait: P("arwid-dahlin"),
    tagline: "Swedish champion in all three categories at 18",
    bio: [
      "Arwid Dahlin is a Swedish professional pickleball player. He has just turned 18 and is the current Swedish Champion in all three categories. He was also the 2025 European Tour's runner-up champion in men's doubles.",
    ],
  },
  {
    slug: "katie-morris-3",
    name: "Katie Morris",
    country: "United Kingdom",
    countryCode: "GBR",
    age: 27,
    divisions: [...WS, ...WD, ...XD],
    sponsors: ["Nox"],
    instagram: "https://www.instagram.com/katiemorris.pb/",
    portrait: P("katie-morris-3"),
    tagline: "Played MLP and the PPA Tour in Australia before coming home to Europe",
    bio: [
      "Katie Morris began playing pickleball in late 2023 after competing as a semi-professional tennis player. She carried her racquet-sport experience straight onto the pickleball court, competing across Europe in her first year and earning multiple international medals.",
      "In 2025 she moved to Australia to compete in Major League Pickleball and on the PPA Tour Australia. She has since returned to Europe, where she lives, trains and competes professionally.",
    ],
  },
  {
    slug: "krisztian-kaszoni",
    name: "Krisztian Kaszoni",
    country: "Hungary",
    countryCode: "HUN",
    age: 21,
    divisions: [...MS, ...MD, ...XD],
    sponsors: ["Joola Europe"],
    instagram: "https://www.instagram.com/kkaszoni_pb/",
    portrait: P("krisztian-kaszoni"),
    tagline: "Two-time Hungarian champion",
    bio: [
      "Krisztian Kaszoni is a Hungarian professional pickleball player with 15 years of tennis behind him. He first discovered pickleball as a recreational player before quickly developing his game and becoming one of Hungary's top competitors.",
      "Kaszoni is a two-time Hungarian Champion and has earned numerous medals in tournaments across Europe.",
    ],
  },
  {
    slug: "adrian-jimenez-pueyo",
    name: "Adrian Jimenez",
    country: "Ireland",
    countryCode: "IRL",
    age: 34,
    divisions: [...MD, ...XD],
    sponsors: ["Joola Europe"],
    instagram: "https://www.instagram.com/pickleballadri/",
    portrait: P("adrian-jimenez-pueyo"),
    tagline: "Ireland's No. 1 DUPR-ranked man, and a PPR-certified coach",
    bio: [
      "Adrian Jimenez is a 34-year-old professional pickleball player from Spain, now based in Northern Ireland. He discovered pickleball three years ago and has risen to become one of Ireland's leading players.",
      "He has competed at national and international level, representing Ireland as part of the Irish National Team at the European Championships. He is currently the No. 1 DUPR-ranked male player in Ireland, with multiple Irish titles and European medals across men's and mixed doubles.",
      "Alongside competing he is a PPR-certified coach, running sessions, clinics and tournaments across Ireland and helping grow the sport at grassroots level. In 2026 he joins PPA Tour Europe.",
    ],
  },
  {
    slug: "thaila-rodrigues",
    name: "Thaila Rodrigues",
    country: "Ireland",
    countryCode: "IRL",
    age: 16,
    divisions: [...WS, ...WD, ...XD],
    sponsors: ["Franklin", "Skechers"],
    instagram: "https://www.instagram.com/thailarodrigues03/",
    portrait: P("thaila-rodrigues"),
    tagline: "Sixteen, and already competing across the US, UK and Europe",
    bio: [
      "Thaila Rodrigues is a 16-year-old professional pickleball player competing in women's singles, women's doubles and mixed doubles. Signed with the PPA Tour, she is one of the sport's exciting young talents.",
      "She discovered pickleball three years ago, beginning under the guidance of her mum, who still travels alongside her. Since then she has gained competitive experience at tournaments across the US, UK and Europe.",
      "Driven by hard work, family support and a genuine love for the game, she brings determination and a competitive edge to every match while continuing to develop all parts of her game.",
    ],
  },
  {
    slug: "marina-sicic",
    name: "Marina Sičić",
    country: "Serbia",
    countryCode: "SRB",
    age: 35,
    divisions: [...WS, ...WD, ...XD],
    sponsors: [],
    instagram: "https://www.instagram.com/marinasicicpkl/",
    portrait: P("marina-sicic"),
    tagline: "Found the sport in the US, then made her name on the European circuit",
    bio: [
      "Marina Sičić is a professional pickleball player competing on PPA Tour Europe. She discovered the sport two years ago, and found that it reignited the competitive drive she had stepped away from after collegiate tennis.",
      "She picked up pickleball in the United States, and on moving back to Europe established herself quickly as a rising competitor. Newly signed with PPA Tour Europe, she is fuelled by that competitive drive, family support and a love for the game.",
    ],
  },
  {
    // ⚠ NO PORTRAIT AND NO BIO — the gap is real, not an oversight. See the
    // header note. Catie owns both.
    slug: "alexia-alvarez",
    name: "Alexia Alvarez",
    country: "Spain",
    countryCode: "ESP",
    age: 25,
    divisions: [...WS, ...WD, ...XD],
    sponsors: [],
    tagline: "Professional pickleball player on PPA Tour Europe",
    bio: [],
  },
  {
    slug: "jesus-campos",
    name: "Jesús Campos",
    country: "Spain",
    countryCode: "ESP",
    age: 25,
    divisions: [...MS, ...MD, ...XD],
    sponsors: ["Jomasport"],
    instagram: "https://www.instagram.com/jesuscampos23/",
    portrait: P("jesus-campos"),
    tagline: "Two-time Spanish champion and 2024 European champion",
    bio: [
      "Jesús Campos is a professional pickleball player from Spain and one of the country's leading players, with experience at national, European and international level.",
      "He has been playing pickleball for five years. He is a two-time Spanish Champion, winning in 2023 and 2024, and became European Champion in 2024. He has also represented Spain internationally, including at the 2025 World Championships in Miami.",
    ],
  },
  {
    slug: "tom-protzek",
    name: "Tom Protzek",
    country: "Germany",
    countryCode: "DEU",
    age: 25,
    divisions: [...MS, ...MD, ...XD],
    sponsors: [],
    portrait: P("tom-protzek"),
    tagline: "Took world No. 1 Federico Staksrud to three sets in his second tournament",
    bio: [
      "Tom Protzek moved from a Division I soccer career at the University of Tulsa to professional pickleball, making his PPA debut in November 2024. In only his second tournament he reached the round of 16 in singles and pushed world No. 1 Federico Staksrud to three sets.",
      "He has continued to prove himself on tour since, earning main-draw wins across multiple events including a round-of-16 run after a standout victory over Michael Loyd.",
    ],
  },
  {
    slug: "giovanna-mandon",
    name: "Giovanna Mandon",
    country: "Spain",
    countryCode: "ESP",
    age: 34,
    divisions: [...WS, ...WD, ...XD],
    sponsors: [],
    portrait: P("giovanna-mandon"),
    tagline: "Argentine, Spanish and Italian — an international game in every sense",
    bio: [
      "Giovanna Mandon is a competitive pickleball player with Argentine, Spanish and Italian nationality, and brings an international perspective to her career in the sport. She is focused on developing her game and competing at increasingly higher levels.",
      "Beyond competition she is building her presence in the pickleball community and connecting with fellow athletes and brands.",
    ],
  },
];

export function getEuroPro(slug: string): EuroPro | undefined {
  return europeRoster.find((p) => p.slug === slug);
}
