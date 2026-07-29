import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { Countdown } from "@/components/motion/Countdown";
import { withUtm } from "@/lib/utm";
import { PartnerSpotlight } from "@/components/home/PartnerSpotlight";
import { PartnerWall } from "@/components/global/PartnerWall";
import { ScoreRail } from "@/components/home/ScoreRail";
import { ScoresBracketToggle } from "@/components/live/ScoresBracketToggle";
import { WatchLiveButton } from "@/components/live/WatchLiveButton";
import { ATLANTA_EVENT_ID } from "@/lib/bracket-sample";
import { RankingsBoard } from "@/components/rankings/RankingsBoard";
import { getRankings } from "@/lib/rankings-api";
import { getEvents } from "@/lib/events-api";
import { getScores, type Champion } from "@/lib/scores-api";
import { playerInitials, playerPhoto, playerProfileHref } from "@/lib/player-photos";
import {
  daysUntil,
  eventHref,
  formatDateRange,
  getMainTourEvents,
  getNextTournament,
  tierPoints,
  eventTierShort,
  type Tournament,
} from "@/lib/placeholder-data";
import {
  ecosystemNews,
  explainers,
  leadStory,
  news,
  partners,
  playersToWatch,
  storylines,
} from "@/lib/home-content";

// Kickers ("For Fans" / "For Players" / "For Brands") dropped 7/28 — Jeff +
// Nathan: unnecessary and cluttered. Blurbs are their copy from the audit doc.
const LANES = [
  {
    href: "/watch",
    image: "/ppa/watch-broadcast-desk.jpg",
    title: "Watch",
    blurb: "Live streams, match results, and broadcast schedule.",
  },
  {
    href: "/events",
    image: "/ppa/action-waters-bright.jpg",
    title: "Tickets",
    blurb: "Be there for every iconic moment.",
  },
  {
    href: "/rankings",
    image: "/ppa/action-mxd.jpg",
    title: "Follow",
    blurb: "Players, World Pickleball Rankings, season standings.",
  },
  {
    href: "/play",
    image: "/ppa/action-singles.jpg",
    title: "Play",
    blurb: "Register for amateur competition at every tournament.",
  },
  {
    href: "/about/sponsors",
    image: "/ppa/action-md-final.jpg",
    title: "Sponsor",
    blurb: "Partner with the world's leading pickleball tour.",
    highlight: true,
  },
];

// Only partners whose wordmark logo we hold scroll in the logo band.
const MARQUEE_PARTNERS = partners.filter((p) => p.logo);

const BROADCAST: { name: string; note: string; logo?: string }[] = [
  {
    name: "PickleballTV",
    logo: "/ppa/networks/pbtv.png",
    note: "Every court, every match — the home of live PPA streaming",
  },
  {
    name: "Tennis Channel",
    logo: "/ppa/networks/tennis-channel.svg",
    note: "Featured rounds & Championship Sunday on national TV",
  },
  { name: "FOX & FS1", note: "Marquee finals on national television" },
  { name: "MATCHDAY App", note: "Live scores, brackets, and match alerts" },
];

function SectionHead({
  label,
  title,
  dark = false,
  pulse = false,
}: {
  label: string;
  title: string;
  dark?: boolean;
  pulse?: boolean;
}) {
  return (
    <div data-reveal>
      <div className="flex items-center gap-2.5">
        <span
          className={`h-2 w-2 ${pulse ? "animate-pulse rounded-full bg-ppa-live" : "bg-ppa-blue"}`}
        />
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
            dark ? "text-white/55" : "text-ppa-navy/50"
          }`}
        >
          {label}
        </p>
      </div>
      <h2
        className={`mt-2 font-display text-2xl uppercase leading-[1.02] sm:text-3xl ${
          dark ? "text-white" : "text-ppa-navy"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

/**
 * The homepage body. `live` renders the active-tournament variant (used by
 * /live): the hero swaps its Next-Event countdown for a LIVE state and the
 * scores heading pulses. The global ticker + sticky bar flip to LIVE on the
 * /live route independently (see ScoreTicker / StickyBuyBar).
 */
export type LiveEvent = {
  name: string;
  city: string;
  state: string;
  venue: string;
  startDate: string;
  endDate: string;
  ticketsUrl: string;
  /** Tournament crest for the hero badge (same slot as the homepage). */
  logo?: string;
};

/** Champion headshot (roster photo, else an initials chip) for the light
 *  homepage champions band. */
function ChampionAvatar({ name }: { name: string }) {
  const src = playerPhoto(name);
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={64}
        height={64}
        className="size-12 shrink-0 rounded-full object-cover object-top ring-2 ring-ppa-yellow"
      />
    );
  }
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ppa-navy text-xs font-bold text-white ring-2 ring-ppa-yellow/60">
      {playerInitials(name)}
    </span>
  );
}

/** Most recently completed tour event that has decided champions, with
 *  those champions — powers the non-live homepage "Champions" band. */
async function lastCompletedChampions(): Promise<{ event: Tournament; champions: Champion[] } | null> {
  const { events } = await getEvents();
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const done = events
    .filter(
      (e) =>
        e.tournamentUuid &&
        e.tierKey !== "challenger" &&
        e.region !== "international" &&
        (e.status === "completed" || (e.endDate && e.endDate.slice(0, 10) < today)),
    )
    .sort((a, b) => b.endDate.localeCompare(a.endDate));
  // Walk the most-recent few until one has champions posted.
  for (const event of done.slice(0, 4)) {
    const { champions } = await getScores(event.tournamentUuid as string);
    if (champions.length) return { event, champions };
  }
  return null;
}

export async function HomeContent({
  live = false,
  liveEvent,
}: {
  live?: boolean;
  liveEvent?: LiveEvent;
}) {
  const next = getNextTournament();
  const countdown = daysUntil(next.startDate);
  // World Pickleball Rankings — same live data as /rankings.
  const wpr = await getRankings();
  // In live mode, use real tournament data when provided (falls back to the
  // placeholder next event so the non-live homepage is unaffected).
  const ev = {
    name: liveEvent?.name ?? next.shortName,
    city: liveEvent?.city ?? next.city,
    state: liveEvent?.state ?? next.state,
    venue: liveEvent?.venue ?? next.venue,
    startDate: liveEvent?.startDate ?? next.startDate,
    endDate: liveEvent?.endDate ?? next.endDate,
  };
  // Off-season/between-events homepage: no live scores make sense, so lead with
  // the most recent tour stop's champions instead.
  const latestChampions = live ? null : await lastCompletedChampions();
  // Next six tour stops for the "Next on Tour" strip above the callouts.
  const upNext = getMainTourEvents().slice(0, 6);

  // Hannah 7/28: rankings matter more to a visitor than latest champions, so
  // off-season the rankings board takes the block right under the callouts and
  // champions drop below it. During a live event the scores rail still leads —
  // nothing outranks live pickleball.
  const scoresSection = (
    <>
        {/* ── Live & Latest scores ───────────────────────────── */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionHead
                label={live ? "Live Now" : latestChampions ? "Champions" : "Scores"}
                title={live || !latestChampions ? "Live & Latest" : "Latest Champions"}
                pulse={live}
              />
              {/* In the champions state "Full Results" moves down beside the
                  tournament name — Dave Rogers 7/27: over here on the right it
                  gets missed. */}
              {!latestChampions && (
                <Link
                  href={live ? `/brackets?event=${ATLANTA_EVENT_ID}` : "/watch"}
                  className="group text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
                >
                  {live ? "View Full Bracket" : "Full Scores & Brackets"}{" "}
                  <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
              )}
            </div>

            {/* The band must SAY which event it covers (Connor, 7/20). */}
            {(() => {
              const chip = !live && latestChampions ? latestChampions.event : ev;
              const name = !live && latestChampions ? latestChampions.event.shortName : ev.name;
              return (
                <p className="mt-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 border-l-2 border-ppa-blue bg-ppa-paper px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/70">
                  {name}
                  <span className="font-medium normal-case tracking-normal text-ppa-navy/50">
                    {formatDateRange(chip.startDate, chip.endDate, true)} · {chip.city}
                    {chip.state ? `, ${chip.state}` : ""}
                  </span>
                  {!live && latestChampions && (
                    <Link
                      href={eventHref(latestChampions.event)}
                      className="group text-ppa-blue hover:text-ppa-navy"
                    >
                      Full Results{" "}
                      <span
                        aria-hidden
                        className="inline-block transition-transform duration-300 group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </Link>
                  )}
                </p>
              );
            })()}

            {live ? (
              <div className="mt-4">
                {/* The section's "View Full Bracket" link opens the full-page
                    bracket, so the in-panel link is omitted (no expandHref). */}
                <ScoresBracketToggle eventId={ATLANTA_EVENT_ID} light />
              </div>
            ) : latestChampions ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {latestChampions.champions.map((c) => (
                  <div
                    key={c.divisionId}
                    className="flex items-center gap-4 rounded-md border border-ppa-line bg-ppa-paper p-4"
                  >
                    <div className="flex shrink-0 -space-x-3">
                      {c.players.map((p) => (
                        <ChampionAvatar key={p} name={p} />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-blue">
                        {c.division}
                      </p>
                      {/* Champion names open their profile when the player is on
                          our roster (Dave Rogers, 7/27). */}
                      {c.players.map((p) => {
                        const href = playerProfileHref(p);
                        return href ? (
                          <Link
                            key={p}
                            href={href}
                            className="block font-display text-base uppercase leading-tight text-ppa-navy transition-colors hover:text-ppa-blue"
                          >
                            {p}
                          </Link>
                        ) : (
                          <p
                            key={p}
                            className="font-display text-base uppercase leading-tight text-ppa-navy"
                          >
                            {p}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <ScoreRail />
                <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-ppa-navy/35">
                  Drag or swipe to browse
                </p>
              </div>
            )}
          </div>
        </section>
    </>
  );

  const rankingsSection = (
    <>
        {/* ── World Pickleball Rankings ───────────────────────── */}
        <section className="bg-ppa-navy">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionHead label="Standings" title="World Pickleball Rankings" dark />
              {/* Copy: Jeff + Nathan's audit doc, 7/27. */}
              <p className="max-w-xs text-sm text-white/55 sm:text-right">
                The official men&apos;s and women&apos;s world rankings —
                who&apos;s the best of the best.
              </p>
            </div>

            <div className="mt-6">
              {/* Top 10 on the home/live surfaces; full list lives on /rankings. */}
              <RankingsBoard
                divisions={wpr.divisions.map((d) => ({ ...d, entries: d.entries.slice(0, 10) }))}
              />
            </div>

            <Link
              href="/rankings"
              className="group mt-6 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:text-ppa-sky"
            >
              Full Rankings{" "}
                <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </section>
    </>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsOrganization",
            name: "Carvana PPA Tour",
            alternateName: "Professional Pickleball Association",
            sport: "Pickleball",
            url: "https://ppatour-website.vercel.app",
            logo: "https://ppatour-website.vercel.app/ppa/logos/ppa-horizontal-blue.svg",
            sameAs: [
              "https://www.instagram.com/ppatour",
              "https://x.com/ppatour",
              "https://www.youtube.com/channel/UCSP6HlrMmRqogym2aHBPHpw",
              "https://www.tiktok.com/@officialppatour",
              "https://www.facebook.com/OfficialPPATour",
            ],
          }),
        }}
      />
      {/* ── Hero (event lead) ───────────────────────────────── */}
      {/* Hero trimmed 58svh → 50svh (Bryce 7/28) to buy height for the taller
          audience callouts below. Video hero drops into this same slot. */}
      <section className="relative isolate flex min-h-[50svh] flex-col justify-end overflow-hidden bg-ppa-navy text-white">
        <Image
          src={next.image}
          alt={next.name}
          fill
          priority
          quality={65}
          sizes="100vw"
          className="animate-kenburns will-change-transform object-cover object-[center_25%] motion-reduce:animate-none"
        />
        {/* Left-weighted scrim so the venue reads on the right (Hannah, 7/28). */}
        <div className="absolute inset-0 scrim-hero-left" />
        <div className="absolute inset-0 scrim-side" />
        {/* Soften the header→hero seam: navy fades down into the hero image. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 bg-gradient-to-b from-ppa-navy to-transparent" />

        {/* Floating event crest removed (Bryce 7/28: the Nationals mark
            hovering over the hero "doesn't make a whole lot of sense there").
            The hero photo + headline already name the event. Kept on /live,
            where the crest identifies which tournament is on. */}

        {/* Live tournament crest — same hero slot/treatment as the homepage. */}
        {live && liveEvent?.logo && (
          <div
            className="pointer-events-none absolute right-4 top-16 z-[2] block motion-safe:animate-rise sm:right-8 sm:top-20 lg:right-24"
            style={{ animationDelay: "120ms" }}
          >
            <Image
              src={liveEvent.logo}
              alt=""
              width={562}
              height={702}
              className="h-24 w-auto rounded drop-shadow-[0_4px_22px_rgba(2,49,85,0.65)] sm:h-44 lg:h-64"
            />
          </div>
        )}

        {/* Floating "Featured Event" card removed on the homepage (Bryce 7/28:
            redundant — the hero itself is that event). Retained in live mode,
            where it carries the LIVE NOW label. */}
        {live && (
          <div className="pointer-events-none absolute bottom-6 right-4 z-[2] hidden flex-col items-end bg-ppa-navy-deep/70 px-3.5 py-2.5 backdrop-blur-sm md:flex lg:right-8">
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-ppa-sky">
              Live Now
            </span>
            <span className="mt-0.5 font-display text-sm uppercase leading-tight text-white">
              {ev.name}
            </span>
            <span className="mt-0.5 text-[10px] uppercase tracking-wide text-white/65">
              {formatDateRange(ev.startDate, ev.endDate, true)} · {ev.venue}
            </span>
          </div>
        )}

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-7 pt-16">
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.16em] motion-safe:animate-rise"
            style={{ animationDelay: "80ms" }}
          >
            {live ? (
              <>
                <span className="flex items-center gap-1.5 bg-ppa-live px-2 py-0.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" />
                  Live Now
                </span>
                <span className="text-white/70">
                  {ev.city}, {ev.state}
                </span>
                <span className="text-white/25">/</span>
                <span className="text-ppa-yellow">Matches in progress</span>
              </>
            ) : (
              <>
                <span className="bg-ppa-blue px-2 py-0.5">Next Event</span>
                {/* Dave Rogers 7/27: "I would like to click on Cary, NC and see
                    where that is" — goes to the event's Plan Your Trip guide. */}
                <Link
                  href={`${eventHref(next)}#travel`}
                  className="text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {next.city}, {next.state}
                </Link>
                <span className="text-white/25">/</span>
                <span className="text-ppa-yellow">
                  <Countdown
                    targetIso={next.startDate}
                    fallback={`${countdown} ${countdown === 1 ? "Day" : "Days"} Out`}
                  />
                </span>
              </>
            )}
          </div>

          <h1
            className="mt-3 max-w-[18ch] font-display text-[clamp(1.9rem,5.4vw,3.25rem)] uppercase leading-[0.98] motion-safe:animate-rise"
            style={{ animationDelay: "160ms" }}
          >
            {/* Hero headline shows the full event name (e.g. "Veolia Pickleball
                National Championships"); in live mode it's the live event's name.
                The short form stays on the scores-band chip below. */}
            {live ? ev.name : next.name}
          </h1>

          <div
            className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wide text-white/75 motion-safe:animate-rise"
            style={{ animationDelay: "240ms" }}
          >
            <span>{formatDateRange(ev.startDate, ev.endDate)}</span>
            <span className="text-white/25">|</span>
            <span>{ev.venue}</span>
            <span className="text-white/25">|</span>
            {/* Dave Rogers 7/27: "I would like to click on 2,000 rankings
                points and find out what that means." */}
            {live ? (
              <span className="text-ppa-yellow">▶ Live on PickleballTV</span>
            ) : (
              <Link
                href="/about/how-it-works"
                className="text-ppa-yellow underline-offset-4 transition-colors hover:underline"
              >
                {tierPoints(next).toLocaleString()} Ranking Points
              </Link>
            )}
          </div>

          <div
            className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap motion-safe:animate-rise"
            style={{ animationDelay: "320ms" }}
          >
            {live ? (
              <>
                <WatchLiveButton className="group flex h-11 items-center justify-center gap-1.5 bg-ppa-live px-6 text-xs font-bold uppercase tracking-[0.12em] transition hover:bg-ppa-live-deep active:scale-[0.98]">
                  ▶ Watch Live
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </WatchLiveButton>
                <Link
                  href="/watch"
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-ppa-navy active:scale-[0.98]"
                >
                  Scores & Brackets
                </Link>
                <Link
                  href="/events"
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-ppa-navy active:scale-[0.98]"
                >
                  Explore the Event
                </Link>
              </>
            ) : (
              <>
                <a
                  href={withUtm(next.ticketsUrl, {
                    campaign: next.slug,
                    content: "home-hero-buy-tickets",
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-11 items-center justify-center gap-1.5 bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] transition hover:bg-ppa-blue-deep active:scale-[0.98]"
                >
                  Buy Tickets — From ${next.ticketPriceFrom}
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </a>
                <a
                  href={withUtm(next.registerUrl, {
                    campaign: next.slug,
                    content: "home-hero-register",
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-11 items-center justify-center gap-1.5 border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-ppa-navy active:scale-[0.98]"
                >
                  Register to Play
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    ↗
                  </span>
                </a>
                <Link
                  href={eventHref(next)}
                  className="group flex h-11 items-center justify-center gap-1.5 border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-ppa-navy active:scale-[0.98]"
                >
                  Explore the Event
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </Link>
                <Link
                  href="/watch"
                  className="hidden h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-ppa-navy active:scale-[0.98] sm:flex"
                >
                  ▶ How to Watch
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="relative h-1 bg-ppa-blue" />
      </section>

      {/* ── Next on Tour (Bryce 7/28: text links + arrows, directly above the
             five callouts — next three stops, then the three after that) ── */}
      <section className="border-b border-ppa-line bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-ppa-blue" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                Next on Tour
              </p>
            </div>
            <Link
              href="/events"
              className="group text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-blue transition-colors hover:text-ppa-blue-deep"
            >
              Full 2026 Schedule{" "}
              <span
                aria-hidden
                className="inline-block transition-transform duration-300 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>

          <ul className="mt-4 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {upNext.map((t, i) => (
              <li
                key={t.slug}
                className={
                  i >= 3
                    ? "border-t border-ppa-line/70 lg:border-t-0"
                    : undefined
                }
              >
                <Link
                  href={eventHref(t)}
                  className="group flex items-baseline justify-between gap-4 border-b border-ppa-line/70 py-2.5 lg:border-b-0"
                >
                  <span className="min-w-0">
                    <span
                      className={`block truncate font-display uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue ${
                        i < 3 ? "text-base" : "text-sm text-ppa-navy/75"
                      }`}
                    >
                      {t.shortName}
                    </span>
                    <span className="mt-0.5 block text-[11px] uppercase tracking-wide text-ppa-navy/50">
                      {formatDateRange(t.startDate, t.endDate)} · {t.city},{" "}
                      {t.state}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 text-ppa-blue transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Five-Audience Lanes (Watch · Tickets · Follow · Play · Sponsor) ── */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-5">
        {LANES.map((lane, i) => (
          <Link
            key={lane.href}
            href={lane.href}
            data-reveal
            style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
            className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden bg-ppa-navy lg:aspect-auto lg:min-h-[23rem]"
          >
            <Image
              src={lane.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
              className="will-change-transform object-cover grayscale-[25%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
            />
            <div className="absolute inset-0 scrim-hero" />
            {lane.highlight && (
              <span className="absolute right-4 top-4 bg-ppa-yellow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-ppa-navy">
                Premium
              </span>
            )}
            <div className="relative w-full p-5 text-white">
              <h3 className="font-display text-3xl uppercase leading-none">
                {lane.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-white/70">
                {lane.blurb}
              </p>
              <span className="mt-2.5 inline-block text-[10px] font-bold uppercase tracking-[0.12em] text-white transition-colors group-hover:text-ppa-yellow">
                Enter →
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* Stat band removed (Connor 7/27: the 25 stops / $5.2M / 4M sessions /
          150K fans bar "isn't doing anything" — lead with the next event). */}

      {/* Order flips off-season — see the note on scoresSection. */}
      {live ? (
        <>
          {scoresSection}
          {rankingsSection}
        </>
      ) : (
        <>
          {rankingsSection}
          {scoresSection}
        </>
      )}

      {/* ── Top Storylines ──────────────────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead label="The Storylines" title="What's Happening on Tour" />
            <Link
              href="/watch"
              className="group text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
            >
              All Stories{" "}
              <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            {/* Lead story */}
            <Link
              href="/watch"
              className="group relative isolate flex aspect-[16/11] flex-col justify-end overflow-hidden bg-ppa-navy lg:col-span-3 lg:aspect-auto lg:min-h-[25rem]"
            >
              <Image
                src={leadStory.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="will-change-transform object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 scrim-hero" />
              <span className="absolute left-4 top-4 bg-ppa-blue px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                {leadStory.kicker}
              </span>
              <div className="relative p-5 text-white sm:p-6">
                <h3 className="font-display text-2xl uppercase leading-[1.02] sm:text-4xl">
                  {leadStory.headline}
                </h3>
                <p className="mt-2 max-w-xl text-sm text-white/70">
                  {leadStory.dek}
                </p>
                <p className="mt-3 border-l-2 border-ppa-yellow pl-3 text-xs leading-relaxed text-white/85">
                  <span className="font-bold uppercase tracking-[0.1em] text-ppa-yellow">
                    Why it matters ·{" "}
                  </span>
                  {leadStory.whyItMatters}
                </p>
              </div>
            </Link>

            {/* Secondary storylines */}
            <div className="flex flex-col divide-y divide-ppa-line border border-ppa-line bg-white lg:col-span-2">
              {storylines.map((s) => (
                <Link
                  key={s.headline}
                  href="/watch"
                  className="group flex flex-1 gap-3 p-4 transition-colors hover:bg-ppa-paper"
                >
                  <div className="relative aspect-square w-20 shrink-0 overflow-hidden bg-ppa-navy">
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
                      {s.kicker}
                    </p>
                    <h4 className="mt-0.5 font-display text-sm uppercase leading-[1.1] text-ppa-navy">
                      {s.headline}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-ppa-navy/55">
                      <span className="font-bold text-ppa-navy/75">
                        Why it matters ·{" "}
                      </span>
                      {s.whyItMatters}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Latest News ─────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead label="Newsroom" title="Latest News" />

          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            {/* PPA Tour's own newsroom */}
            <div className="lg:col-span-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/45">
                From the PPA Tour
              </p>
              <div className="mt-2 border-t border-ppa-line">
                {news.slice(0, 5).map((n) => (
                  <Link
                    key={n.title}
                    href={n.href}
                    className="group flex items-start gap-4 border-b border-ppa-line py-4"
                  >
                    <span className="w-16 shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-blue sm:w-20">
                      {n.category}
                    </span>
                    <span className="flex-1">
                      <span className="block font-display text-base uppercase leading-[1.12] text-ppa-navy transition-colors group-hover:text-ppa-blue">
                        {n.title}
                      </span>
                      <span className="mt-1 block text-[11px] uppercase tracking-[0.1em] text-ppa-navy/40">
                        PPA Tour · {n.date}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                href="/news"
                className="group mt-5 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
              >
                All PPA Tour News{" "}
              <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>

            {/* Linked from Pickleball.com */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/45">
                From Pickleball.com
              </p>
              <div className="mt-2 flex flex-col gap-px border border-ppa-line bg-ppa-line">
                {ecosystemNews.map((e) => (
                  <a
                    key={e.title}
                    href={e.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2 bg-white p-4 transition-colors hover:bg-ppa-paper"
                  >
                    <span className="flex-1">
                      <span className="block text-sm font-semibold leading-snug text-ppa-navy transition-colors group-hover:text-ppa-blue">
                        {e.title}
                      </span>
                      <span className="mt-1 block text-[11px] uppercase tracking-[0.1em] text-ppa-navy/40">
                        {e.date}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="text-ppa-navy/30 transition-colors group-hover:text-ppa-blue"
                    >
                      ↗
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── The Tour / schedule ────────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead label="2026 Season" title="The Tour" />
            {/* Copy: Jeff + Nathan's audit doc, 7/27. */}
            <p className="max-w-xs text-sm text-ppa-navy/55 sm:text-right">
              Majors, Cups, and Opens — every Carvana PPA Tour stop carries
              crucial ranking points toward the PPA Finals.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {getMainTourEvents()
              .slice(0, 6)
              .map((t, i) => (
                <article
                  key={t.slug}
                  data-reveal
                  style={{ "--reveal-delay": `${(i % 3) * 90}ms` } as React.CSSProperties}
                  className="group relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden bg-ppa-navy transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
                >
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="will-change-transform object-cover grayscale-[30%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 scrim-card" />
                  <span className="absolute left-3 top-2 font-display text-2xl leading-none text-white/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute right-3 top-3 bg-ppa-yellow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ppa-navy">
                    {eventTierShort(t)} · {tierPoints(t).toLocaleString()}
                  </span>
                  <div className="relative p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                      {t.presentedBy ? `Presented by ${t.presentedBy}` : "PPA Tour"}
                    </p>
                    <Link
                      href={eventHref(t)}
                      className="mt-0.5 block font-display text-lg uppercase leading-[1.05] text-white after:absolute after:inset-0"
                    >
                      {t.shortName}
                    </Link>
                    <p className="mt-1 text-xs text-white/60">
                      {formatDateRange(t.startDate, t.endDate)} · {t.city}
                      {t.state ? `, ${t.state}` : ""}
                    </p>
                    <span className="mt-3 flex items-center justify-between gap-3">
                      <span className="inline-flex h-8 items-center gap-1.5 bg-ppa-blue px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors group-hover:bg-ppa-blue-deep">
                        Event Guide
                        <span
                          aria-hidden
                          className="transition-transform duration-300 group-hover:translate-x-0.5"
                        >
                          →
                        </span>
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ppa-yellow">
                        From ${t.ticketPriceFrom}
                      </span>
                    </span>
                  </div>
                </article>
              ))}
          </div>

          <Link
            href="/events"
            className="group mt-6 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
          >
            Full 2026 Schedule{" "}
              <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      {/* ── Players to Watch ────────────────────────────────── */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead label="The Athletes" title="Players to Watch" dark />
            <Link
              href="/athletes"
              className="group text-xs font-bold uppercase tracking-[0.12em] text-ppa-yellow hover:text-white"
            >
              All Athletes{" "}
              <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {playersToWatch.map((p) => (
              <Link
                key={p.slug}
                href={`/athletes/${p.slug}`}
                className="group flex flex-col overflow-hidden border border-white/10 bg-ppa-navy"
              >
                <div className="relative aspect-[5/4] overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="will-change-transform object-cover object-top transition-transform duration-700 group-hover:scale-105"
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

      {/* ── Why It Matters (explainers) ─────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead label="New to the Tour" title="Why It Matters" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {explainers.map((e, i) => (
              <div
                key={e.q}
                className="flex flex-col border border-ppa-line bg-white p-5"
              >
                <span className="font-display text-2xl leading-none text-ppa-blue">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-base uppercase leading-[1.1] text-ppa-navy">
                  {e.q}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ppa-navy/60">
                  {e.a}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/watch"
            className="group mt-6 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
          >
            Start Watching{" "}
              <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      {/* ── Partners ────────────────────────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead
              label="Partners"
              title="The Official Partners of the PPA Tour"
            />
            <Link
              href="/about/sponsors#inquire"
              className="text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
            >
              Become a Partner →
            </Link>
          </div>

          {/* Flagship spotlight, then the full official-partner directory */}
          <div className="mt-6">
            <PartnerSpotlight />
          </div>
          <div className="mt-4">
            <PartnerWall />
          </div>

          {/* Logo marquee — auto-scrolls, pauses on hover */}
          <div
            className="group mt-6 overflow-hidden border-y border-ppa-line bg-white py-5"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
            }}
          >
            <div className="flex w-max items-center gap-14 animate-marquee motion-reduce:animate-none group-hover:[animation-play-state:paused]">
              {[...MARQUEE_PARTNERS, ...MARQUEE_PARTNERS].map((p, idx) => (
                <div
                  key={idx}
                  className="flex h-10 shrink-0 items-center justify-center"
                  title={`${p.name} — ${p.role}`}
                >
                  <Image
                    src={p.logo!}
                    alt={p.name}
                    width={p.logoWidth!}
                    height={p.logoHeight!}
                    sizes="140px"
                    className="max-h-10 w-auto max-w-[140px] object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Where to Watch ──────────────────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead label="Broadcast" title="Where to Watch" />
          <div className="mt-6 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2 lg:grid-cols-4">
            {BROADCAST.map((b) => (
              <div key={b.name} className="flex flex-col bg-ppa-paper p-5">
                {b.logo ? (
                  <span className="flex h-9 w-fit items-center rounded bg-white px-2.5">
                    <Image
                      src={b.logo}
                      alt={b.name}
                      width={120}
                      height={36}
                      className="h-5 w-auto object-contain"
                    />
                  </span>
                ) : (
                  <span className="text-sm text-ppa-blue">▶</span>
                )}
                <p className="mt-2 font-display text-lg uppercase leading-none text-ppa-navy">
                  {b.name}
                </p>
                <p className="mt-1.5 text-xs text-ppa-navy/55">{b.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Email capture ───────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-ppa-navy">
        <Image
          src="/ppa/action-waters-bright.jpg"
          alt=""
          fill
          sizes="100vw"
          className="will-change-transform object-cover object-center opacity-20"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="fan" />
        </div>
      </section>
    </>
  );
}
