import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { PointsRace } from "@/components/home/PointsRace";
import { athletes } from "@/lib/athletes";
import { divisionRankings } from "@/lib/home-content";

export const metadata: Metadata = {
  title: "Athletes",
  description:
    "The pros of the Carvana PPA Tour — profiles, rankings, and the season-long points race for every touring professional.",
};

export default function AthletesPage() {
  const divisions = divisionRankings.length;

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
            every main-tour stop. Tap any pro for their profile, divisions, and
            place in the points race.
          </p>
        </div>
      </section>

      {/* Roster */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            The Roster
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Pro Field
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {athletes.map((a) => (
              <Link
                key={a.slug}
                href={`/athletes/${a.slug}`}
                className="group flex flex-col overflow-hidden border border-ppa-line bg-white"
              >
                <div className="relative aspect-square overflow-hidden bg-ppa-paper">
                  <Image
                    src={a.headshot}
                    alt={a.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-2 top-2 bg-ppa-yellow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ppa-navy">
                    No. {a.bestRank}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="font-display text-base uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                    {a.name}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-blue">
                    {a.divisions[0]}
                    {a.country !== "USA" ? ` · ${a.country}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Points race */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              Standings
            </p>
          </div>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
            The Points Race
          </h2>
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
