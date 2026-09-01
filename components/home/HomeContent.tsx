import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { PartnerSpotlight } from "@/components/home/PartnerSpotlight";
import { PartnerWall } from "@/components/global/PartnerWall";
import { HomeHero, type HeroVariant } from "@/components/home/HomeHero";
import { ScoresBracketToggle } from "@/components/live/ScoresBracketToggle";
import { RankingsBoard } from "@/components/rankings/RankingsBoard";
import { getRankings } from "@/lib/rankings-api";
import { getEvents } from "@/lib/events-api";
import { getScores, type Champion } from "@/lib/scores-api";
import { playerInitials, playerPhoto, playerProfileHref } from "@/lib/player-photos";
import {
  daysUntil,
  eventHref,
  formatDateRange,
  getNextTournament,
  getRemainingTourEvents,
  isTournamentLive,
  nowMs,
  tierPoints,
  eventTierShort,
  tierBadgeClass,
  type Tournament,
} from "@/lib/placeholder-data";
import {
  explainers,
  logoPartnersInTierOrder,
  playersToWatch,
  showsDesignation,
} from "@/lib/home-content";
// Server-only (pulls the migrated WP archive) — safe here because HomeContent
// is rendered exclusively by app/page.tsx and app/live/page.tsx, both server
// components. Do not import this from a "use client" file.
import { allNews } from "@/lib/news";
import { getPickleballNews, pbArticleDate } from "@/lib/pb-news";

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
    image: "/ppa/tickets-worlds-crowd.jpg",
    title: "Tickets",
    blurb: "Be there for every iconic moment.",
  },
  {
    href: "/rankings",
    image: "/ppa/follow-finals-crowd.jpg",
    title: "Follow",
    blurb: "Players, World Pickleball Rankings, season standings.",
  },
  {
    href: "/play",
    image: "/ppa/play-amateur-court.jpg",
    title: "Play",
    blurb: "Register for amateur competition at every tournament.",
  },
  {
    href: "/about/sponsors",
    image: "/ppa/sponsor-carvana-boards.jpg",
    title: "Sponsor",
    blurb: "Partner with the world's leading pickleball tour.",
    highlight: true,
  },
];

// Only partners whose wordmark logo we hold scroll in the logo band, in billing
// order so the title partner and Platinum tier lead the loop rather than
// whatever position they happen to occupy in the roster array.
const MARQUEE_PARTNERS = logoPartnersInTierOrder;

// Real network marks (PNG — next/image 400s on SVG). Each renders at its own
// size on a transparent field, no white chip.
const BROADCAST: { name: string; note: string; logo?: string }[] = [
  {
    name: "PickleballTV",
    logo: "/ppa/networks/pbtv.png",
    note: "Every court, every match — the home of live PPA streaming",
  },
  {
    name: "Tennis Channel",
    logo: "/ppa/networks/tennis-channel.png",
    note: "Featured rounds & Championship Sunday on national TV",
  },
  { name: "FOX & FS1", logo: "/ppa/networks/fox.png", note: "Marquee finals on national television" },
  { name: "MATCHDAY App", logo: "/ppa/networks/matchday.png", note: "Live scores, brackets, and match alerts" },
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
 * The homepage body. Rendered by app/page.tsx (the real homepage) and by
 * app/live/page.tsx (the same page under a shifted clock, to rehearse the live
 * state before the tournament). Nothing about the live state is passed in — see
 * `clockOffsetMs` and `isLive` below.
 */

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
  clockOffsetMs = 0,
  liveEventOverride,
  heroVariant = "photo",
  heroToggle = false,
}: {
  /**
   * Preview only: milliseconds to add to this render's clock.
   *
   * ⚠ THIS IS THE ONLY PREVIEW KNOB, AND IT IS DELIBERATELY THE ONLY ONE. It
   * used to be a `live` boolean plus a live-event record plus an event override
   * plus a first-serve timestamp — four props /live set by hand, which meant the
   * preview proved the live LAYOUT renders and nothing whatsoever about whether
   * the page would flip on the day. Shifting the clock instead leaves every
   * decision below to the same code production runs: which event is next,
   * whether it is live, what the countdown reads, when it switches back.
   *
   * 0 in production, i.e. the wall clock. See app/live/page.tsx.
   */
  clockOffsetMs?: number;
  /**
   * Preview only: the tournament whose scores and bracket the Live Now band
   * should show — the one genuinely being played, not the one on the hero.
   *
   * ⚠ THE PRODUCTION HOMEPAGE DOES NOT NEED THIS AND MUST NOT START PASSING IT.
   * There, the stop on the hero IS the running tournament, so resolving the
   * UUID from its own slug (below) is correct by construction. The preview is
   * the only place the two can differ: it shifts the clock to a tournament that
   * has not happened, which has no scores to show, while a real one is
   * genuinely underway somewhere on the tour. /live passes that real one so the
   * band can be tested against live data.
   */
  liveEventOverride?: Tournament;
  /**
   * Hero treatment. `photo` (the live default) is the next event's own venue
   * shot; the alternatives are under review — see /hero-preview.
   */
  heroVariant?: HeroVariant;
  /** Preview only: render the in-hero background switcher. */
  heroToggle?: boolean;
}) {
  // Every date-derived decision on this page reads this one value, so the hero,
  // the countdown, the strips and the live check can never disagree about what
  // time it is. `clockOffsetMs` is 0 everywhere except the /live harness.
  const now = nowMs(clockOffsetMs);
  const next = getNextTournament(now);
  const countdown = daysUntil(next.startDate, now);

  /**
   * ⚠ THE HOMEPAGE FLIPS ITSELF, OFF THE CALENDAR — no deploy, no data edit.
   *
   * `getNextTournament()` returns the stop being played right now if there is
   * one, so `isTournamentLive` on it is the whole switch: the page goes live at
   * the instant the hero countdown reaches zero (both read local midnight of the
   * start date — see the note on startOfEvent) and stays live through the END of
   * the final day. Once that passes, the same selector advances to the next stop
   * and the page is back in its Next-Event state, counting down again.
   *
   * ⚠ THE 60s ISR IS LOAD-BEARING NOW. `/` is `force-static` +
   * `revalidate = 60` (app/page.tsx), so at first serve the client countdown can
   * read zero up to a minute before the server-rendered shell flips. Don't
   * lengthen that number without thinking about that morning.
   */
  const isLive = isTournamentLive(next, now);
  // World Pickleball Rankings — same live data as /rankings.
  const wpr = await getRankings();
  // In live mode /live can hand us API-sourced detail; under the auto-flip
  // `next` IS the running event, so the fallbacks are the normal path.
  const ev = {
    name: next.name,
    city: next.city,
    state: next.state,
    venue: next.venue,
    startDate: next.startDate,
    endDate: next.endDate,
  };
  // Off-season/between-events homepage: no live scores make sense, so lead with
  // the most recent tour stop's champions instead.
  const latestChampions = isLive ? null : await lastCompletedChampions();

  /**
   * The PB tournament UUID for the live scores + bracket panel.
   *
   * ⚠ THIS IS WHY THERE ARE TWO FLAGS AND NOT ONE. `isLive` comes off the
   * calendar alone and needs no feed, which is what makes the hero flip
   * reliable. The scores band additionally needs the running event's UUID — and
   * curated rows don't carry one (only feed-built events do), so this can
   * legitimately come back undefined: feed down, 429, or a stop the feed has
   * never heard of.
   *
   * ⚠ AND IT MUST NEVER FALL BACK TO `ATLANTA_EVENT_ID`, which is what the two
   * call sites below used to be hardcoded to. That is the April test event, and
   * it is FINISHED — so the moment this page could flip itself, a hardcode there
   * would publish Atlanta's completed bracket as Nationals' live scores, under
   * Nationals' name. No id → no band. A live shell over another event's bracket
   * is worse than no band at all, same ruling as the fabricated-scores fix.
   */
  const liveEventId = isLive
    ? (liveEventOverride?.tournamentUuid ??
      (await getEvents()).events.find((e) => e.slug === next.slug)?.tournamentUuid)
    : undefined;
  const showLiveScores = isLive && Boolean(liveEventId);
  // Live pickleball.com coverage. Empty until the API grant lands, in which case
  // the rail is omitted rather than showing the invented headlines it replaced.
  const ecosystem = (await getPickleballNews(4)).articles;
  // The newsroom grid: one lead + four secondaries. Real posts, newest first —
  // the hand-written `storylines` placeholders this replaced all pointed at
  // /watch, so the homepage carried no link into an actual article.
  const [leadPost, ...secondaryPosts] = allNews().slice(0, 5);
  // Next six tour stops for the "Next on Tour" strip above the callouts.
  const upNext = getRemainingTourEvents(now).slice(0, 6);

  /**
   * Hannah 7/28: rankings matter more to a visitor than latest champions, so
   * off-season the rankings board takes the block right under the callouts and
   * champions drop below it. During a live event the scores rail still leads —
   * nothing outranks live pickleball.
   *
   * ⚠ TWO STATES, NEVER THREE. Live → the real bracket/scores. Not live → the
   * champions of the last completed stop. Not live and no champions → the whole
   * band is OMITTED.
   *
   * There used to be a third branch, and it published fiction: when
   * `lastCompletedChampions()` came back null — a transient `getEvents()` or
   * `getScores()` failure, i.e. the 429s this codebase has been fighting since
   * 7/31 — the band fell through to `<ScoreRail />`, which rendered the
   * hand-authored `matches` placeholder from lib/home-content: invented players
   * (Jade Rau, Priya Anand, Bricker/Hartman) with a pulsing red LIVE chip, under
   * a "Live & Latest" heading, on the homepage, out of season. That is exactly
   * the failure the 7/29 rankings ruling exists to prevent — an API blip must
   * never turn into made-up data that looks completely plausible. The component
   * and the placeholder array are both deleted, so it cannot come back.
   */
  const scoresSection = !showLiveScores && !latestChampions ? null : (
    <>
        {/* ── Live & Latest scores ───────────────────────────── */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionHead
                label={showLiveScores ? "Live Now" : "Champions"}
                title={showLiveScores ? "Live & Latest" : "Latest Champions"}
                pulse={showLiveScores}
              />
              {/* In the champions state "Full Results" moves down beside the
                  tournament name — Dave Rogers 7/27: over here on the right it
                  gets missed. */}
              {showLiveScores && (
                <Link
                  href={`/brackets?event=${liveEventId}`}
                  className="group text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
                >
                  View Full Bracket{" "}
                  <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
              )}
            </div>

            {/* The band must SAY which event it covers (Connor, 7/20) — and
                that is whichever event's data is actually in it. Under a preview
                override the scores below belong to the tournament genuinely
                being played, so this names THAT one; labelling a live Shenzhen
                bracket "Veolia Pickleball National Championships" is the exact
                mislabelling Connor's rule exists to stop. */}
            {(() => {
              const chip = showLiveScores
                ? (liveEventOverride ?? ev)
                : latestChampions
                  ? latestChampions.event
                  : ev;
              const name = chip.name;
              return (
                <p className="mt-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 border-l-2 border-ppa-blue bg-ppa-paper px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/70">
                  {name}
                  <span className="font-medium normal-case tracking-normal text-ppa-navy/50">
                    {formatDateRange(chip.startDate, chip.endDate, true)} · {chip.city}
                    {chip.state ? `, ${chip.state}` : ""}
                  </span>
                  {!showLiveScores && latestChampions && (
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

            {showLiveScores ? (
              <div className="mt-4">
                {/* The section's "View Full Bracket" link opens the full-page
                    bracket, so the in-panel link is omitted (no expandHref). */}
                <ScoresBracketToggle eventId={liveEventId!} light />
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
            ) : null}
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
      {/* SportsOrganization + WebSite JSON-LD now lives site-wide in app/layout.tsx
          (off SITE_URL, not the old hardcoded vercel.app domain), so every page
          carries the publisher identity — not just the homepage. */}
      {/* ── Hero (event lead) ───────────────────────────────── */}
      {/* Extracted to <HomeHero> so /hero-preview can render this WHOLE page
          with a different hero treatment. Adopting one is a change to the
          `heroVariant` default above — nothing here needs touching. */}
      <HomeHero
        variant={heroVariant}
        toggle={heroToggle}
        next={next}
        ev={ev}
        countdown={countdown}
        live={isLive}
        clockOffsetMs={clockOffsetMs}
      />

      {/* ── Next on Tour (Bryce 7/28: text links + arrows, directly above the
             five callouts — next three stops, then the three after that) ──

          ⚠ HIDDEN WHILE A STOP IS BEING PLAYED (Wesley, 8/20). During an
          event the hero, the scores band and the site chrome are all about
          the tournament on court, and a strip headed "Next on Tour" pushing
          people at the stop AFTER it is competing with the thing that is
          actually happening. It returns by itself the moment the event ends,
          because `isLive` is derived from the calendar. */}
      {!isLive && (
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
                // ⚠ `min-w-0` is load-bearing, not tidying. A grid item defaults
                // to `min-width: auto`, so the column floors at the row's
                // content-based minimum and the `min-w-0` + `truncate` on the
                // name span below never gets to apply. With the FULL sponsored
                // names this grid measured 436px inside a 358px container and
                // dragged the whole homepage's layout viewport from 390 to 453 at
                // a 390px emulated device. Verified back to 390 with this on.
                <li
                  key={t.slug}
                  className={
                    i >= 3
                      ? "min-w-0 border-t border-ppa-line/70 lg:border-t-0"
                      : "min-w-0"
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
                        {t.name}
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
      )}

      {/* ── Five-Audience Lanes (Watch · Tickets · Follow · Play · Sponsor) ──
             Below sm this is a swipe rail, not a stack: five full-width 4:5
             cards ran 2,438px on a 390px phone (~3.5 screens) and walled the
             hero off from the rankings and newsroom below. As a rail it's
             331px. Cards sit at 68vw so the next one always peeks — that peek
             is the only affordance saying "swipe", so don't widen it to 100vw.
             Scrollbar-hiding utilities match EventGallery / PickleballIn90. */}
      <section
        data-reveal
        data-reveal-group
        className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5"
      >
        {LANES.map((lane, i) => (
          <Link
            key={lane.href}
            href={lane.href}
            style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
            className="group relative isolate flex aspect-[4/5] w-[68vw] shrink-0 snap-start flex-col justify-end overflow-hidden bg-ppa-navy sm:w-auto lg:aspect-auto lg:min-h-[23rem]"
          >
            <Image
              src={lane.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 68vw"
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
      {showLiveScores ? (
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

      {/* ── What's Happening on Tour ────────────────────────────
          One newsroom section: the lead + secondary grid on top, the
          pickleball.com row underneath. Merged 7/31 — this was two adjacent
          news sections ("Top Storylines" and "Latest News") saying the same
          thing twice. */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead label="Newsroom" title="What's Happening on Tour" />
            <Link
              href="/news"
              className="group text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
            >
              All News{" "}
              <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            {/* Lead story */}
            {leadPost && (
              <Link
                href={leadPost.href}
                className="group relative isolate flex aspect-[16/11] flex-col justify-end overflow-hidden bg-ppa-navy lg:col-span-3 lg:aspect-auto lg:min-h-[25rem]"
              >
                {/* 799 of the 811 migrated posts carry a featured image; the
                    12 that don't keep the navy field rather than a broken frame. */}
                {leadPost.image && (
                  <Image
                    src={leadPost.image}
                    alt={leadPost.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="will-change-transform object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className={`absolute inset-0 ${leadPost.image ? "scrim-hero" : "bg-ppa-navy-deep"}`} />
                <span className="absolute left-4 top-4 bg-ppa-blue px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                  {leadPost.category}
                </span>
                <div className="relative p-5 text-white sm:p-6">
                  <h3 className="font-display text-2xl uppercase leading-[1.02] sm:text-4xl">
                    {leadPost.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm text-white/70">
                    {leadPost.dek}
                  </p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.1em] text-white/50">
                    {leadPost.author} · {leadPost.displayDate}
                  </p>
                </div>
              </Link>
            )}

            {/* Secondary posts */}
            <div className="flex flex-col divide-y divide-ppa-line border border-ppa-line bg-white lg:col-span-2">
              {secondaryPosts.map((n) => (
                <Link
                  key={`${n.source}-${n.slug}`}
                  href={n.href}
                  className="group flex flex-1 gap-3 p-4 transition-colors hover:bg-ppa-paper"
                >
                  {/* sizes is 2× the 80px box, not 80px: object-cover on a
                      landscape source scales the image until its WIDTH covers
                      the square, so the intrinsic width needed is the box times
                      the source aspect ratio (1.5× on a 3:2 photo). Declaring
                      the box width under-fetches at DPR 1/1.25/1.5 — i.e. every
                      Windows display-scaling setting — and the thumb upscales. */}
                  <div className="relative aspect-square w-20 shrink-0 overflow-hidden bg-ppa-navy-deep">
                    {n.image && (
                      <Image
                        src={n.image}
                        alt={n.imageAlt}
                        fill
                        sizes="160px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
                      {n.category}
                    </p>
                    <h4 className="mt-0.5 font-display text-sm uppercase leading-[1.1] text-ppa-navy transition-colors group-hover:text-ppa-blue">
                      {n.title}
                    </h4>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-ppa-navy/40">
                      {n.author} · {n.displayDate}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Live pickleball.com coverage, linking out. Hidden entirely when
              the feed is unavailable — an empty row is worse than no row, and
              the placeholder headlines this replaced were invented. */}
          {ecosystem.length > 0 && (
            <div className="mt-10 border-t border-ppa-line pt-6">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/45">
                  From
                </p>
                <Image
                  src="/ppa/ecosystem/pickleball-com-lockup.svg"
                  alt="Pickleball.com"
                  width={86}
                  height={16}
                />
              </div>
              {/**
               * ⚠ SWIPE RAIL BELOW sm, GRID FROM sm UP (Wesley, 8/4: "make
               * pickleball.com a carousel on mobile"). As a stacked grid these
               * four cards each ran full-width with a 16:9 image, so the row was
               * roughly four screens of somebody else's headlines sitting between
               * our newsroom and the schedule. Same treatment as the five
               * homepage callouts (7/31) and the event gallery.
               *
               * Cards are 68vw so the NEXT ONE ALWAYS PEEKS — that peek is the
               * only affordance saying "swipe", so don't widen it to 100vw.
               *
               * ⚠ `bg-ppa-line` is `sm:` ONLY. It is the hairline trick for the
               * `gap-px` grid, and on the rail the element also carries `px-4`
               * (to bleed full-width while keeping the first card on the content
               * margin) — a line-coloured background under horizontal padding
               * paints a pale strip down both outer edges. That exact pairing put
               * one down the /vacations stat band on 8/4.
               */}
              <div className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-px sm:overflow-visible sm:border sm:border-ppa-line sm:bg-ppa-line sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
                {ecosystem.map((e) => (
                  <a
                    key={e.url}
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex w-[68vw] shrink-0 snap-start flex-col border border-ppa-line bg-white transition-colors hover:bg-ppa-paper sm:w-auto sm:shrink sm:border-0"
                  >
                    <span className="relative block aspect-[16/9] overflow-hidden bg-ppa-navy-deep">
                      {e.imageUrl && (
                        <Image
                          src={e.imageUrl}
                          alt={e.imageAlt}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 68vw"
                          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </span>
                    <span className="flex flex-1 items-start gap-2 p-4">
                      <span className="flex-1">
                        <span className="block text-sm font-semibold leading-snug text-ppa-navy transition-colors group-hover:text-ppa-blue">
                          {e.title}
                        </span>
                        <span className="mt-1 block text-[11px] uppercase tracking-[0.1em] text-ppa-navy/40">
                          {pbArticleDate(e.publishedAt) || "Pickleball.com"}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className="text-ppa-navy/30 transition-colors group-hover:text-ppa-blue"
                      >
                        ↗
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
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
            {getRemainingTourEvents(now)
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
                  <span className={`absolute right-3 top-3 ${tierBadgeClass(t)} px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] whitespace-nowrap`}>
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
                      {t.name}
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
                        {t.ticketsOnSale ? `From $${t.ticketPriceFrom}` : "Tickets soon"}
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
                  title={showsDesignation(p) ? `${p.name} — ${p.role}` : p.name}
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
                  <span className="flex h-12 w-fit items-center">
                    <Image
                      src={b.logo}
                      alt={b.name}
                      width={240}
                      height={96}
                      className="h-11 w-auto max-w-[160px] object-contain object-left"
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
