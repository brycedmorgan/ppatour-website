import type { Metadata } from "next";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { ExplainerVideos } from "@/components/video/ExplainerVideos";
import { EXPLAINER_SERIES, HOW_IT_WORKS_VIDEOS } from "@/lib/explainer-videos";

/**
 * How Pro Pickleball Works.
 *
 * ⚠ SOURCE OF TRUTH: Jeff Watson's "How Pro Pickleball Works" doc, shared to
 * #ppa-website-crew 8/3. Every comment thread on it is RESOLVED, including
 * Connor Pardoe's — so the numbers here are approved, not drafted. Two of his
 * rulings are baked in below: show only the Gold contract prize grid ("Id only
 * show gold here"), and there is no third-place match ("we are just getting rid
 * of the 3rd, both teams get paid for 4th").
 *
 * The page this replaced was materially wrong: it listed only two Majors, called
 * the PPA Finals a "bonus" rather than a 2,000-point event, said "the majors pay
 * double" when Worlds is 3,000, and had nothing at all on contracts, the WPR
 * weighting, Current Seed, draws or byes. Don't reintroduce any of that.
 *
 * ⚠ The URL stays /about/how-it-works. It's linked from the header, the footer,
 * /about, /rankings, the homepage, /about/history, the sitemap and site search.
 */

export const metadata: Metadata = {
  title: "How Pro Pickleball Works",
  description:
    "A fan's guide to professional pickleball — who counts as a pro, how the World Pickleball Ranking works, how draws, seeds and byes are set, and how points and prize money are paid.",
};

/* ------------------------------------------------------------------ *
 * Reference tables. Values are Jeff's doc verbatim.
 * Cross-checked against TIER_META in lib/placeholder-data.ts — Worlds
 * 3,000 / Majors 2,000 / Cups 1,500 / Opens 1,000 — so the page and the
 * event data agree. Max-draw sizes are new data the codebase didn't hold.
 * ------------------------------------------------------------------ */

const EVENT_TYPES = [
  { type: "Worlds (Pickleball World Championships)", points: "3,000", draw: "64" },
  { type: "PPA Finals", points: "2,000", draw: "8" },
  { type: "Majors (the other three)", points: "2,000", draw: "64" },
  { type: "Cups", points: "1,500", draw: "56" },
  { type: "Opens", points: "1,000", draw: "44" },
  { type: "Challengers & select internationals", points: "125–500", draw: "Varies" },
];

const POINTS_BY_ROUND = [
  { tier: "PPA Worlds — 3,000", champion: "3,000", finalist: "2,400", semis: "1,500", quarters: "600" },
  { tier: "PPA 2,000 (the other three Majors)", champion: "2,000", finalist: "1,600", semis: "1,000", quarters: "400" },
  { tier: "PPA 1,500 (Cups)", champion: "1,500", finalist: "1,200", semis: "750", quarters: "300" },
  { tier: "PPA 1,000 (Opens)", champion: "1,000", finalist: "800", semis: "500", quarters: "200" },
];

const FINALS_POINTS = [
  { label: "0–3 in round robin", value: "200" },
  { label: "Per round-robin win", value: "300" },
  { label: "Semifinal win", value: "+400" },
  { label: "Champion", value: "+700" },
];

/**
 * ⚠ Gold-contract prize money, published deliberately. Connor's only note on
 * this section was to hide the NON-Gold tiers, so Gold is the approved public
 * view. These are real dollar figures — change them only against a new doc.
 */
const PRIZE_DIVISIONS = [
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
  "Men's Singles",
  "Women's Singles",
];

const PRIZE_ROWS = [
  { round: "Winner", cells: ["$90,000", "$90,000", "$76,000", "$23,000", "$23,000"] },
  { round: "Second place", cells: ["$50,000", "$50,000", "$42,000", "$12,000", "$12,000"] },
  { round: "Semifinals", cells: ["$24,000", "$24,000", "$20,000", "$6,000", "$6,000"] },
  { round: "Quarterfinals", cells: ["$12,000", "$12,000", "$10,000", "$3,000", "$3,000"] },
  { round: "Round of 16", cells: ["$6,000", "$6,000", "$4,000", "$1,000", "$1,000"] },
  { round: "Round of 32", cells: ["$1,500", "$1,500", "$1,000", "$325", "$325"] },
];

const CONTRACT_ROUTES = [
  {
    n: "01",
    title: "Crack the Top 50",
    body: "Break into the Top 50 of the World Pickleball Ranking.",
  },
  {
    n: "02",
    title: "Win the Challenger Tour",
    body: "Finish at the top of the PPA Challenger Tour.",
  },
  {
    n: "03",
    title: "Earn a recommendation",
    body: "Get recommended by an MLP team or a committee member, then approved by the UPA Standards Committee.",
  },
];

const CONTRACT_LEVELS = [
  {
    name: "Gold",
    body: "The top contract level. Prize money is the main thing that separates the three.",
  },
  {
    name: "Standard",
    body: "A Futures player who climbs into the Top 25 of the World Pickleball Ranking moves up to Standard.",
  },
  {
    name: "Futures",
    body: "Where every new signing starts. Re-evaluated after 12 months.",
  },
];

const BYES = [
  { tier: "Majors", draw: "64-spot draw", rule: "No byes when the draw is full — everyone plays." },
  { tier: "Cups", draw: "56-spot draw", rule: "The top 8 by WPR get a bye into the Round of 32." },
  { tier: "Opens", draw: "44-spot draw", rule: "The top 4 get a bye into the Round of 16; ranks 5–8 get a bye into the Round of 32." },
];

const SECTIONS = [
  { id: "who-is-a-pro", label: "Who Is a Pro" },
  { id: "rankings", label: "Rankings & Seeding" },
  { id: "tournaments", label: "Tournaments & Draws" },
  { id: "points-and-money", label: "Points & Prize Money" },
];

/** Shared section heading — eyebrow + H2, the house pattern. */
function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 bg-ppa-blue" />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
          {eyebrow}
        </p>
      </div>
      <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
        {title}
      </h2>
    </>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              How It Works
            </p>
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            How Pro Pickleball Works
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/60">
            A fan&apos;s guide to the players, the rankings, the tournaments, and
            the money behind professional pickleball.
          </p>

          {/* Jump links. `min-w-0` on the wrapper so long labels can't widen
              the page at 390px — the Next on Tour grid taught us that one. */}
          <nav aria-label="On this page" className="mt-6 flex min-w-0 flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="border border-ppa-line bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
              >
                {s.label}
              </a>
            ))}
            {/* The videos sit at the foot of a long page, so without this the
                only way to reach them is to scroll the whole explainer.

                Filled rather than a fifth outline pill, and kept OUT of
                SECTIONS: those four are the page's sections, this is a jump to
                media of a different kind. Matching the pills exactly would bury
                it as "another heading" — the whole ask was quick access. Same
                box model as the pills so the row still lines up. */}
            <a
              href="#watch"
              className="inline-flex items-center gap-1.5 border border-ppa-blue bg-ppa-blue px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-ppa-blue-deep hover:bg-ppa-blue-deep"
            >
              <svg viewBox="0 0 24 24" className="size-2.5" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch the Videos
            </a>
          </nav>
        </div>
      </section>

      {/* ------------------------------------------------ 01 Who is a pro */}
      <section id="who-is-a-pro" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="The Players" title="Who Is a Pro Pickleball Player?" />

          <div className="mt-5 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div className="min-w-0 space-y-4 text-sm leading-relaxed text-ppa-navy/70">
              <p>
                On the PPA Tour, being a &ldquo;pro&rdquo; comes down to one
                thing: a contract. Sign an official UPA player contract and you
                become a{" "}
                <strong className="font-semibold text-ppa-navy">
                  Touring Pro
                </strong>{" "}
                — the status that unlocks the main draws at PPA events and a spot
                to play in Major League Pickleball.
              </p>
              <p>
                Not every contract is the same. Touring Pros hold one of three
                levels, and the main difference is how much prize money they can
                earn. A small group of &ldquo;Legacy&rdquo; players are
                grandfathered into original deals signed before the summer of
                2025 and may have a different prize-money structure.
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Three routes to a contract
              </p>
              <ol className="mt-3 grid gap-px border border-ppa-line bg-ppa-line">
                {CONTRACT_ROUTES.map((r) => (
                  <li key={r.n} className="flex min-w-0 gap-3 bg-white p-4">
                    <span className="font-display text-lg leading-none text-ppa-blue">
                      {r.n}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-sm uppercase text-ppa-navy">
                        {r.title}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-ppa-navy/60">
                        {r.body}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Contract levels */}
          <div className="mt-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
              Contract levels
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {CONTRACT_LEVELS.map((c) => (
                <div
                  key={c.name}
                  className="flex min-w-0 flex-col border border-ppa-line bg-ppa-paper p-5"
                >
                  <span className="font-display text-xl uppercase leading-none text-ppa-navy">
                    {c.name}
                  </span>
                  <p className="mt-2 text-xs leading-relaxed text-ppa-navy/60">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Everyone else */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 border-l-2 border-ppa-blue bg-ppa-paper p-5">
              <h3 className="font-display text-base uppercase text-ppa-navy">
                Non-Contracted Players
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                Talented players who haven&apos;t earned a Touring Pro contract
                yet. They can still compete in smaller events and qualify for
                bigger ones when spots open up. This is where the climb begins:
                chase points, stack wins, earn the contract everyone wants.
              </p>
            </div>
            <div className="min-w-0 border-l-2 border-ppa-navy/25 bg-ppa-paper p-5">
              <h3 className="font-display text-base uppercase text-ppa-navy">
                Ineligible Touring Players
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                Players who were offered a contract but didn&apos;t sign, whose
                contract expired, or who signed with a competing tour. ITPs sit
                out of the biggest events for at least 12 months, though they can
                still play Challengers and select international stops. To work
                back in, they need to compete in 8 of those smaller events within
                a year and reapply.
              </p>
            </div>
          </div>

          <p className="mt-8 max-w-2xl border-t border-ppa-line pt-5 text-sm leading-relaxed text-ppa-navy/70">
            The bottom line: the path to the top is clear. Show up, win matches,
            climb the rankings, and earn your place among the Touring Pros.
          </p>
        </div>
      </section>

      {/* -------------------------------------------- 02 Rankings/seeding */}
      <section id="rankings" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead
            eyebrow="The Ranking"
            title="World Pickleball Rankings & Current Seed"
          />

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ppa-navy/70">
            Great pickleball players aren&apos;t one-dimensional. The best show
            up and win everywhere — gender doubles, mixed doubles, and singles.
            The World Pickleball Rankings, rolling out for the 2026–27 season,
            are built to reward exactly that: one overall ranking that measures
            who the best all-around players on the planet really are.
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1fr]">
            {/* Weighting */}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                The weighting
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ppa-navy/70">
                Your ranking blends your results across all three disciplines
                over the past 52 weeks — but the three aren&apos;t weighted
                equally.
              </p>
              {/* Single stacked bar: these are parts of ONE composite score, so
                  segment width IS the weight. Same figure and palette as the
                  /rankings hero (8/3) — ppa-blue-deep → ppa-blue → ppa-sky,
                  heaviest darkest. ppa-sky carries a contrast WARN, which is
                  why the labels sit outside the bar rather than inside it. */}
              <div
                className="mt-4 flex h-5 w-full overflow-hidden border border-ppa-line"
                role="img"
                aria-label="Ranking weighting: gender doubles 50 percent, mixed doubles 35 percent, singles 15 percent"
              >
                <span className="h-full bg-ppa-blue-deep" style={{ width: "50%" }} />
                <span className="h-full bg-ppa-blue" style={{ width: "35%" }} />
                <span className="h-full bg-ppa-sky" style={{ width: "15%" }} />
              </div>
              <ul className="mt-3 grid gap-px border border-ppa-line bg-ppa-line">
                {[
                  { label: "Gender doubles", pct: "50%", swatch: "bg-ppa-blue-deep" },
                  { label: "Mixed doubles", pct: "35%", swatch: "bg-ppa-blue" },
                  { label: "Singles", pct: "15%", swatch: "bg-ppa-sky" },
                ].map((w) => (
                  <li
                    key={w.label}
                    className="flex min-w-0 items-center justify-between gap-4 bg-white px-4 py-2.5"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className={`size-2.5 shrink-0 ${w.swatch}`} />
                      <span className="truncate text-sm font-semibold text-ppa-navy">
                        {w.label}
                      </span>
                    </span>
                    <span className="shrink-0 font-display text-lg text-ppa-navy tabular-nums">
                      {w.pct}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Best 14 + mandatory + Finals */}
            <div className="min-w-0 space-y-4 text-sm leading-relaxed text-ppa-navy/70">
              <p>
                Only your{" "}
                <strong className="font-semibold text-ppa-navy">
                  best 14 tournament results
                </strong>{" "}
                in each discipline count, so one bad week won&apos;t sink you.
                The catch: the four biggest events — the Pickleball World
                Championships and the three other PPA Majors — are mandatory and
                always count, no matter the result.
              </p>
              <div className="border-l-2 border-ppa-blue bg-white p-5">
                <h3 className="font-display text-base uppercase text-ppa-navy">
                  The payoff: PPA Finals
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                  At the end of the year the top 8 men and top 8 women in the
                  World Pickleball Ranking qualify, and compete in all three
                  disciplines. Individual champions are crowned in each, plus one
                  overall male and female PPA Finals Champion on total points.
                </p>
              </div>
            </div>
          </div>

          {/* WPR vs Current Seed — Jeff flags this as the #1 fan confusion. */}
          <div className="mt-10 border border-ppa-line bg-white p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
              The one that trips up new fans
            </p>
            <h3 className="mt-2 font-display text-xl uppercase leading-tight text-ppa-navy">
              Two numbers, two jobs
            </h3>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="font-display text-sm uppercase text-ppa-blue">
                  World Pickleball Ranking
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ppa-navy/65">
                  The big-picture number across all three disciplines. Decides
                  who gets into events and who earns byes.
                </p>
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm uppercase text-ppa-blue">
                  Current Seed
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ppa-navy/65">
                  A separate, discipline-by-discipline number — your best 14
                  results in <em>just</em> singles, <em>just</em> mixed, or{" "}
                  <em>just</em>{" "}gender doubles. Used to seed each individual
                  event so matchups stay fair. In doubles and mixed, a
                  team&apos;s two rankings are combined.
                </p>
              </div>
            </div>
            <p className="mt-5 border-t border-ppa-line pt-4 text-sm leading-relaxed text-ppa-navy/70">
              <span className="font-semibold text-ppa-navy">For instance:</span>{" "}
              a player could reach the championship match every week in
              men&apos;s singles but struggle to make deep runs in doubles and
              mixed. He&apos;d be seeded highly in men&apos;s singles draws on
              his Current Seed, but sit in the teens in the World Pickleball
              Ranking — below players with better success across all three.
            </p>
            <Link
              href="/rankings"
              className="mt-5 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
            >
              See the World Pickleball Rankings →
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------- 03 Tournaments/draws */}
      <section id="tournaments" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead
            eyebrow="The Tournaments"
            title="Event Types, Eligibility, Draws & Byes"
          />

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ppa-navy/70">
            Every PPA event in the world — from Challengers to international
            stops across Asia, Europe and Australia, to the biggest Majors in the
            U.S. — feeds into the same unified ranking system. No matter where
            you play, your points count. Events are sized by how many points are
            on the line.
          </p>

          {/* Wide table: own horizontal scroll container so the page body
              never scrolls sideways at 390px. */}
          <div className="mt-6 overflow-x-auto border border-ppa-line">
            <table className="w-full min-w-136 border-collapse text-left">
              <caption className="sr-only">
                PPA event types, ranking points, and maximum main-draw spots
              </caption>
              <thead>
                <tr className="bg-ppa-paper text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                  <th scope="col" className="px-4 py-2.5 font-bold">Event type</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold">Points</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold">Max main draw</th>
                </tr>
              </thead>
              <tbody>
                {EVENT_TYPES.map((e) => (
                  <tr key={e.type} className="border-t border-ppa-line">
                    <th
                      scope="row"
                      className="px-4 py-3 font-display text-sm font-normal uppercase tracking-wide text-ppa-navy"
                    >
                      {e.type}
                    </th>
                    <td className="px-4 py-3 text-right font-display text-lg text-ppa-blue tabular-nums">
                      {e.points}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-ppa-navy/60 tabular-nums">
                      {e.draw}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Who gets in */}
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <div className="min-w-0 border border-ppa-line bg-ppa-paper p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                1,000 points and up
              </p>
              <h3 className="mt-2 font-display text-lg uppercase text-ppa-navy">
                Touring Pros take center stage
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                Main-draw spots go first to teams of two contracted pros, then to
                teams with one contracted pro, and finally — if room remains — to
                non-contracted players by World Pickleball Ranking. Anyone who
                misses out can play their way in through a qualifier. Singles
                follows the same priority.
              </p>
            </div>
            <div className="min-w-0 border border-ppa-line bg-ppa-paper p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Under 1,000 points
              </p>
              <h3 className="mt-2 font-display text-lg uppercase text-ppa-navy">
                The spotlight shifts to up-and-comers
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                Mainly for contracted players outside the WPR Top 20,
                non-contracted players, and ITPs. The tour&apos;s biggest stars
                generally sit these out unless they take one of a limited number
                of wild cards. It keeps smaller events fresh and gives rising
                players a real stage.
              </p>
            </div>
          </div>

          {/* Draws, seeds, byes */}
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="min-w-0">
              <h3 className="font-display text-lg uppercase text-ppa-navy">
                How the draw is built
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                Once the entry list is set, the draw is built with specialized
                software to keep it fair and random — with a player
                representative, a tournament representative and a PPA staff
                member present to oversee it. Players are placed according to
                their <strong className="font-semibold text-ppa-navy">Current Seed</strong>,
                with top seeds spread across the bracket in seeding blocks and
                everyone else randomized, so the best players don&apos;t collide
                too early.
              </p>
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg uppercase text-ppa-navy">
                How byes are earned
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                A bye — a free pass through the first, sometimes second round —
                is awarded on the overall{" "}
                <strong className="font-semibold text-ppa-navy">
                  World Pickleball Ranking
                </strong>
                , not the Current Seed. It rewards the players who&apos;ve been
                best all season across all three disciplines.
              </p>
              <ul className="mt-4 grid gap-px border border-ppa-line bg-ppa-line">
                {BYES.map((b) => (
                  <li key={b.tier} className="min-w-0 bg-white p-4">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-display text-sm uppercase text-ppa-navy">
                        {b.tier}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-ppa-navy/45">
                        {b.draw}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-ppa-navy/60">
                      {b.rule}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 2026-27 format changes */}
          <div className="mt-10 border-l-2 border-ppa-yellow bg-ppa-paper p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
              New for 2026–27
            </p>
            <h3 className="mt-2 font-display text-lg uppercase text-ppa-navy">
              What changes on court
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ppa-navy/70">
              <li className="flex min-w-0 gap-2.5">
                <span className="mt-2 size-1.5 shrink-0 bg-ppa-blue" />
                <span>
                  Every match apart from doubles and mixed doubles gold medal
                  matches at Majors and the PPA Finals is{" "}
                  <strong className="font-semibold text-ppa-navy">best 2 of 3 games</strong>.
                </span>
              </li>
              <li className="flex min-w-0 gap-2.5">
                <span className="mt-2 size-1.5 shrink-0 bg-ppa-blue" />
                <span>
                  There are{" "}
                  <strong className="font-semibold text-ppa-navy">
                    no bronze-medal matches
                  </strong>{" "}
                  at events worth 1,000 points or more — both losing semifinalists
                  are paid for fourth.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------ 04 Points/prize money */}
      <section id="points-and-money" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="The Rewards" title="Points & Prize Money" />

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ppa-navy/70">
            The deeper you go in a bracket and the bigger the event, the more
            ranking points you earn. Winning a top-tier event pays its full point
            value, with the runner-up and every earlier round taking a share.
          </p>

          <div className="mt-6 overflow-x-auto border border-ppa-line">
            <table className="w-full min-w-152 border-collapse text-left">
              <caption className="sr-only">
                Ranking points awarded by event tier and finishing round
              </caption>
              <thead>
                <tr className="bg-white text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                  <th scope="col" className="px-4 py-2.5 font-bold">Event tier</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold">Champion</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold">Finalist</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold">Semifinals</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold">Quarterfinals</th>
                </tr>
              </thead>
              <tbody>
                {POINTS_BY_ROUND.map((p) => (
                  <tr key={p.tier} className="border-t border-ppa-line bg-white">
                    <th
                      scope="row"
                      className="px-4 py-3 font-display text-sm font-normal uppercase tracking-wide text-ppa-navy"
                    >
                      {p.tier}
                    </th>
                    <td className="px-4 py-3 text-right font-display text-base text-ppa-blue tabular-nums">
                      {p.champion}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-ppa-navy/70 tabular-nums">
                      {p.finalist}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-ppa-navy/70 tabular-nums">
                      {p.semis}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-ppa-navy/70 tabular-nums">
                      {p.quarters}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PPA Finals scoring */}
          <div className="mt-8 border border-ppa-line bg-white p-6">
            <h3 className="font-display text-lg uppercase text-ppa-navy">
              PPA Finals scoring
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ppa-navy/65">
              The Finals run a round robin into knockout semifinals, so points
              accumulate rather than being awarded for one finishing position.
            </p>
            <ul className="mt-4 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2 lg:grid-cols-4">
              {FINALS_POINTS.map((f) => (
                <li key={f.label} className="min-w-0 bg-white p-4">
                  <span className="block font-display text-2xl leading-none text-ppa-blue tabular-nums">
                    {f.value}
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-ppa-navy/60">
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-ppa-navy/70">
              So an undefeated PPA Finals champion earns the full 2,000 — 900 for
              three round-robin wins, 400 for reaching the final, and 700 for
              winning it.
            </p>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ppa-navy/70">
            Smaller Challenger events — 500, 250 and 125 points — work the same
            way on a smaller scale. Every result adds to your best-14 total.
          </p>

          {/* Money */}
          <div className="mt-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
              The money
            </p>
            <h3 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy">
              More Than $30M a Year to Its Athletes
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ppa-navy/70">
              Prize money scales with the size and prestige of the tournament.
              Here&apos;s what a Major — a 2,000-point event or above — pays a
              player on a Gold contract.
            </p>

            <div className="mt-5 overflow-x-auto border border-ppa-line">
              <table className="w-full min-w-176 border-collapse text-left">
                <caption className="sr-only">
                  Gold-contract prize money at Majors and Worlds, by finishing
                  round and division
                </caption>
                <thead>
                  <tr className="bg-ppa-navy text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
                    <th scope="col" className="px-4 py-3 font-bold">
                      PPA 2,000+ (Majors &amp; Worlds)
                    </th>
                    {PRIZE_DIVISIONS.map((d) => (
                      <th key={d} scope="col" className="px-4 py-3 text-right font-bold">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PRIZE_ROWS.map((r) => (
                    <tr key={r.round} className="border-t border-ppa-line bg-white">
                      <th
                        scope="row"
                        className="whitespace-nowrap px-4 py-3 font-display text-sm font-normal uppercase tracking-wide text-ppa-navy"
                      >
                        {r.round}
                      </th>
                      {r.cells.map((c, i) => (
                        <td
                          key={PRIZE_DIVISIONS[i]}
                          className="px-4 py-3 text-right text-sm text-ppa-navy/75 tabular-nums"
                        >
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- Closing line */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="max-w-3xl border-l-2 border-ppa-blue pl-5 font-display text-lg uppercase leading-snug text-ppa-navy sm:text-xl">
            Earn a contract, climb one unified ranking across all three
            disciplines, and the tournaments, byes, points and prize money all
            follow from how well you play. One system, one path to the top.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------- The video series */}
      {/* Bottom of the page (his call, 8/5), as the last content block before
          the CTAs and the email capture — so it closes the explainer rather
          than delaying it.

          Paper, and using the page's own SectionHead, so it sits in the same
          white/paper alternation as the four sections above it (…points-and-money
          paper → closing line white → this paper → navy CTAs) instead of
          introducing a surface of its own.

          ⚠ `id="watch"` IS LOAD-BEARING — the filled "Watch the Videos" button
          in the hero jump nav targets it, which is the only quick way to reach
          the foot of a page this long. Renaming the id silently breaks that
          button into a no-op scroll. It stays out of the SECTIONS array on
          purpose (those four are the explainer's own sections; this is a coda),
          so the button is hand-written up there rather than mapped. */}
      <section id="watch" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow={EXPLAINER_SERIES} title="Watch: The Tour Explained" />
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/60">
            Four short videos covering everything on this page — the contracts,
            the World Pickleball Rankings, the calendar and the points.
          </p>
          <div className="mt-6">
            <ExplainerVideos videos={HOW_IT_WORKS_VIDEOS} />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- CTAs */}
      <section className="bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/watch"
              className="group flex min-w-0 flex-col border border-white/15 bg-ppa-navy-deep p-6 transition-colors hover:bg-ppa-navy-soft"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-sky">
                For Fans
              </p>
              <p className="mt-2 font-display text-2xl uppercase leading-[1.02]">
                Watch a Match
              </p>
              <p className="mt-1 text-sm text-white/65">
                Live streams, brackets, broadcast schedule.
              </p>
              <span className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-white group-hover:text-ppa-yellow">
                Enter →
              </span>
            </Link>
            <Link
              href="/play"
              className="group flex min-w-0 flex-col border border-white/15 bg-ppa-navy-deep p-6 transition-colors hover:bg-ppa-navy-soft"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-sky">
                For Players
              </p>
              <p className="mt-2 font-display text-2xl uppercase leading-[1.02]">
                Compete at a Stop
              </p>
              <p className="mt-1 text-sm text-white/65">
                Amateur brackets run at every event.
              </p>
              <span className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-white group-hover:text-ppa-yellow">
                Enter →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Email */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="fan" />
        </div>
      </section>
    </>
  );
}
