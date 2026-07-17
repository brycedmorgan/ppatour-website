import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { LiveScoreTicker } from "@/components/live/LiveScoreTicker";
import { fetchLiveTicker } from "@/lib/ticker-api";
import {
  daysUntil,
  formatDateRange,
  getNextTournament,
} from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

/**
 * Server-prefetch the live matches so the ticker's first paint already has
 * data — no post-hydration fetch wait. Streamed under its own Suspense
 * boundary so the rest of /watch renders immediately.
 */
async function LiveScores() {
  const initialData = await fetchLiveTicker();
  return (
    <LiveScoreTicker
      showDate={false}
      transparent
      visibleCards={3}
      initialData={initialData}
    />
  );
}

export const metadata: Metadata = {
  title: "Watch",
  description:
    "Watch pro pickleball live — streaming on PickleballTV and YouTube, national TV windows on Tennis Channel and FOX, plus live scores and brackets.",
};

const BROADCAST = [
  {
    name: "PickleballTV",
    note: "The home of pro pickleball — every round, live",
    detail: "PBTV · streams every main-draw round",
    cta: "Watch on PBTV",
    href: "https://www.pickleballtv.com/?utm_source=ppatour&utm_medium=website&utm_campaign=watch&utm_content=watch-pbtv",
    external: true,
  },
  {
    name: "Tennis Channel",
    note: "Marquee windows simulcast on national television",
    detail: "Championship Sundays · select QFs & SFs",
    cta: "Full TV Schedule",
    href: "/watch/tv",
  },
  {
    name: "PPA Tour · YouTube",
    note: "Every court, every match, streamed live",
    detail: "Free · all main-draw matches",
    cta: "Open YouTube",
    href: "https://www.youtube.com/@ppatour",
    external: true,
  },
  {
    name: "MATCHDAY App",
    note: "Live scores, brackets, and match alerts",
    detail: "iOS · Android",
    cta: "Get the App",
    href: "https://www.matchday.app/?utm_source=ppatour&utm_medium=website&utm_campaign=watch&utm_content=watch-matchday",
    external: true,
  },
];

export default function WatchPage() {
  const next = getNextTournament();
  const countdown = daysUntil(next.startDate);

  return (
    <>
      {/* Header */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              For Fans
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            Catch Every Match
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
            Live streams, broadcast schedules, brackets, and match alerts —
            every way to follow the tour, on one screen.
          </p>
        </div>
      </section>

      {/* Live now — scoreboard rail */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 bg-ppa-blue" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                  Live Now
                </p>
              </div>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Scores & Brackets
              </h2>
            </div>
          </div>
          <div className="mt-6">
            {/* Same live cards + data as the /live broadcast ticker, on a
                transparent backdrop with 3 full cards and no date badge.
                Matches are server-prefetched (LiveScores) for a fast first
                paint; the client hook keeps polling from there. */}
            <Suspense fallback={<div className="h-[120px]" />}>
              <LiveScores />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Next event broadcast */}
      <section className="relative isolate overflow-hidden bg-ppa-navy text-white">
        <Image
          src={next.image}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 scrim-hero" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              Next Broadcast
            </p>
          </div>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
            {next.shortName}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wide text-white/75">
            <span>{formatDateRange(next.startDate, next.endDate)}</span>
            <span className="text-white/25">|</span>
            <span>
              {next.city}, {next.state}
            </span>
            <span className="text-white/25">|</span>
            <span className="text-ppa-yellow">
              {countdown} {countdown === 1 ? "Day" : "Days"} Out
            </span>
          </div>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <a
              href="https://www.youtube.com/@ppatour"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-ppa-blue-deep"
            >
              ▶ Watch on YouTube
            </a>
            <a
              href={withUtm(next.ticketsUrl, {
                campaign: next.slug,
                content: "watch-page-tickets",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
            >
              Buy Tickets Instead
            </a>
          </div>
        </div>
      </section>

      {/* Where to Watch */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              Broadcast
            </p>
          </div>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Where to Watch
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BROADCAST.map((b) => (
              <div
                key={b.name}
                className="flex flex-col border border-ppa-line bg-white p-5"
              >
                <span className="text-sm text-ppa-blue">▶</span>
                <p className="mt-2 font-display text-lg uppercase leading-none text-ppa-navy">
                  {b.name}
                </p>
                <p className="mt-1.5 text-xs text-ppa-navy/55">{b.note}</p>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/40">
                  {b.detail}
                </p>
                <Link
                  href={b.href}
                  target={b.external ? "_blank" : undefined}
                  rel={b.external ? "noopener noreferrer" : undefined}
                  className="mt-4 inline-flex items-center gap-1 self-start border-b-2 border-ppa-blue pb-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
                >
                  {b.cta} {b.external ? "↗" : "→"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="streaming" />
        </div>
      </section>
    </>
  );
}
