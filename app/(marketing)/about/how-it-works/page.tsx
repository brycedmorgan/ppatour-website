import type { Metadata } from "next";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";

export const metadata: Metadata = { title: "How It Works" };

const POINT_TIERS = [
  {
    tier: "Main Draw",
    points: "1,000+",
    detail: "Every standard main-tour stop (Atlanta, Las Vegas, Chicago, etc.)",
  },
  {
    tier: "Grand Slam",
    points: "2,000+",
    detail: "The marquee events — Nationals and the Pickleball Masters",
  },
  {
    tier: "PPA Finals",
    points: "Bonus",
    detail: "Top-ranked players compete for season bonus points",
  },
];

const DIVISIONS = [
  "Men's Singles",
  "Men's Doubles",
  "Mixed Doubles (Men)",
  "Women's Singles",
  "Women's Doubles",
  "Mixed Doubles (Women)",
];

const SEASON_STEPS = [
  {
    n: "01",
    title: "The Schedule",
    body: "Twenty-five main-tour stops a year across every region, plus a growing international footprint.",
  },
  {
    n: "02",
    title: "The Points",
    body: "Every result moves a player up or down. Main-tour stops carry 1,000+ points; Grand Slams pay double.",
  },
  {
    n: "03",
    title: "The Brackets",
    body: "Six divisions per stop — Men's and Women's, Singles / Doubles / Mixed — with seeded draws and best-of-three matches.",
  },
  {
    n: "04",
    title: "The Race",
    body: "The season-long Points Race decides seeding for Nationals and crowns the year-end No. 1 in each division.",
  },
  {
    n: "05",
    title: "The Finals",
    body: "The top of the race meets at the National Championships and the PPA Finals — title-deciding weekends on national TV.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              How It Works
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            The Season, the Points, the Race
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
            A pro tour with a real points race, real divisions, and a real
            ranking. Here&apos;s how it all fits together.
          </p>
        </div>
      </section>

      {/* Season steps */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            The Season
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            From First Serve to Year-End No. 1
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {SEASON_STEPS.map((s) => (
              <div
                key={s.n}
                className="flex flex-col border border-ppa-line bg-ppa-paper p-5"
              >
                <span className="font-display text-3xl leading-none text-ppa-blue">
                  {s.n}
                </span>
                <h3 className="mt-3 font-display text-base uppercase leading-[1.1] text-ppa-navy">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ppa-navy/60">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Points + Divisions */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Points */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Ranking Points
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                How Points Are Awarded
              </h2>
              <div className="mt-5 border border-ppa-line">
                <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-ppa-line bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                  <span>Event Tier</span>
                  <span className="text-right">Points</span>
                </div>
                {POINT_TIERS.map((p) => (
                  <div
                    key={p.tier}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-ppa-line bg-white px-4 py-3 last:border-b-0"
                  >
                    <span>
                      <span className="block font-display text-sm uppercase tracking-wide text-ppa-navy">
                        {p.tier}
                      </span>
                      <span className="mt-0.5 block text-xs text-ppa-navy/55">
                        {p.detail}
                      </span>
                    </span>
                    <span className="text-right font-display text-xl text-ppa-blue tabular-nums">
                      {p.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divisions */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Divisions
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Six Brackets per Stop
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ppa-navy/65">
                Each stop runs all six divisions — singles, doubles, and
                mixed doubles, for both men and women. Players accumulate
                points in every division they enter.
              </p>
              <ul className="mt-5 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2">
                {DIVISIONS.map((d) => (
                  <li
                    key={d}
                    className="flex items-center gap-2 bg-white p-3 text-sm font-semibold text-ppa-navy"
                  >
                    <span className="size-1.5 bg-ppa-blue" />
                    {d}
                  </li>
                ))}
              </ul>
              <Link
                href="/athletes"
                className="mt-5 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
              >
                See the Points Race →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/watch"
              className="group flex flex-col border border-white/15 bg-ppa-navy-deep p-6 transition-colors hover:bg-ppa-navy-soft"
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
              className="group flex flex-col border border-white/15 bg-ppa-navy-deep p-6 transition-colors hover:bg-ppa-navy-soft"
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

      {/* Email */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="fan" />
        </div>
      </section>
    </>
  );
}
