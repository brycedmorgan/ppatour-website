import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FeaturedEvents } from "@/components/events/FeaturedEvents";
import { ChallengerRankings } from "@/components/tour/ChallengerRankings";
import { getEvents } from "@/lib/events-api";
import { partners } from "@/lib/home-content";
import { partnerLink } from "@/lib/partner-link";
import { challengerShowdown, showdownDaysFor } from "@/lib/challenger-showdown";
import { type Tournament, eventHref, tierPoints } from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

/**
 * PPA Tour Challenger Series.
 *
 * ⚠ THIS PAGE REPLACES ppachallenger.com (WordPress on Flywheel), folded in
 * 2026-09-18 on Bryce's call. Inventory, redirect map and the reasoning live in
 * docs/CHALLENGER.md. Every fact below is that site's own copy — divisions,
 * the $10k pool, the wild card, the top-20 rule, the 125/250 tables, the
 * 52-week window. Nothing here was invented to fill a section.
 *
 * ⚠ THE SHOWDOWN SECTION IS THE ONE EXCEPTION TO THAT PROVENANCE, and it is a
 * later source rather than a looser one: Brooke Ansley's 9/21 website request,
 * which replaced the old site's stale 2025 description. Its facts live in
 * lib/challenger-showdown.ts because the Worlds event page renders the same
 * days inside its own order of play — read that file's header before editing
 * any of them, especially the dates, which are derived.
 *
 * ⚠ THE SCHEDULE IS THE LIVE FEED, NOT A LIST. `getEvents()` filtered to
 * `tierKey === "challenger"` with no `country` (U.S.). The old site's per-stop
 * points ("250 Points") disagreed with our curated levels on several events;
 * the card badge is the site's single answer, so this page states no per-stop
 * level in prose.
 *
 * ⚠ RANKINGS ARE A DATED SNAPSHOT — see components/tour/ChallengerRankings.tsx.
 *
 * ⚠ SPECIFIC ROUTE, wins over /tour/[slug] like junior and senior; the
 * `challenger` entry in lib/tour-programs.ts feeds nav, sitemap and search only.
 */

const REGISTER = withUtm(
  "https://www.pickleballtournaments.com/search?partner=sanction_ppa_cs",
  { campaign: "challenger", content: "register" },
);

export const metadata: Metadata = {
  title: "PPA Tour Challenger Series",
  description:
    "The PPA Tour Challenger Series, powered by JOOLA — the pathway to the pro tour. Skill divisions 3.0 to 5.0, a Pro Division with ranking points and prize money, the schedule, how points work, rankings and how to host a stop.",
};

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "schedule", label: "Schedule" },
  { id: "how-it-works", label: "How It Works" },
  { id: "points", label: "Points" },
  { id: "path", label: "Path to the Tour" },
  { id: "showdown", label: "Showdown" },
  { id: "rankings", label: "Rankings" },
  { id: "sponsors", label: "Sponsors" },
  { id: "host", label: "Host a Stop" },
];

/** ppachallenger.com/how-it-works, verbatim. Both ladders as published. */
const FINISHES = ["1st", "2nd", "3rd", "4th", "Semifinal", "Quarterfinal", "Round of 16", "Round of 32", "Round of 64"];
const POINTS = [
  { level: "Challenger 125", points: [125, 100, 75, 50, 40, 25, 12, 6, 3] },
  { level: "Challenger 250", points: [250, 200, 150, 100, 80, 50, 24, 12, 6] },
];

const HOW = [
  {
    n: "01",
    title: "Who Can Play",
    body: "Every stop runs skill divisions 3.0 through 5.0 and a Pro Division. PPA Tour pros ranked inside the top 20 of a division are not eligible to enter that division at a Challenger.",
  },
  {
    n: "02",
    title: "What the Pros Play For",
    body: "Each event carries a $10,000 prize pool, split among the Pro Division's podium finishers. Champions in men's and women's singles, men's and women's doubles and mixed doubles earn PPA ranking points.",
  },
  {
    n: "03",
    title: "The Wild Card",
    body: "Win a Challenger pro event and you earn a wild-card entry into the main draw of a PPA Tour Open of your choosing. Each Open takes at most two wild-card winners.",
  },
];

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

/** "Sep 25–27, 2026" from two ISO dates, parsed as local calendar days. */
function dateRange(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const md = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const left = md.format(s);
  const right = sameMonth ? String(e.getDate()) : md.format(e);
  return `${left}–${right}, ${e.getFullYear()}`;
}

/** "Nov 5" from one ISO date, parsed as a local calendar day. */
function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(`${iso}T00:00:00`),
  );
}

/**
 * ⚠ THE TIER ALONE IS NOT THE TEST. `inferTier` in lib/events-api.ts files any
 * sub-three-day or college/qualifier/camp event under `challenger` so it stays
 * off The Tour — so on 9/18 the feed's one-day "Utah Super Regional - College
 * Pickleball Tour" rendered here as a 500-point Challenger stop. A Challenger
 * Series event says "Challenger" in its name (that is how the mapper sets
 * `isChallenger` itself), so the name is required too.
 */
const isUsChallenger = (t: Tournament) =>
  t.tierKey === "challenger" && !t.country && /\bchallenger\b/i.test(t.name);

export const revalidate = 3600;
export const dynamic = "force-static";

export default async function ChallengerPage() {
  const { events } = await getEvents();
  const today = new Date().toISOString().slice(0, 10);
  const challengers = events.filter(isUsChallenger);
  const upcoming = challengers.filter((t) => t.status !== "completed" && t.endDate >= today);
  const past = challengers
    .filter((t) => t.status === "completed" || t.endDate < today)
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
    .slice(0, 18);

  /**
   * The event the Showdown is played inside, from the same feed as the schedule
   * above — so the link goes to a page that exists, or there is no link.
   *
   * ⚠ MATCHED ON THE WINDOW, NOT THE SLUG. Annual editions share a slug here:
   * the feed carries `pickleball-world-championships` for both the completed
   * 2025 edition and this one, and linking the first match would send a player
   * to last year's event page.
   */
  const host = events.find(
    (e) => showdownDaysFor(e.slug, e.startDate, e.endDate).length > 0,
  );
  const hostHref = host ? eventHref(host) : null;
  const showdownDays = challengerShowdown.days;
  const showdownDates = dateRange(
    showdownDays[0].iso,
    showdownDays[showdownDays.length - 1].iso,
  );

  const joola = partners.find((p) => p.name === "JOOLA");
  const joolaLink = joola ? partnerLink(joola).href : null;

  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section className="relative isolate overflow-hidden bg-ppa-navy text-white">
        <Image
          src="/ppa/events/seattle-ppa-challenger.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-25 will-change-transform"
        />
        <div className="absolute inset-0 scrim-hero" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              Pathway to the Pro Tour
            </p>
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-3xl uppercase leading-[1.02] sm:text-5xl">
            PPA Tour Challenger Series
          </h1>
          <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white/70">
            Powered by JOOLA
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            A PPA-run tournament at clubs across the country. Skill divisions 3.0
            to 5.0 for amateurs, and a Pro Division that earns PPA ranking points,
            prize money and a wild card into a PPA Tour Open.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={REGISTER}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-transform hover:bg-ppa-blue-deep active:scale-[0.98]"
            >
              Register to Play ↗
            </a>
            <a
              href="#schedule"
              className="inline-flex h-11 items-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-white"
            >
              See the Schedule
            </a>
          </div>
        </div>
      </section>

      {/* Jump links */}
      <section className="border-b border-ppa-line bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-4">
          <nav aria-label="On this page" className="flex min-w-0 flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="border border-ppa-line bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* --------------------------------------------------------- About */}
      <section id="about" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="About" title="What Is the Challenger Series?" />
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            {/*
              ⚠ THIS IS THE EVENT TEAM'S OWN BOILERPLATE AND IT IS VERBATIM.
              Amie Feliza's website request, 9/22/26 ("this is what the Challenger
              series is about"). It supersedes the two paragraphs that shipped on
              9/18, which were written here from ppachallenger.com's own copy
              because nothing official existed yet. Do not reword it, do not
              re-split the sentences, and do not fold the fact list beside it into
              the prose — this is the paragraph marketing sends to press.

              ⚠ ONE SENTENCE OF HERS IS DELIBERATELY NOT HERE, and it is the only
              omission: "For more information, go to www.ppachallenger.com and
              follow us on social: Instagram, Twitter/X, YouTube, and Facebook."
              That is a press-release tail, and on this page both halves of it
              fail. ppachallenger.com has 308'd to THIS PAGE since 9/21, so the
              pointer is a circle; and the four platforms are named with no
              handles, which cannot be linked without guessing — they are not even
              derivable from each other (Instagram is @ppa.challenger WITH a dot,
              X is @ppachallenger without). Amie has been asked for the four URLs;
              they land as a Stay Connected row, the Junior PPA shape, and never
              as a guess.

              ⚠ "Showdown in Dallas" LINKS to this page's own #showdown section
              rather than repeating any of it. Her phrase and Brooke Ansley's 9/21
              data agree: the Showdown is played inside Worlds at Brookhaven
              Country Club, Farmers Branch TX, which is Dallas metro. That is
              corroboration from a second source, not a fact typed twice.
            */}
            <div className="min-w-0 border-l-2 border-ppa-blue bg-white p-6">
              <p className="text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                Founded in 2025, the PPA Challenger Series is a grassroots tour
                designed to provide aspiring pickleball professionals a pathway to
                the PPA Tour, the pinnacle tour of global pickleball.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                The PPA Challenger Rankings award players points based on their
                results at PPA Challenger tournaments, and top finishers will earn
                their spot in the{" "}
                <Link
                  href="#showdown"
                  className="font-semibold text-ppa-blue underline-offset-2 hover:underline"
                >
                  &ldquo;PPA Challenger Showdown in Dallas,&rdquo;
                </Link>{" "}
                where players will battle for a PPA Tour contract.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                With a deep commitment to fostering growth and development within
                the pickleball community, the PPA Challenger Series nurtures
                emerging talent, encourages participation, and ultimately elevates
                the sport at all levels.
              </p>
            </div>
            <ul className="grid gap-px border border-ppa-line bg-ppa-line">
              {[
                { label: "Who", value: "Skill 3.0–5.0, plus a Pro Division" },
                { label: "Pro prize pool", value: "$10,000 per event" },
                { label: "Points", value: "125 or 250 to the champion" },
                { label: "Wild card", value: "Into a PPA Tour Open main draw" },
              ].map((row) => (
                <li key={row.label} className="min-w-0 bg-white p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                    {row.label}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-ppa-navy">
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Schedule */}
      <section id="schedule" className="scroll-mt-24">
        {upcoming.length > 0 ? (
          <FeaturedEvents
            events={upcoming}
            kicker="Schedule"
            title="Upcoming Challenger Stops"
            subtitle="Every U.S. Challenger, from the same live feed that runs the tour calendar. The points level is on each card. Register on pickleballtournaments.com."
          />
        ) : (
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <SectionHead eyebrow="Schedule" title="Upcoming Challenger Stops" />
            <p className="mt-6 border border-ppa-line bg-ppa-paper px-4 py-10 text-center text-sm text-ppa-navy/55">
              The next Challenger Series calendar is being confirmed. New stops
              appear here as soon as registration opens.
            </p>
          </div>
        )}

        {past.length > 0 && (
          <div className="mx-auto w-full max-w-6xl px-4 pb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
              Past Tournaments
            </p>
            <div className="mt-3 overflow-x-auto border border-ppa-line">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="bg-ppa-paper text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                    <th scope="col" className="px-4 py-2.5 font-bold">Dates</th>
                    <th scope="col" className="px-4 py-2.5 font-bold">Event</th>
                    <th scope="col" className="px-4 py-2.5 font-bold">City</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-bold">Points</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-bold">Results</th>
                  </tr>
                </thead>
                <tbody>
                  {past.map((t) => (
                    <tr key={`${t.startDate}-${t.slug}`} className="border-t border-ppa-line bg-white text-sm">
                      <td className="whitespace-nowrap px-4 py-2.5 text-ppa-navy/60 tabular-nums">
                        {dateRange(t.startDate, t.endDate)}
                      </td>
                      <th scope="row" className="px-4 py-2.5 font-semibold text-ppa-navy">
                        {t.name}
                      </th>
                      <td className="px-4 py-2.5 text-ppa-navy/60">
                        {t.city}
                        {t.state ? `, ${t.state}` : ""}
                      </td>
                      <td className="px-4 py-2.5 text-right text-ppa-navy/70 tabular-nums">
                        {tierPoints(t).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {t.externalUrl ? (
                          <a
                            href={withUtm(t.externalUrl, { campaign: "challenger", content: "past-results" })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
                          >
                            Results ↗
                          </a>
                        ) : (
                          <span className="text-xs text-ppa-navy/35">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------- How it works */}
      <section id="how-it-works" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="How It Works" title="Divisions, Prize Money and the Wild Card" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {HOW.map((s) => (
              <div key={s.n} className="flex flex-col border border-ppa-line bg-white p-5">
                <span className="font-display text-3xl leading-none text-ppa-blue">{s.n}</span>
                <h3 className="mt-3 font-display text-lg uppercase leading-[1.1] text-ppa-navy">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ppa-navy/60">{s.body}</p>
              </div>
            ))}
          </div>
          <a
            href={REGISTER}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-transform hover:bg-ppa-blue-deep active:scale-[0.98]"
          >
            Register to Play ↗
          </a>
        </div>
      </section>

      {/* -------------------------------------------------------- Points */}
      <section id="points" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Points" title="How Challenger Points Work" />
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/60">
            Each Challenger awards 125 or 250 points to the champion, and points go
            deeper into the draw at both levels. Every stop&apos;s level is on its
            card in the schedule above.
          </p>
          <div className="mt-6 overflow-x-auto border border-ppa-line">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="bg-white text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                  <th className="border-b border-ppa-line px-4 py-2.5">Level</th>
                  {FINISHES.map((f) => (
                    <th key={f} className="border-b border-ppa-line px-4 py-2.5">
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {POINTS.map((row) => (
                  <tr key={row.level} className="bg-white text-sm">
                    <td className="whitespace-nowrap border-b border-ppa-line bg-ppa-paper px-4 py-3 font-display text-sm uppercase text-ppa-blue">
                      {row.level}
                    </td>
                    {row.points.map((p, i) => (
                      <td
                        key={FINISHES[i]}
                        className="border-b border-ppa-line px-4 py-3 font-semibold text-ppa-navy"
                      >
                        {p.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="min-w-0 border-l-2 border-ppa-blue bg-ppa-paper p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                Rankings window
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ppa-navy/70">
                The Challenger rankings update after every event. They count
                points from the past 52 weeks and from the current calendar year.
                A player&apos;s best 16 finishes count toward the leaderboard.
              </p>
            </div>
            <div className="min-w-0 border-l-2 border-ppa-blue bg-ppa-paper p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                Five divisions
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ppa-navy/70">
                Points are awarded in men&apos;s singles, women&apos;s singles,
                men&apos;s doubles, women&apos;s doubles and mixed doubles. Each
                division keeps its own ranking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Path to the tour */}
      <section id="path" className="scroll-mt-24 bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              Path to the Tour
            </p>
          </div>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] sm:text-3xl">
            How a Challenger Result Becomes a Tour Career
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            Challenger points do two things. They rank you against every other
            player on the series, and they get you into the room.
          </p>
          <ol className="mt-6 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-2">
            <li className="min-w-0 bg-ppa-navy p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-sky">01</p>
              <h3 className="mt-1.5 font-display text-base uppercase leading-tight">Win a stop</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Every Challenger pro champion holds a wild card into the main draw
                of a PPA Tour Open. That is a place in the same draw as the tour&apos;s
                contracted pros, earned on court.
              </p>
            </li>
            <li className="min-w-0 bg-ppa-navy p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-sky">02</p>
              <h3 className="mt-1.5 font-display text-base uppercase leading-tight">Finish the season near the top</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                The highest-ranked players without a PPA contract are invited to
                the PPA Challenger Showdown, played during the Pickleball World
                Championships, where they compete for a spot on the PPA Tour.
              </p>
            </li>
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/about/how-it-works"
              className="inline-flex h-11 items-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-white"
            >
              How Pro Pickleball Works
            </Link>
            <Link
              href="/rankings"
              className="inline-flex h-11 items-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-white"
            >
              World Pickleball Rankings
            </Link>
          </div>
        </div>
      </section>


      {/* -------------------------------------------------------- Showdown */}
      <section id="showdown" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Showdown" title="The PPA Challenger Showdown" />
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="min-w-0 border-l-2 border-ppa-blue bg-white p-6">
              <p className="text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                The Challenger Series season ends at the{" "}
                {hostHref ? (
                  <Link href={hostHref} className="font-semibold text-ppa-blue hover:underline">
                    {challengerShowdown.hostName}
                  </Link>
                ) : (
                  <span className="font-semibold text-ppa-navy">
                    {challengerShowdown.hostName}
                  </span>
                )}
                , the largest event in pickleball. The highest-ranked players
                without a PPA Tour contract are invited to{" "}
                {challengerShowdown.venue} to play for one.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                {challengerShowdown.contracts} players leave signed: a{" "}
                {challengerShowdown.contractSeason} PPA Tour contract and
                professional status on the tour.
              </p>
            </div>
            <ul className="grid gap-px border border-ppa-line bg-ppa-line">
              {[
                { label: "When", value: showdownDates },
                {
                  label: "Where",
                  value: `${challengerShowdown.venue} · ${challengerShowdown.city}`,
                },
                { label: "Field", value: "8 teams per event, in two pools" },
                {
                  label: "On the line",
                  value: `${challengerShowdown.contracts} PPA Tour contracts for ${challengerShowdown.contractSeason}`,
                },
              ].map((row) => (
                <li key={row.label} className="min-w-0 bg-white p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                    {row.label}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-ppa-navy">
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 overflow-hidden border border-ppa-line">
            <div className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-ppa-line bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
              <span>Day</span>
              <span>What is played</span>
            </div>
            {showdownDays.map((d) => (
              <div
                key={d.iso}
                className="grid grid-cols-[5.5rem_1fr] items-center gap-3 border-b border-ppa-line bg-white px-4 py-3 last:border-b-0"
              >
                <span className="font-display text-base uppercase leading-tight text-ppa-blue">
                  <span className="block font-sans text-[10px] font-bold leading-none text-ppa-navy/40">
                    {d.dow}
                  </span>
                  {shortDate(d.iso)}
                </span>
                <span className="text-sm font-semibold text-ppa-navy">{d.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="min-w-0 border border-ppa-line bg-white p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                Who qualifies
              </p>
              <ul className="mt-3 flex flex-col gap-3">
                {challengerShowdown.qualifying.map((q) => (
                  <li key={q.division}>
                    <span className="block text-sm font-semibold text-ppa-navy">
                      {q.division}
                    </span>
                    <span className="block text-sm leading-relaxed text-ppa-navy/60">
                      {q.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0 border border-ppa-line bg-white p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                Format
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ppa-navy/65">
                Eight teams — eight players in singles — are seeded into two
                pools on Challenger ranking. Pool play is round robin, and the
                top two from each pool reach the semifinals. Every match is best
                of three.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ppa-navy/65">
                In both doubles events the top seed picks a partner, and the
                picks run down the rankings from there. Both players have to
                agree, and every team is confirmed by{" "}
                <span className="font-semibold text-ppa-navy">
                  {challengerShowdown.partnerDeadline}
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Rankings */}
      <section id="rankings" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Standings" title="Challenger Series Rankings" />
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55">
            Points earned at PPA Challenger Series events, by division. Pick a
            division or search a player.
          </p>
          <div className="mt-6">
            <ChallengerRankings />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Sponsors */}
      <section id="sponsors" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Sponsors" title="Behind the Challenger Series" />
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
            {joola && joola.logo && (
              <div className="flex min-w-0 flex-col bg-white p-6">
                {joolaLink ? (
                  <a href={joolaLink} target="_blank" rel="noopener noreferrer" className="block">
                    <Image
                      src={joola.logo}
                      alt="JOOLA"
                      width={joola.logoWidth ?? 400}
                      height={joola.logoHeight ?? 160}
                      sizes="(min-width: 1024px) 320px, 60vw"
                      className="h-16 w-auto object-contain"
                    />
                  </a>
                ) : (
                  <Image
                    src={joola.logo}
                    alt="JOOLA"
                    width={joola.logoWidth ?? 400}
                    height={joola.logoHeight ?? 160}
                    sizes="(min-width: 1024px) 320px, 60vw"
                    className="h-16 w-auto object-contain"
                  />
                )}
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                  Powered by JOOLA
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ppa-navy/65">
                  The Challenger Series carries JOOLA&apos;s name at every stop.
                </p>
              </div>
            )}
            <div className="flex min-w-0 flex-col justify-between border border-ppa-line bg-white p-6">
              <div>
                <h3 className="font-display text-xl uppercase text-ppa-navy">
                  Put Your Brand in Front of Players in 15 States
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                  Challenger stops reach the players, families and clubs that
                  make up the fastest-growing part of the sport. Tell us about
                  your company and we will come back with what a Challenger
                  Series partnership looks like.
                </p>
              </div>
              <Link
                href="/about/sponsors#inquire"
                className="mt-5 inline-flex h-11 w-fit items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-transform hover:bg-ppa-blue-deep active:scale-[0.98]"
              >
                Become a Sponsor →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Host */}
      <section id="host" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="For Clubs and Cities" title="Host a Challenger Stop" />
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="min-w-0 border-l-2 border-ppa-blue bg-ppa-paper p-6">
              <p className="text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                The PPA brings the registration system, an experienced event
                team, ticketing, professional play management, live streaming,
                balls, national marketing, signage and the prize money. You
                bring the courts, a championship court for 250 or more, WiFi
                that carries a stream, and the people to run the weekend.
              </p>
              <Link
                href="/about/host-tournament#challenger"
                className="mt-5 inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-transform hover:bg-ppa-blue-deep active:scale-[0.98]"
              >
                What It Takes to Host →
              </Link>
            </div>
            <ul className="grid gap-px border border-ppa-line bg-ppa-line">
              {[
                { label: "Courts", value: "At least 16" },
                { label: "Championship court", value: "Seats 250 or more" },
                { label: "Divisions", value: "3.0–5.0 plus Pro" },
                { label: "Apply", value: "Venue application on the host page" },
              ].map((row) => (
                <li key={row.label} className="min-w-0 bg-white p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                    {row.label}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-ppa-navy">
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
