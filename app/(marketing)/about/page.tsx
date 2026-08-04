import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { getMainTourEvents } from "@/lib/placeholder-data";

/**
 * ⚠ DERIVED, not typed. The stop count was "18 provisionally / TBD" here while
 * the 7/29 ruling had already normalized it sitewide off `getMainTourEvents()`,
 * which returns 20 — so /about disagreed with /events and the homepage. Reading
 * the function settles the TBD permanently and can't drift when the calendar
 * changes. Season opener/closer come from the same sorted list, which also
 * stops this page hardcoding an event name (it was still carrying the retired
 * "Veolia Pickleball National Championships" spelling after the 8/3 change).
 */
const SEASON = getMainTourEvents();
const seasonStopCount = SEASON.length;
const seasonOpener = SEASON[0]?.name ?? "the season opener";
const seasonCloser = SEASON[SEASON.length - 1]?.name ?? "the PPA Finals";

export const metadata: Metadata = {
  title: "About",
  description: `About the Carvana PPA Tour — the premier professional pickleball tour — ${seasonStopCount} stops a year and the best players in the world, all chasing one points race.`,
};

/**
 * Stat band rebuilt with Tyler's figures (7/30). The prior band was pulled
 * (Connor, 7/29) because the purse/stops weren't owned numbers. Prize money and
 * countries are still Tyler's and want a final confirm; the stop count is now
 * derived (see above) rather than provisional.
 */
const STATS = [
  { n: String(seasonStopCount), label: "Tour Stops", note: "Each worth 1,000+ ranking points" },
  { n: "$30M+", label: "Prize Money", note: "Across the season" },
  { n: "12", label: "Countries", note: "A growing international footprint" },
];

// Ported from the merged /about/pro-tour page (Tyler, 7/30 — that page was
// redundant with About). Bryce's 7/29 tier ruling preserved.
const TIERS = [
  { name: "Major", points: "2,000–3,000 pts", note: "The four crown jewels — the Masters, the Players, Nationals, and Worlds, the biggest of them at 3,000." },
  { name: "Championship", points: "2,000 pts", note: "The season-ending PPA Finals." },
  { name: "Cup", points: "1,500 pts", note: "Premium destinations and longer broadcast windows." },
  { name: "Open", points: "1,000 pts", note: "The backbone of the tour — every city, every weekend." },
  { name: "Challenger", points: "125–500 pts", note: "The feeder series underneath the tour." },
];

const LINKS = [
  { label: "How It Works", href: "/about/how-it-works", blurb: "Ranking points, brackets, divisions, and the path to Nationals." },
  { label: "Tournament History", href: "/about/history", blurb: "National Champions year-by-year and the tour's milestones." },
  { label: "What is Pickleball?", href: "/about/what-is-pickleball", blurb: "The fastest-growing sport in America, explained in 90 seconds." },
  { label: "Sponsors", href: "/about/sponsors", blurb: "Title partner, official partners, and the brands powering the tour." },
  { label: "Player Handbook", href: "/about/player-handbook", blurb: "Rules, format, code of conduct, and equipment." },
  { label: "Ambassadors", href: "/about/ambassadors", blurb: "The community program — creators, club owners, coaches." },
  { label: "International Ambassadors", href: "/about/international-ambassadors", blurb: "The growing global PPA Tour Ambassador network." },
  { label: "Host a Tournament", href: "/about/host-tournament", blurb: "For venues and cities — bid for a tour stop." },
  { label: "Private Events", href: "/about/private-events", blurb: "For brands — pro-ams, hospitality suites, and activations." },
  { label: "Careers", href: "/about/careers", blurb: "Help build the pro tour of pickleball." },
  { label: "Contact", href: "/about/contact", blurb: "The right email for every kind of inquiry." },
  { label: "Integrity Reporting", href: "/about/integrity", blurb: "Confidential channel for match-conduct and integrity concerns." },
];

export default function AboutPage() {
  return (
    <>
      {/* Header / Mission */}
      <section className="relative isolate overflow-hidden bg-ppa-navy text-white">
        <Image
          src="/ppa/action-champ-sunday.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 scrim-hero" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              About
            </p>
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-3xl uppercase leading-[1.02] sm:text-5xl">
            The Pro Tour of America&apos;s Fastest-Growing Sport
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            The Carvana PPA Tour is the professional pickleball circuit —{" "}
            {seasonStopCount} tour stops per year, the best players in the
            world, sold-out venues,
            and the greatest community in sports. The Carvana PPA Tour engages
            and amplifies fans, partners and pickleball communities worldwide by
            showcasing the best pickleball players competing for the sport&apos;s
            largest purses and crucial World Pickleball Ranking points.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-ppa-navy-deep text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 px-4 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`px-3 py-7 ${i > 0 ? "border-t border-white/10 sm:border-l sm:border-t-0" : ""}`}
            >
              <p className="font-display text-3xl leading-none text-ppa-yellow sm:text-4xl">
                {s.n}
              </p>
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                {s.label}
              </p>
              <p className="mt-1 text-[11px] text-white/45">{s.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission / story */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                Our Story
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Built for the New Era of Pickleball
              </h2>
              <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                <p>
                  Pickleball is the fastest-growing sport in America for the
                  fifth year running. The Carvana PPA Tour was built to meet
                  that growth with a professional tour that looks, feels, and
                  runs like the major sports: a real season, a real ranking,
                  marquee venues, national TV windows, and a unified place to
                  follow every match.
                </p>
                {/* ⚠ Stop count and the season's first/last event are DERIVED,
                    not typed. This paragraph had drifted three ways at once:
                    "18 tour stops" (getMainTourEvents() returns 20 — a
                    regression against the 7/29 sitewide normalization), "the
                    majors pay double" (Worlds is 3,000, so it's triple), and it
                    still named the retired "Veolia Pickleball National
                    Championships" spelling after the 8/3 feed-name change. */}
                <p>
                  {seasonStopCount} tour stops cover every region of the
                  country, plus a growing international footprint. Each
                  tournament carries 1,000+ ranking points; the Majors pay
                  2,000, and Worlds pays 3,000. The season begins in August with
                  the {seasonOpener} and ends in May with the {seasonCloser},
                  where all season championships are decided.
                </p>
                <p>
                  Off the court, the Carvana PPA Tour is a part of Pickleball
                  Inc., the largest singularly-operated pickleball ecosystem in
                  existence, integrating professional and amateur pickleball
                  with leading technology, retail, and infrastructure platforms.
                  In addition to the Carvana PPA Tour, Pickleball Inc. owns and
                  operates Major League Pickleball (MLP presented by DoorDash)
                  plus other business verticals including Pickleball Central,
                  Pickleball Play Solutions, Just Courts, Pickleball.com, and
                  PickleballTV.
                </p>
              </div>
            </div>

            <aside>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                Learn More
              </p>
              <div className="mt-3 flex flex-col gap-px border border-ppa-line bg-ppa-line">
                {LINKS.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="group flex flex-col gap-1 bg-white p-4 transition-colors hover:bg-ppa-paper"
                  >
                    <span className="font-display text-base uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                      {l.label}
                    </span>
                    <span className="text-xs text-ppa-navy/55">{l.blurb}</span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* The Season (merged from the former Pro Tour page) */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                The Season
              </p>
              {/* ⚠ Derived. This heading and paragraph both spelled the count
                  out as "eighteen", which is why a find on "18" missed them —
                  there were FIVE stale stop counts on this page, in four
                  different formats. All read `seasonStopCount` now. */}
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                One Race. {seasonStopCount} Stops. Five Divisions.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                The Carvana PPA Tour runs {seasonStopCount} tour stops — majors,
                cups, and opens — across every region of the country, ending at
                the PPA Finals. Each tournament runs five pro divisions
                (men&apos;s and
                women&apos;s singles, men&apos;s and women&apos;s doubles, and
                mixed doubles) plus a deep amateur and junior bracket. Every
                result moves a player up or down the season-long points race.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/events" className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-ppa-blue-deep">
                  Full Schedule →
                </Link>
                <Link href="/athletes" className="inline-flex h-11 items-center border border-ppa-line bg-white px-6 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:border-ppa-blue hover:text-ppa-blue">
                  Meet the Pros
                </Link>
              </div>
            </div>

            <aside>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Tier System</p>
              <div className="mt-3 border border-ppa-line">
                {TIERS.map((t) => (
                  <div key={t.name} className="grid grid-cols-[1fr_auto] gap-3 border-b border-ppa-line bg-white p-4 last:border-b-0">
                    <span>
                      <span className="block font-display text-base uppercase text-ppa-navy">{t.name}</span>
                      <span className="mt-0.5 block text-xs text-ppa-navy/55">{t.note}</span>
                    </span>
                    <span className="text-right font-display text-base text-ppa-blue tabular-nums">{t.points}</span>
                  </div>
                ))}
              </div>
              <Link href="/about/how-it-works" className="mt-5 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue">
                How It Works →
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {/* Email */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="fan" />
        </div>
      </section>
    </>
  );
}
