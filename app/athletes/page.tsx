import type { Metadata } from "next";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { AthleteRoster, type RosterAthlete } from "@/components/athletes/AthleteRoster";
import { RankingsBoard } from "@/components/rankings/RankingsBoard";
import { getAthlete } from "@/lib/athletes";
import {
  CURATED_TO_CANONICAL,
  countryCodeFor,
  publishedAthletes,
} from "@/lib/published-athletes";
import { curatedSlugFor, getRankings, getWprIndex } from "@/lib/rankings-api";

export const metadata: Metadata = {
  title: "Athletes",
  description:
    "The full roster of Carvana PPA Tour pros — profiles, quick facts, live World Pickleball Rankings, and the season-long points race.",
};

function genderFromDivisions(divisions: string[]): "male" | "female" {
  return divisions.some((d) => d.startsWith("Women")) ? "female" : "male";
}

export default async function AthletesPage() {
  // Live WPR record (rank/points/headshot) for every ranked player, keyed by
  // the API slug; used to enrich the published roster.
  const wprIndex = await getWprIndex();
  // Standings board: top 10 of each gender's World Pickleball Ranking.
  const standings = await getRankings();

  // Full roster: every published athlete, enriched with live WPR data. Curated
  // headshots win (local studio crops); otherwise the API cutout; else initials.
  const roster: RosterAthlete[] = publishedAthletes.map((p) => {
    const wpr = wprIndex[p.slug];
    const curated = getAthlete(CURATED_TO_CANONICAL[p.slug] ?? p.slug) ?? getAthlete(p.slug);
    return {
      // Prefer a curated shorthand page when one exists (richer, local headshot).
      slug: curatedSlugFor(p.slug) ?? p.slug,
      name: p.name,
      headshot: curated?.headshot ?? wpr?.image ?? "",
      country: p.country || wpr?.country || "",
      countryCode: p.countryCode || wpr?.countryCode || countryCodeFor(p.country),
      rank: wpr?.rank ?? 0,
      points: wpr?.points ?? 0,
      gender: wpr?.gender ?? genderFromDivisions(p.divisions),
    };
  });

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
            The full roster of Carvana PPA Tour pros. Search by name or country,
            filter and sort the field, and tap any pro for their profile, quick
            facts, and live World Pickleball Ranking.
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
            Pro Field <span className="text-ppa-blue">· {roster.length}</span>
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
