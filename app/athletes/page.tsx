import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { PointsRace } from "@/components/home/PointsRace";
import { divisionRankings, playersToWatch } from "@/lib/home-content";

export const metadata: Metadata = { title: "Athletes" };

export default function AthletesPage() {
  const divisions = divisionRankings.length;
  const totalAthletes = divisionRankings.reduce(
    (n, d) => n + d.entries.length,
    0,
  );

  return (
    <>
      {/* Header */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              The Athletes
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            Meet the Pros
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
            The best players in the world, across {divisions} divisions and
            every main-tour stop. Profiles, rankings, and the race for No. 1.
          </p>
        </div>
      </section>

      {/* Players to watch */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 bg-ppa-blue" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                  Featured
                </p>
              </div>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
                Players to Watch
              </h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {playersToWatch.map((p) => (
              <Link
                key={p.name}
                href="/athletes"
                className="group flex flex-col overflow-hidden border border-white/10 bg-ppa-navy"
              >
                <div className="relative aspect-[5/4] overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="will-change-transform object-cover object-top grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <span className="absolute left-3 top-3 bg-ppa-yellow px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ppa-navy">
                    No. {p.rank}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4 text-white">
                  <p className="font-display text-lg uppercase leading-none">
                    {p.name}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-sky">
                    {p.division}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">
                    {p.hook}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Points race — full tabs */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 bg-ppa-blue" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                  Standings
                </p>
              </div>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
                The Points Race
              </h2>
            </div>
            <p className="max-w-xs text-sm text-white/55 sm:text-right">
              {totalAthletes}+ pros across {divisions} divisions, chasing the
              season title.
            </p>
          </div>
          <PointsRace />
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
