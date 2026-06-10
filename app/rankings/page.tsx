import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { PointsRace } from "@/components/home/PointsRace";
import { getAthlete } from "@/lib/athletes";
import { divisionRankings } from "@/lib/home-content";

export const metadata: Metadata = {
  title: "Rankings",
  description:
    "The PPA Tour Points Race — top-8 standings across all six pro divisions, updated through the season.",
};

export default function RankingsPage() {
  // The current No. 1 in each division — a quick "atop the race" strip.
  const leaders = divisionRankings.map((d) => {
    const top = d.entries[0];
    const a = top ? getAthlete(top.slug) : undefined;
    return { division: d.label, athlete: a, points: top?.points };
  });

  return (
    <>
      {/* Hero */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              Standings
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            The Points Race
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
            Every result moves a pro up or down. Top-8 standings in all six
            divisions — the season-long chase to be the year-end No. 1.
          </p>
        </div>
      </section>

      {/* Atop the Race — current No. 1 strip */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Atop the Race
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            The Current No. 1s
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leaders.map((l) =>
              l.athlete ? (
                <Link
                  key={l.division}
                  href={`/athletes/${l.athlete.slug}`}
                  className="group flex items-center gap-4 border border-ppa-line bg-ppa-paper p-4 transition-colors hover:bg-white"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-ppa-navy-deep">
                    <Image
                      src={l.athlete.headshot}
                      alt={l.athlete.name}
                      fill
                      sizes="64px"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
                      {l.division} · No. 1
                    </span>
                    <span className="mt-0.5 font-display text-lg uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                      {l.athlete.name}
                    </span>
                    <span className="mt-0.5 text-xs tabular-nums text-ppa-navy/55">
                      {l.points?.toLocaleString()} pts
                    </span>
                  </div>
                </Link>
              ) : null,
            )}
          </div>
        </div>
      </section>

      {/* Full standings */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              Full Standings
            </p>
          </div>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
            Top 8 · Six Divisions
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Tap a division to switch the table. Click any name to open that
            pro&apos;s profile.
          </p>
          <PointsRace />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/athletes"
              className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-ppa-blue-deep"
            >
              Full Roster →
            </Link>
            <Link
              href="/about/how-it-works"
              className="inline-flex h-11 items-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-white hover:text-ppa-navy"
            >
              How Points Work
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
