import type { Metadata } from "next";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { AthleteRoster, type RosterAthlete } from "@/components/athletes/AthleteRoster";
import { RankingsBoard } from "@/components/rankings/RankingsBoard";
import { athletes } from "@/lib/athletes";
import { TOP_COUNT, curatedSlugFor, getRankings, getWprRoster } from "@/lib/rankings-api";

export const metadata: Metadata = {
  title: "Athletes",
  description:
    "The pros of the Carvana PPA Tour — the top men and women in the World Pickleball Rankings, with profiles and the season-long points race.",
};

// Curated-roster fallback only (used if the live rankings API is unavailable).
const COUNTRY_ISO: Record<string, string> = {
  USA: "us",
  Argentina: "ar",
  Canada: "ca",
  Colombia: "co",
  France: "fr",
  Israel: "il",
  Lithuania: "lt",
  Romania: "ro",
  Spain: "es",
};

export default async function AthletesPage() {
  // Live roster: top 25 men + top 25 women from the World Pickleball Rankings.
  const wpr = await getWprRoster();
  // Standings board: top 10 of each gender's World Pickleball Ranking.
  const standings = await getRankings();

  const roster: RosterAthlete[] = wpr.length
    ? wpr.map((p) => ({
        // Link to the curated profile when we have one, else the API slug.
        slug: curatedSlugFor(p.slug) ?? p.slug,
        name: p.name,
        // Uniform look: use the API's studio cutout for every card.
        headshot: p.image ?? "",
        country: p.country,
        countryCode: p.countryCode,
        rank: p.rank,
        points: p.points,
        gender: p.gender,
      }))
    : // Fallback to the curated roster if the API is down.
      athletes.map((a) => ({
        slug: a.slug,
        name: a.name,
        headshot: a.headshot,
        country: a.country,
        countryCode: COUNTRY_ISO[a.country] ?? "",
        rank: a.bestRank,
        points: 0,
        gender: (a.divisions.some((d) => d.startsWith("Women")) ? "female" : "male") as
          | "male"
          | "female",
      }));

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
            The top {TOP_COUNT} men and top {TOP_COUNT} women in the World
            Pickleball Rankings. Tap any pro for their profile, ranking, and
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
          <AthleteRoster athletes={roster} />
        </div>
      </section>

      {/* Standings */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              Standings
            </p>
          </div>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
            World Pickleball Rankings
          </h2>

          <div className="mt-6">
            {/* Top 10 of each gender; the full list lives on /leaderboards. */}
            <RankingsBoard
              divisions={standings.divisions.map((d) => ({
                ...d,
                entries: d.entries.slice(0, 10),
              }))}
            />
          </div>

          <Link
            href="/leaderboards"
            className="group mt-6 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:text-ppa-sky"
          >
            See Full Leaderboard{" "}
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
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
