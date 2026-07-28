import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { LiveScoreTicker } from "@/components/live/LiveScoreTicker";
import { TvGuide } from "@/components/watch/TvGuide";
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
    "Where to watch the Carvana PPA Tour — national television windows, every round streaming live on PickleballTV, the full TV guide, and live scores.",
};

/**
 * National-television networks that have carried the tour (Bryce 7/28: lead
 * the page with "As seen on CBS, Fox, ESPN, NBC").
 *
 * ⚠ CBS, FOX and FS1/FS2 are confirmed in `lib/broadcast.ts` (transcribed from
 * the Championship Court sheet). ESPN and NBC are NOT in any broadcast sheet
 * we hold — they came from Connor's brief. Confirm with Adam Friedman before
 * launch; deleting a row here is the whole fix if either is wrong.
 * Network marks: only Tennis Channel's is on disk, so the rest are set in
 * type. Drop real logo files in public/ppa/networks/ and add `logo` here.
 */
const AS_SEEN_ON: { name: string; logo?: string; confirmed: boolean }[] = [
  { name: "CBS", confirmed: true },
  { name: "FOX", confirmed: true },
  { name: "ESPN", confirmed: false },
  { name: "NBC", confirmed: false },
  { name: "Tennis Channel", logo: "/ppa/networks/tennis-channel.svg", confirmed: true },
];

const BROADCAST = [
  {
    name: "PickleballTV",
    note: "The home of pro pickleball — every round of every event, live",
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
    // Was "every court, every match, streamed live" — that's PickleballTV, not
    // YouTube (Dave Rogers, 7/27 audit). Corrected.
    note: "Highlights, replays, and featured-court coverage",
    detail: "Free · full match replays",
    href: "https://www.youtube.com/channel/UCSP6HlrMmRqogym2aHBPHpw",
    cta: "Open YouTube",
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
      {/* ── Where to watch, first (Bryce 7/28): the networks lead the page ── */}
      <section className="bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              National Television
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            As Seen On
          </h1>

          <div className="mt-6 grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5">
            {AS_SEEN_ON.map((n) => (
              <div
                key={n.name}
                className="flex min-h-[6.5rem] items-center justify-center bg-ppa-navy px-4 py-6"
              >
                {n.logo ? (
                  <Image
                    src={n.logo}
                    alt={n.name}
                    width={180}
                    height={48}
                    sizes="180px"
                    className="h-8 w-auto brightness-0 invert"
                  />
                ) : (
                  <span className="font-display text-2xl uppercase leading-none tracking-tight text-white sm:text-3xl">
                    {n.name}
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/65">
            Pro pickleball reaches national television every season — and{" "}
            <span className="font-bold text-white">PickleballTV</span> streams
            every round of every Carvana PPA Tour event in between. The full
            broadcast and streaming schedule is below. All times Eastern.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <a
              href="https://www.pickleballtv.com/?utm_source=ppatour&utm_medium=website&utm_campaign=watch&utm_content=watch-hero-pbtv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] transition hover:bg-ppa-blue-deep active:scale-[0.98]"
            >
              ▶ Stream on PickleballTV ↗
            </a>
            <Link
              href="/watch/tv"
              className="flex h-11 items-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition hover:border-white hover:bg-white hover:text-ppa-navy active:scale-[0.98]"
            >
              Full Season TV Schedule →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TV guide: the next events, day by day, channel by channel ── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 bg-ppa-blue" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                  TV Guide
                </p>
              </div>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Where to Watch the Next Events
              </h2>
            </div>
            <Link
              href="/watch/tv"
              className="group text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-blue-deep"
            >
              Full Season Schedule{" "}
              <span
                aria-hidden
                className="inline-block transition-transform duration-300 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>
          <div className="mt-6">
            <TvGuide limit={4} />
          </div>
          <p className="mt-5 text-[11px] uppercase tracking-[0.08em] text-ppa-navy/40">
            Source: PPA/MLP Championship Court broadcast schedule · windows
            subject to change — check local listings for Tennis Channel.
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
          {/* Dave Rogers 7/27: PickleballTV, not YouTube, is the primary way
              to watch — and "Buy Tickets Instead" was an odd read. */}
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <a
              href="https://www.pickleballtv.com/?utm_source=ppatour&utm_medium=website&utm_campaign=watch&utm_content=watch-next-event-pbtv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-ppa-blue-deep"
            >
              ▶ Watch on PickleballTV
            </a>
            <Link
              href="/watch/tv"
              className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
            >
              TV Schedule →
            </Link>
            <a
              href={withUtm(next.ticketsUrl, {
                campaign: next.slug,
                content: "watch-page-tickets",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
            >
              Buy Tickets ↗
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
