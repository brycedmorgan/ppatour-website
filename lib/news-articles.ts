/**
 * PPA Tour newsroom — full articles behind every headline. Demo editorial:
 * original copy grounded in the site's own season data (roster, rankings,
 * calendar, purses, broadcast). No direct quotes are attributed to real
 * players. Swap for Sanity CMS when the content pipeline lands.
 */

export type NewsArticle = {
  slug: string;
  category: string;
  title: string;
  /** Display date, e.g. "May 17" (2026). */
  date: string;
  dek: string;
  image: string;
  whyItMatters: string;
  /** Ties coverage to a tour stop — event pages render these under "Coverage". */
  eventSlug?: string;
  /** Featured athletes (slugs) — merged with auto-detected name mentions. */
  players?: string[];
  body: string[];
};

export const newsArticles: NewsArticle[] = [
  {
    slug: "vegas-final-five-stats",
    players: ["ben-johns", "jw-johnson", "federico-staksrud"],
    eventSlug: "rate-las-vegas-open",
    category: "Recap",
    title: "Championship Sunday: Five Stats That Defined the Vegas Final",
    date: "May 17",
    dek: "A five-game men's doubles final at the Darling Tennis Center came down to four points of separation. The numbers tell the story better than the scoreline.",
    image: "/ppa/action-md-final.jpg",
    whyItMatters:
      "The Vegas result cut the gap at the top of the men's doubles race to 340 points — one weekend's swing.",
    body: [
      "Start with the fourth game: 22 consecutive points played at the kitchen line, the longest sustained dink battle recorded on tour this season. The team that lost that game won the war of attrition everywhere else, forcing 31 unforced errors across the match while committing just 19.",
      "Second: speed-up efficiency. The winners converted 68% of their speed-ups into won points, well above the 54% tour average on Championship Court. When the final tightened late, they kept pulling the trigger — and kept landing it.",
      "Third: first-serve depth. Serve depth past the transition zone jumped from 61% through the first two games to 84% over the last three, and return errors followed. It's the quietest stat in pickleball and it decided the loudest match of the weekend.",
      "Fourth: the crowd factor was real. Saturday-to-Sunday attendance grew for a fourth straight event, and the decibel readings on the final's last three points were the highest measured at a Vegas stop.",
      "Fifth, and the one that matters for the season: ranking points. The winners banked 800 toward the race; the runners-up 640. With Atlanta's 1,000-point draw next, the top of the men's doubles table is effectively a coin flip.",
    ],
  },
  {
    slug: "atlanta-draw-decoded",
    players: ["ben-johns", "anna-leigh-waters"],
    eventSlug: "atlanta-pickleball-championships",
    category: "Analysis",
    title: "The Atlanta Draw, Decoded: Where the Bracket Breaks",
    date: "May 16",
    dek: "The Veolia Atlanta Championships bracket dropped Friday. Three quarters play to form. One is a minefield.",
    image: "/ppa/action-masters.jpg",
    whyItMatters:
      "Atlanta is the last 1,000-point stop before the Finals cutoff — a bad quarter here ends seasons.",
    body: [
      "The top quarter is chalk: the No. 1 seeds in every division landed the friendliest path, with no projected top-eight opponent before the semifinals. Expect form to hold.",
      "The second quarter is where brackets go to die. Two top-five doubles teams were drawn into the same round of 16, a consequence of the 52-week points window catching one team's late-season surge. Somebody elite goes home Thursday.",
      "In singles, watch the qualifier line. The Pro Qualifier Draw feeds directly into the main draw's third quarter, and the qualifying field in Atlanta is the deepest of the spring — three players with main-draw wins this season have to play their way in on Monday.",
      "The bottom quarter is a rematch factory. If seeds hold for two rounds, Friday's quarterfinals reproduce the Vegas final in men's doubles and the Chicago semifinal in mixed — matches that went the distance three weeks ago.",
      "The stakes stack on top of the seeding math: 1,000 points to every division champion, a $1,063,327 event payout in prize money and appearance fees, and the final reseeding before Nationals locks its draw.",
    ],
  },
  {
    slug: "rookie-class-rankings",
    category: "Feature",
    title: "Inside the Rookie Class Rewriting the Rankings",
    date: "May 14",
    dek: "First-year pros are supposed to spend a season learning the tour. This class skipped the tutorial.",
    image: "/ppa/action-singles.jpg",
    whyItMatters:
      "Three rookies now sit inside the top 15 of a race that used to take two seasons to crack.",
    body: [
      "The pattern used to be predictable: a rookie's first PPA season was about surviving Tuesday and Wednesday rounds, banking round-of-32 points, and building a 52-week base to work from. This year's class tore that script up by April.",
      "The catalyst is the qualifier pipeline. With every tournament running an open Pro Qualifier Draw, the gap between 'promising amateur' and 'main-draw regular' has collapsed to a single hot Monday. Two of this season's breakout rookies entered their first events through qualifying.",
      "The data shows why they stick once they arrive: the rookie class wins short rallies. On points of four shots or fewer — serve, return, third, fourth — first-year pros are outscoring tour veterans, a product of a generation that grew up drilling speed-ups rather than converting from tennis.",
      "Veterans still own the long game. Rallies past nine shots skew heavily to experience, which is why the learning curve now happens inside matches rather than across seasons: rookies steal the fast points, veterans teach them the slow ones.",
      "The race table tells the rest. With Atlanta and Nationals both paying four figures to deep runs, at least one member of this class is projected to reach the PPA Finals in San Clemente — a first-year feat the tour has never seen.",
    ],
  },
  {
    slug: "race-report-spring-swing",
    players: ["ben-johns", "federico-staksrud", "christian-alshon", "anna-leigh-waters"],
    category: "The Race",
    title: "Race Report: Who Moved After the Spring Swing",
    date: "May 12",
    dek: "Six weeks, four stops, and a new look at the top of every division. The spring swing settled some arguments and started others.",
    image: "/ppa/action-waters-bright.jpg",
    whyItMatters:
      "The Finals field is set by season-end points — every May position swing echoes into December.",
    body: [
      "Men's singles tightened. Ben Johns still leads at 9,840 points, but Federico Staksrud's spring — finals in back-to-back stops — pulled him within 850. Christian Alshon's two-spot jump to No. 3 makes the semifinal seeding at Atlanta genuinely unpredictable for the first time all season.",
      "Women's singles is the opposite story: Anna Leigh Waters extended her lead across all three of her divisions, and the race behind her is now a four-player fight for the No. 2 seed line at Nationals.",
      "The biggest movers were in mixed doubles, where two partnership changes announced in March are now paying off. New pairings need roughly six events to hit peak efficiency, according to the tour's historical data — both new teams are ahead of that curve.",
      "On the bubble: the Finals cutoff at No. 8 is the tightest in tour history. Positions six through ten are separated by fewer points than a single semifinal appearance pays. That's what Atlanta's 1,000-point draw and Nationals' 2,000-point draw are really deciding.",
      "One programming note for race-watchers: rankings update the Monday after each event, and the 52-week window means last summer's results start falling off the table at Nationals — a silent reshuffle that will move players who don't even enter.",
    ],
  },
  {
    slug: "record-25-event-season",
    category: "Tour News",
    title: "PPA Tour Adds Two Stops to a Record 25-Event Season",
    date: "May 9",
    dek: "The 2026–27 calendar grows again: 25+ tournaments, a limited international series, and more than $5.2M in prize money and appearance fees.",
    image: "/ppa/action-champ-sunday.jpg",
    whyItMatters:
      "More stops means more points on the table — and more paths into the top 10 for the chasing pack.",
    body: [
      "The expanded calendar confirms the tour's tier structure at record scale: Worlds (3,000 points), Slams (2,000), Cups (1,500), Opens (1,000), and the Challenger series (125–500) that feeds the pipeline underneath.",
      "The player economics grow with it. The 2026 season carries $5,235,943 in combined prize money and appearance fees — $1,648,641 behind every Slam, $1,271,734 behind every Cup, and $1,063,327 behind every Open.",
      "The marquee dates are set: the Veolia Pickleball National Championships run August 31 – September 6 at Cary Tennis Park, and the PPA World Pickleball Championships land at Brookhaven Country Club in Farmers Branch, Texas, November 3–8, carrying the season's only 3,000-point draw.",
      "Broadcast reach expands alongside the calendar. PickleballTV streams every round of every event, with Tennis Channel simulcasting marquee windows — including every remaining Championship Sunday this season.",
      "For amateurs, every added stop is also a playable one: each tournament runs amateur brackets across ages and skill levels on the same courts, the same week, as the pros.",
    ],
  },
  {
    slug: "hartman-bricker-chicago-upset",
    eventSlug: "veolia-chicago-open",
    category: "Recap",
    title: "Hartman & Bricker Take Down Top Seeds in Chicago",
    date: "May 6",
    dek: "The eighth-seeded pairing walked into Life Time North Shore and walked out with the biggest scalp of the spring.",
    image: "/ppa/action-mxd.jpg",
    whyItMatters:
      "Upsets at 1,000-point stops don't just make highlights — they detonate the seeding math for the next three events.",
    body: [
      "Seeds one and eight aren't supposed to share a court until Sunday. A quarterfinal rain delay compressed Chicago's Friday schedule, the bracket's bottom half played first, and by the time the top seeds took Championship Court, Hartman and Bricker had already spent an hour dialed in on the adjacent grandstand.",
      "The match plan was visible from the first game: refuse the dink rally, speed up everything off the bounce, and live with the errors. It produced the messiest stat line of the weekend — 41 unforced errors against 38 winners — and it worked.",
      "The middle game turned on serve depth. Chicago's indoor conditions reward flat, deep serving, and Hartman's serve found the back thirty inches of the court on 9 of 11 points in the pivotal stretch.",
      "For the top seeds, the loss costs more than a title chance: it snapped a streak of five straight finals at 1,000-point events and handed the chasing pack a 360-point swing at the top of the race.",
      "Hartman and Bricker's reward is a seeding line they've never held — and a projected Atlanta path that avoids every top-four team until the semifinals.",
    ],
  },
  {
    slug: "anand-singles-run",
    eventSlug: "virginia-beach-open",
    category: "Feature",
    title: "Anand's Singles Run Continues Into Virginia Beach",
    date: "May 4",
    dek: "Nine straight main-draw wins, three finals, and a game built on patience in a sport sprinting the other direction.",
    image: "/ppa/action-singles.jpg",
    whyItMatters:
      "A sustained singles streak this deep into a season almost always converts into a top-four Nationals seed.",
    body: [
      "Priya Anand's streak is a stylistic argument. While the tour's singles meta keeps accelerating — bigger serves, earlier speed-ups, shorter points — Anand has won nine straight matches by making opponents play one more ball.",
      "The numbers behind the streak: she leads the tour in rally length among singles players, wins 71% of points that pass the nine-shot mark, and has faced break-equivalent pressure points at the lowest rate in the women's draw, because so few opponents can shorten points against her.",
      "The streak has climbed the rankings the honest way: three finals in five weeks, each at a 1,000-point stop, each paying real race points rather than a single hot weekend's windfall.",
      "Virginia Beach sets up as the test. The Sports Center's indoor courts play fast, the field includes the two players who beat her in finals this spring, and the draw projects a semifinal rematch with the reigning champion.",
      "Stakes aside, the run is doing something quieter: filling grandstand seats for women's singles sessions at a rate the tour hasn't measured before Sunday finals. Patience, it turns out, travels.",
    ],
  },
  {
    slug: "atlanta-court-surface",
    eventSlug: "atlanta-pickleball-championships",
    category: "Analysis",
    title: "How the Atlanta Court Surface Plays",
    date: "May 2",
    dek: "Every stop has a personality. Atlanta's is fast, grippy, and brutally honest about your third shot.",
    image: "/ppa/event-melbourne.jpg",
    whyItMatters:
      "Players who adjust to surface speed in round one historically outperform their seed in Atlanta.",
    body: [
      "Court surface is the tour's invisible variable. The same cushioned acrylic system gets tuned stop to stop — texture, top-coat, sand ratio — and Atlanta's build has tested among the fastest surfaces on the calendar.",
      "Fast courts compress decision time at the kitchen. Atlanta historically produces more speed-up attempts per game than any other outdoor stop, and more counter-attack winners too: offense begets offense when the ball skids.",
      "The honest-third-shot effect is real. Drop shots that float on a slow court die in Atlanta; the surface punishes anything landing short of the kitchen line by a foot. Historically, drive-heavy third-shot players outperform their seed here, and touch players regress.",
      "Georgia heat is the other tuning fork. Afternoon sessions play measurably faster than morning ones as court temperature climbs — a scheduling wrinkle that makes Atlanta one of the few stops where the draw's session times genuinely matter.",
      "The practical read for the weekend: expect shorter points, louder crowds, and at least one touch-game favorite to go home early wondering what happened to their drop.",
    ],
  },
  {
    slug: "safdar-repeat-finals",
    category: "Profile",
    title: "Mehvish Safdar on Repeat Final Appearances",
    date: "Apr 30",
    dek: "Four finals in six events. The most consistent closer on tour isn't the biggest hitter in the draw — and that's the point.",
    image: "/ppa/action-waters-bright.jpg",
    whyItMatters:
      "Consistency is the currency of the 52-week race: finals appearances compound faster than titles.",
    body: [
      "The scouting report on Mehvish Safdar reads like a paradox: below tour average in speed-up velocity, middle of the pack in service aces, and top three in the only stat that pays — finals reached.",
      "The engine is error rate. Safdar's unforced-error count per game is the lowest among top-ten doubles players this season. Across a five-game final, that difference alone is worth roughly a game and a half.",
      "The partnership dynamic does the rest. Safdar plays the stabilizer role — resetting fast points, absorbing pace at the kitchen — which frees an aggressive partner to take the risks. It's a template contending teams keep trying to copy.",
      "The 52-week math explains why it matters. Runner-up points at four events out-earn a single title plus three early exits by a wide margin — which is how Safdar sits inside the top five of the race without holding this season's biggest trophy.",
      "The missing line on the résumé is obvious, and Atlanta's draw offers the chance: a projected final against the team that has ended three of those four runs.",
    ],
  },
  {
    slug: "two-game-comeback-strategy",
    category: "Analysis",
    title: "Inside the Strategy Behind a Two-Game Comeback",
    date: "Apr 28",
    dek: "Down 0–2 in a best-of-five, the win probability reads 14%. The teams that beat it all do the same four things.",
    image: "/ppa/action-md-final.jpg",
    whyItMatters:
      "Best-of-five formats make comebacks a repeatable skill — the teams that master them steal seeding all season.",
    body: [
      "The tour's match data is blunt: teams that drop the first two games of a best-of-five win about one match in seven. But the comebacks that do land share a fingerprint.",
      "First, the timeout comes early. Winning comeback teams burn a timeout midway through game two — before the hole is terminal — twice as often as losing ones. The reset happens while the match is still reachable.",
      "Second, the serving order flips. Nearly every successful comeback features a stacking or serving-order change at the start of game three, forcing the leading team to re-solve matchups it had already solved.",
      "Third, the target changes. Comeback teams redirect serves and speed-ups at the opponent who has played fewer balls — the partner who's been hiding. Cold hands crack under new volume.",
      "Fourth, they slow the first four points of every game. A 0–2 hole creates urgency, and urgency produces the exact errors that dug the hole. The teams that climb out play the start of game three like it's 0–0 on Tuesday morning — because mathematically, it is.",
    ],
  },
  {
    slug: "junior-ppa-pipeline",
    category: "Junior",
    title: "The Junior PPA Pipeline: Five Names to Watch",
    date: "Apr 25",
    dek: "The under-19 brackets at every tour stop have quietly become the best scouting room in the sport.",
    image: "/ppa/action-singles.jpg",
    whyItMatters:
      "Every current top-ten rookie came through junior or qualifier brackets — the pipeline is the tour's future ranking table.",
    body: [
      "Junior PPA runs at every main-tour stop — same venue, same weekend as the pros — across U-12 through U-19 brackets in singles, doubles, and mixed. It's a farm system hiding in plain sight.",
      "What scouts watch isn't titles, it's transition speed: how quickly a junior's game translates when they enter the open Pro Qualifier Draw. The five names circled this spring have all taken main-draw pros to a fifth game before their eighteenth birthdays.",
      "The stylistic shift is generational. Junior brackets play faster than the pro tour — more speed-ups, more counters, less third-shot orthodoxy — and each graduating class drags the pro meta a step in that direction.",
      "The pathway is deliberately short: win junior brackets, enter Monday qualifiers, crack a main draw, and the 52-week window starts banking points immediately. The tour's youngest main-draw winner this season did all four inside eight months.",
      "For families weighing the jump, the practical note: junior registration runs through the same per-division entry as the amateur brackets, and top-ranked juniors qualify for the season-end Junior Nationals.",
    ],
  },
  {
    slug: "top-10-drop-shots-vegas",
    eventSlug: "rate-las-vegas-open",
    category: "Highlights",
    title: "Top 10 Drop Shots from the Las Vegas Open",
    date: "Apr 23",
    dek: "The lost art had a loud week in the desert. Ten thirds that dropped dead and the points they stole.",
    image: "/ppa/action-champ-sunday.jpg",
    whyItMatters:
      "In a speed-up era, elite drops are the counter-meta — and Vegas showed the counter still wins points.",
    body: [
      "Vegas plays fast, which should kill the drop shot. Instead the week produced the cleanest collection of thirds all season — because when everyone leans on the drive, the drop lands on players sprinting the wrong direction.",
      "The countdown's top entries share a shape: contact out of the air before the bounce, trajectory peaking on the hitter's own side, and a landing inside the kitchen's front half. Nothing floaty survived the desert air.",
      "The most replayed point of the week was a fourth-game rally where three consecutive drops were answered by three consecutive counter-drops — a sequence that ended with all four players inside the kitchen line and the crowd on its feet before the point resolved.",
      "The stat behind the reel: players who mixed drops onto at least 30% of their third shots in Vegas won their service points at a higher clip than pure drivers, flipping the season-long trend.",
      "Every clip in the countdown is streaming on PickleballTV and the tour's YouTube channel — full match replays included for the rallies that deserve the context.",
    ],
  },
  {
    slug: "2026-rule-changes",
    category: "Tour News",
    title: "What's New in the 2026 Tournament Rules",
    date: "Apr 20",
    dek: "Line-calling replay expands, timeout mechanics tighten, and the paddle testing program grows teeth. What players and fans need to know.",
    image: "/ppa/action-masters.jpg",
    whyItMatters:
      "Rule changes shift results at the margins — and the margins are where the race is decided.",
    body: [
      "The headline change is replay. Electronic line-calling review, previously limited to Championship Court, extends to every streamed court at Slams and Worlds this season, with players carrying a fixed challenge allotment per match.",
      "Timeout mechanics tighten in response to last season's momentum-gaming: timeouts must now be called before the server begins the service motion, ending the between-points hover that had become a tactical stall.",
      "Paddle testing moves from spot-checks to a standing program, with pre-round equipment verification at every main-draw stage and immediate replacement protocols for out-of-spec paddles.",
      "Qualifier integration formalizes too: Pro Qualifier Draw winners now receive guaranteed main-draw scheduling no earlier than the following day, closing the same-day double-header that disadvantaged Monday qualifiers.",
      "For fans, the visible difference is pace: the tour projects the rule set cuts dead time between points by a measurable margin — faster sessions, tighter broadcast windows, and fewer momentum stalls on Sunday afternoons.",
    ],
  },
  {
    slug: "ranking-points-explained",
    category: "Explainer",
    title: "How Ranking Points Are Calculated, Explained",
    date: "Apr 17",
    dek: "The 52-week window, the best-16 rule, and why a quarterfinal in November can matter more than a title in March.",
    image: "/ppa/action-mxd.jpg",
    whyItMatters:
      "The race table is the tour's plot — understanding the points system is understanding the season.",
    body: [
      "The foundation: every tournament pays points by tier — Worlds 3,000 to the champion, Slams 2,000, Cups 1,500, Opens 1,000, Challengers 125–500 — scaling down through runner-up, semifinals, quarters, and each earlier round.",
      "The window: rankings reflect a rolling 52 weeks, counting each player's best 16 events. Nothing is permanent; every result ages off exactly one year after it was earned.",
      "The best-16 rule is the strategic layer. Once a player has 16 counting results, weaker ones get displaced by better ones — which is why late-season quarterfinals can be worth more than they look, silently replacing a round-of-32 result from last fall.",
      "The falloff effect is the season's hidden drama: a player defending last year's title is effectively playing to break even that week, while a player who missed the event entirely plays with house money. Big swings around Nationals happen as much from expiring points as from new ones.",
      "The destination: the eight players and teams with the most points in each division at season's end qualify for the PPA Finals in San Clemente — winner-take-all for the No. 1 ranking.",
    ],
  },
  {
    slug: "day-in-the-life-on-tour",
    category: "Feature",
    title: "Behind the Scenes: A Day in the Life on Tour",
    date: "Apr 14",
    dek: "Gates open at 8. The last ball dies around 10. Eighteen hours inside a tour stop, from the practice courts to the broadcast truck.",
    image: "/ppa/nationals-crowd-stadium.jpg",
    whyItMatters:
      "A tour stop is a traveling production — knowing the rhythm makes attending (or streaming) one better.",
    body: [
      "6:40 AM: the grounds crew squeegees dew off twelve courts while the broadcast truck runs camera checks. Every streamed court gets a full signal test before gates.",
      "8:00 AM: gates open with the amateur brackets. On the same courts the pros will use that evening, hundreds of amateur players across age and skill divisions play out the sport's biggest participation event — the part of a tour stop television never shows.",
      "11:30 AM: the pro practice window. Fans stack three-deep at the practice courts, the best free scouting on the grounds. Warm-up games here are faster and looser than anything in the draw.",
      "2:00 PM: main-draw sessions roll on every court while the vendor village hits capacity between rounds — demo paddles, food row, sponsor activations, and the autograph line that forms an hour before it's scheduled.",
      "7:30 PM: Championship Court's evening session goes live to the night's biggest audience, streaming on PickleballTV. By the time the last medal match ends, the crew is already resurfacing schedules for tomorrow — the whole machine resets in under nine hours.",
    ],
  },
];

export function getArticle(slug: string): NewsArticle | undefined {
  return newsArticles.find((a) => a.slug === slug);
}

/** Coverage attached to a tour stop — the event's editorial history. */
export function getArticlesForEvent(eventSlug: string): NewsArticle[] {
  return newsArticles.filter((a) => a.eventSlug === eventSlug);
}
