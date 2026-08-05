import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { TvGuide } from "@/components/watch/TvGuide";
import { WatchLiveNow } from "@/components/watch/WatchLiveNow";
import { fetchLiveTicker } from "@/lib/ticker-api";
import {
  daysUntil,
  formatDateRange,
  getNextTournament,
} from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";
import { matchdayLinks } from "@/lib/matchday";

/**
 * ISR. ⚠ This page also server-prefetches the live ticker with `cache: no-store`
 * (see the LiveNowBand boundary below), which opts the route out of static
 * generation regardless of this value. Left in place deliberately: the
 * prefetch is what gives the ticker data on first paint. If /watch needs to
 * be CDN-cached under load, move that prefetch client-side — the component
 * already polls /api/ticker, which is itself CDN-cached.
 *
 * Before this, every live-data page was rendered per request and served
 * `cache-control: private, no-store` with `x-vercel-cache: MISS` — nothing
 * reached the edge cache. /rankings was measured at a 34.8s TTFB on one pull
 * with zero traffic. Data was already cached (lib/pb-fetch tags its fetches);
 * what was uncached was the HTML.
 */
export const revalidate = 60;

/**
 * ⚠ Deliberately NOT `force-static`, unlike / and /rankings.
 *
 * The LiveNowBand boundary below server-prefetches the ticker with
 * `cache: "no-store"`, so this route renders per request (`ƒ /watch` in the
 * build log). Pinning it static would cache that first payload for up to a
 * minute, and a stale score on the page whose whole job is live scores is a
 * worse trade than an origin render.
 *
 * If /watch needs to survive launch-scale traffic, the fix is to drop the
 * server prefetch and let the component's own poll fill it — it already polls
 * /api/ticker, which is CDN-cached at 10s. That is a live-scores behaviour
 * change, so it is a decision, not a cleanup.
 */

/**
 * Server-prefetch the live matches so the band's first paint already has data —
 * no post-hydration fetch wait, and no flash of a Live Now heading that then
 * removes itself. Streamed under its own Suspense boundary so the rest of
 * /watch renders immediately.
 *
 * WatchLiveNow renders nothing at all unless a match is in progress, so this
 * whole subtree can be absent from the page.
 */
async function LiveNowBand() {
  const initialData = await fetchLiveTicker();
  return <WatchLiveNow initialData={initialData} />;
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
 * Connor 7/29: "Let's use actual logos — those 5 on top, then a good
 * PickleballTV banner below the big 5, then where to watch." So these are real
 * network marks on white tiles (network logos are colour-locked; the previous
 * treatment typed the names in Gotham, which read as placeholder), and the PBTV
 * banner is its own block underneath.
 *
 * ── Why each of these publishes ────────────────────────────────────────────
 * CBS, FOX and FS1/FS2 are in `lib/broadcast.ts`, transcribed from the
 * Championship Court sheet.
 *
 * ESPN and NBC were withheld for a week because they appear in NO broadcast
 * sheet we hold — they came from Connor's brief, and publishing a network's
 * trademark to claim coverage we cannot evidence is not a thing to guess at.
 * Cleared 2026-08-04 by Bryce (President/CMO) — "we have been on ESPN and NBC,
 * NBC was a Vegas event, ESPN was during the Super Bowl one year" — and
 * corroborated independently rather than taken on memory alone:
 *   ESPN  the tour's own release "PPA Welcomes ESPN as the Exclusive
 *         Broadcaster", a live PPA Tour page on espn.com/watch, and ESPN /
 *         ESPN2 / ESPN3 across the published broadcast schedules.
 *   NBC   press coverage of the tour's broadcast history: "special events
 *         televised on NBC and ABC", which matches Bryce's Vegas recollection.
 *
 *   ABC   surfaced in the same source as NBC ("special events televised on NBC
 *         and ABC") and held back until Bryce confirmed it directly on 8/4.
 *         One summary line was enough to corroborate a claim he had already
 *         made about NBC; it was not enough to publish a network he had not
 *         mentioned. He has now confirmed it, so it publishes.
 *
 * Deleting a row here is still the whole fix if any of this changes.
 */
const AS_SEEN_ON: {
  name: string;
  logo: string;
  /** Intrinsic ratio, so each mark sits at the same optical weight. */
  width: number;
  height: number;
  /** Per-mark height class — a square peacock needs less height than a wordmark. */
  className: string;
  confirmed: boolean;
}[] = [
  { name: "CBS", logo: "/ppa/networks/cbs.svg", width: 1000, height: 447, className: "h-9 sm:h-10", confirmed: true },
  { name: "FOX", logo: "/ppa/networks/fox.svg", width: 1000, height: 422, className: "h-7 sm:h-8", confirmed: true },
  { name: "ESPN", logo: "/ppa/networks/espn.svg", width: 554, height: 137, className: "h-6 sm:h-7", confirmed: true },
  { name: "NBC", logo: "/ppa/networks/nbc.svg", width: 567, height: 559, className: "h-11 sm:h-12", confirmed: true },
  // Square circle-mark like NBC's peacock, so it takes the same taller height
  // rather than the wordmark height — otherwise it reads smaller than it is.
  { name: "ABC", logo: "/ppa/networks/abc.svg", width: 1000, height: 1000, className: "h-10 sm:h-11", confirmed: true },
  // Stacked lockup (mark over wordmark), so it needs more height than the
  // wordmark-only marks to sit at the same optical weight.
  { name: "Tennis Channel", logo: "/ppa/networks/tennis-channel.svg", width: 130, height: 170, className: "h-12 sm:h-14", confirmed: true },
];

const BROADCAST = [
  {
    name: "PickleballTV",
    note: "The home of pro pickleball — every round of every event, live",
    detail: "PBTV · streams every main-draw round",
    links: [{ cta: "Watch on PBTV", href: "https://www.pickleballtv.com/?utm_source=ppatour&utm_medium=website&utm_campaign=watch&utm_content=watch-pbtv" }],
    external: true,
  },
  {
    name: "Tennis Channel",
    note: "Marquee windows simulcast on national television",
    detail: "Championship Sundays · select QFs & SFs",
    links: [{ cta: "Full TV Schedule", href: "/watch/tv" }],
  },
  {
    name: "PPA Tour · YouTube",
    // Was "every court, every match, streamed live" — that's PickleballTV, not
    // YouTube (Dave Rogers, 7/27 audit). Corrected.
    note: "Highlights, replays, and featured-court coverage",
    detail: "Free · full match replays",
    links: [{ cta: "Open YouTube", href: "https://www.youtube.com/channel/UCSP6HlrMmRqogym2aHBPHpw" }],
    external: true,
  },
  {
    name: "MATCHDAY App",
    note: "Live scores, brackets, and match alerts",
    detail: "iOS · Android",
    /**
     * Two CTAs, one per store. The old single link pointed at matchday.app,
     * which is now a parked ad domain — see lib/matchday.ts. "iOS · Android"
     * above promises both platforms, so both need a real destination.
     */
    links: [
      { cta: "App Store", href: matchdayLinks("watch").ios },
      { cta: "Google Play", href: matchdayLinks("watch").android },
    ],
    external: true,
  },
];

/**
 * Only networks we can stand behind publish. All five are cleared as of
 * 2026-08-04 (see AS_SEEN_ON above for what each one rests on). Flip a mark's
 * `confirmed` to false to pull it; the grid re-flows its column count itself.
 */
const confirmedNetworks = AS_SEEN_ON.filter((n) => n.confirmed);

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

          {/* The confirmed networks in their real marks — white tiles because
              network logos are colour-locked and a knocked-out version isn't
              ours to make.

              ⚠ The column count follows the number of confirmed marks. It was
              a hard `lg:grid-cols-5` written when five networks were listed;
              once ESPN and NBC were withheld (launch item 10) that left three
              logos in a five-column grid and two empty cells reading as a dead
              grey block across the top of the page. Confirming a network is
              now the only edit needed — the grid re-flows itself. */}
          <div
            className={`mt-6 grid grid-cols-2 gap-px bg-white/15 sm:grid-cols-3 ${
              confirmedNetworks.length >= 6
                ? "lg:grid-cols-6"
                : confirmedNetworks.length === 5
                  ? "lg:grid-cols-5"
                  : confirmedNetworks.length === 4
                    ? "lg:grid-cols-4"
                    : "lg:grid-cols-3"
            }`}
          >
            {confirmedNetworks.map((n) => (
              <div
                key={n.name}
                className="flex min-h-[7rem] items-center justify-center bg-white px-5 py-7"
              >
                <Image
                  src={n.logo}
                  alt={n.name}
                  width={n.width}
                  height={n.height}
                  sizes="220px"
                  className={`w-auto ${n.className}`}
                />
              </div>
            ))}
          </div>

          {/* PBTV banner, directly under the big five (Connor, 7/29). */}
          <a
            href="https://www.pickleballtv.com/?utm_source=ppatour&utm_medium=website&utm_campaign=watch&utm_content=watch-pbtv-banner"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-px flex flex-col items-start gap-5 bg-ppa-blue px-6 py-7 transition-colors hover:bg-ppa-blue-deep sm:flex-row sm:items-center sm:justify-between sm:px-8"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <Image
                src="/ppa/networks/pickleballtv-white.svg"
                alt="PickleballTV"
                width={220}
                height={48}
                sizes="220px"
                className="h-9 w-auto shrink-0 sm:h-10"
              />
              <p className="font-display text-lg uppercase leading-tight text-white sm:text-xl">
                Every court. Every match. Live.
              </p>
            </div>
            <span className="flex h-11 shrink-0 items-center border border-white/40 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors group-hover:border-white group-hover:bg-white group-hover:text-ppa-blue">
              ▶ Stream on PBTV ↗
            </span>
          </a>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/65">
            Pro pickleball reaches national television every season — and
            PickleballTV streams every round of every Carvana PPA Tour event in
            between. The full broadcast and streaming schedule is below. All
            times Eastern.
          </p>
          <div className="mt-5">
            <Link
              href="/watch/tv"
              className="flex h-11 w-fit items-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition hover:border-white hover:bg-white hover:text-ppa-navy active:scale-[0.98]"
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

      {/* Live now — scoreboard rail. The band (heading included) is hidden
          unless a match is actually in progress, so the fallback reserves no
          height: on a normal day /watch goes straight from the TV guide to the
          next broadcast. See components/watch/WatchLiveNow.tsx. */}
      <Suspense fallback={null}>
        <LiveNowBand />
      </Suspense>

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
            {next.name}
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
                campaign: next.eventCode ?? next.slug,
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
                <span className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {b.links.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      target={b.external ? "_blank" : undefined}
                      rel={b.external ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-1 self-start border-b-2 border-ppa-blue pb-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
                    >
                      {l.cta} {b.external ? "↗" : "→"}
                    </Link>
                  ))}
                </span>
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
