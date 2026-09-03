import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { EventConcierge } from "@/components/events/EventConcierge";
import { EventTabNav } from "@/components/events/EventTabNav";
import { FirstServeCountdown } from "@/components/events/FirstServeCountdown";
import { EventGallery } from "@/components/events/EventGallery";
import { EventSponsors } from "@/components/events/EventSponsors";
import { RegisteredCount } from "@/components/events/RegisteredCount";
import { VolunteerModalButton } from "@/components/events/VolunteerModalButton";
import { BookGroupRateLink } from "@/components/events/BookGroupRateLink";
import { EngineHotelLink, EngineStay } from "@/components/events/EngineStay";
import { publishedHotelsFor } from "@/lib/published-hotels";
import { TripBuilder } from "@/components/events/TripBuilder";
import type { TripEvent } from "@/lib/trip";
import { buildTripEvent } from "@/lib/trip-event";
import { ResultsPanel } from "@/components/live/ResultsPanel";
import { BracketPanel } from "@/components/live/BracketPanel";
import { ScoresBracketToggle } from "@/components/live/ScoresBracketToggle";
import { ChampionsBanner } from "@/components/live/ChampionsBanner";
import { ReplayGallery } from "@/components/live/ReplayGallery";
import { getDefendingChampions } from "@/lib/defending-champions";
import { getEventField } from "@/lib/event-field";
import { getReplayPlaylistId } from "@/lib/event-replays";
import { getPlayersToWatch } from "@/lib/players-to-watch";
import { playerInitials, playerPhoto, playerProfileHref } from "@/lib/player-photos";
import { getPlaylistVideos } from "@/lib/youtube";
import { Countdown } from "@/components/motion/Countdown";
import { getBroadcast } from "@/lib/broadcast";
import { channelsByDay, watchCardsFor, weekdayOf } from "@/lib/event-watch";
import { getEventGuide, parkingFor, parkingText } from "@/lib/event-guides";
import { onSiteFor } from "@/lib/onsite";
import { spotlightFor } from "@/lib/event-spotlight";
import { ParkingDetails } from "@/components/events/ParkingDetails";
import { getEventSchedule } from "@/lib/event-schedule";
import { stageScheduleFor } from "@/lib/event-stage";
import { StageSchedule } from "@/components/events/StageSchedule";
import { getEvents } from "@/lib/events-api";
import { resolveEvent } from "@/lib/resolve-event";
import { getArticlesForEvent } from "@/lib/news-articles";
import {
  daysUntil,
  isTournamentLive,
  eventHref,
  eventYear,
  formatDate,
  formatDateRange,
  eventTierLabel,
  tierPoints,
  eventTierShort,
  tierBadgeClass,
  whyItMattersHeading,
  type Tournament,
  tournaments,
} from "@/lib/placeholder-data";
import { withUtm, withCampaign } from "@/lib/utm";
import { admissionTiersFor, ticketsOnSale } from "@/lib/tixr-prices";
import { buildTicketGrid } from "@/lib/ticket-grid";
import { TicketGrid } from "@/components/events/TicketGrid";
import { buildEventJsonLd } from "@/lib/event-schema";
import { breadcrumbJsonLd } from "@/lib/breadcrumbs";

type Params = { params: Promise<{ year: string; slug: string }> };

/** Shared by generateMetadata and the on-page SportsEvent JSON-LD so the meta
 *  description and the structured-data description never drift. */
function eventMetaDescription(t: Tournament): string {
  const where = t.state ? `${t.city}, ${t.state}` : t.city;
  return `${eventTierLabel(t)} · ${formatDateRange(t.startDate, t.endDate, true)} · ${where} · ${t.prizeMoney} total payout. Schedule, players, tickets, trip guide, and how to watch.`;
}


/**
 * ⚠ THIS PAGE HAD NO `revalidate` AT ALL, AND ITS OWN COMMENT CLAIMED ONE.
 * "recomputed on the page's daily revalidate" sat above the `completed` check
 * while `generateStaticParams` made the page fully static — so an event could not
 * become completed, and now cannot become LIVE, without a redeploy. 60s matches
 * the homepage, which flips on the same calendar check: click through from a
 * live homepage and the event page has to agree with it.
 *
 * The scores inside the section are client-polled either way; what this number
 * governs is whether the section exists yet.
 */
export const revalidate = 60;

export async function generateStaticParams() {
  const { events } = await getEvents();
  const seen = new Set<string>();
  const params: { year: string; slug: string }[] = [];
  const add = (t: Tournament) => {
    const year = eventYear(t);
    const key = `${year}/${t.slug}`;
    if (seen.has(key)) return;
    seen.add(key);
    params.push({ year, slug: t.slug });
  };
  // ⚠ `hasInternalPage !== false`, matching the gate in resolveEvent — without
  // it this prerendered a page for every curated international stop, which is
  // the other half of the 36 fabricated event pages. `!== false` rather than a
  // truthiness test because PAST_EVENTS (all U.S.) leave the field unset, and
  // the card components read an unset field as internal.
  //
  // This also covers `detailsComingSoon` without naming it: `buildSchedule`
  // derives `hasInternalPage: r.type === "ppa" && !r.detailsComingSoon`, so an
  // announced-but-unplaced stop is already excluded here. Keep those two in
  // step — if the derivation changes, this loop needs the flag explicitly.
  for (const t of tournaments) {
    if (t.tierKey !== "challenger" && t.hasInternalPage !== false) add(t);
  }
  for (const e of events) if (e.hasInternalPage) add(e);
  return params;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { year, slug } = await params;
  const resolved = await resolveEvent(year, slug);
  // A link-out event redirects, so it never renders this metadata.
  if (resolved?.kind !== "internal") return { title: "Event" };
  const t = resolved.event;
  const description = eventMetaDescription(t);
  // No `openGraph.images` / `twitter.images` here on purpose: the file-based
  // `opengraph-image.tsx` in this folder generates the designed 1200×630 event
  // card, and Next appends file-convention images to whatever is set in
  // metadata. Setting a raw off-ratio photo here emitted a SECOND og:image that
  // competed with (and on most scrapers preceded) the designed card. Let the
  // file convention be the single source of the share card.
  return {
    title: t.name,
    description,
    openGraph: {
      title: `${t.name} — Carvana PPA Tour`,
      description,
    },
    twitter: { card: "summary_large_image" },
  };
}

/* ⚠ HOW_TO_WATCH IS GONE, NOT EDITED. It was a module-level constant —
   PickleballTV · Tennis Channel · MATCHDAY, identical on every event page —
   so the Veolia Arizona Open, which has ZERO Tennis Channel windows, ran a
   Tennis Channel card promising "Championship Sunday on national television"
   while its real FS1 window sat in the table below with no card. Deleting the
   constant rather than rewriting it makes every consumer a type error, so no
   surface can quietly keep the old behaviour (the `shortName` precedent).
   Cards now derive from the event's own windows: lib/event-watch.ts. */

type Day = {
  date: string;
  iso: string;
  label: string;
  gates: string;
  firstServe: string;
  live?: string;
};

// Progression draw — the format the pros play at every stop (Dillon Segur,
// 8/10: "All pros use progression draw all the time"). The whole field advances
// one round per day into Championship Sunday, instead of undifferentiated "Pro
// main draw" days. Rounds are named by distance from the final so this holds for
// any event length: a smaller 1,000-point Open simply enters the ladder later
// than a full 64-draw. Nationals carries its own override in lib/event-schedule.ts;
// this template is every other stop — opens, cups and slams.
const PRO_ROUNDS = [
  "Championship Sunday — Finals", // fromEnd 0
  "Pro semifinals", //               fromEnd 1
  "Pro quarterfinals", //            fromEnd 2
  "Pro round of 16", //              fromEnd 3
  "Pro round of 32", //              fromEnd 4
  "Pro round of 64", //              fromEnd 5
];

/**
 * ⚠ `live` IS NO LONGER INVENTED HERE. This used to hardcode "FOX · PBTV" on
 * Championship Sunday and "Tennis Channel · PBTV" on the semis and quarters for
 * every event on the template, which put a broadcaster's name against rounds
 * nobody had confirmed — and contradicted the event's real sheet data where we
 * had it. The channel now comes from lib/broadcast.ts, matched by weekday, and
 * is simply absent when the sheet says nothing.
 */
function buildSchedule(startIso: string, endIso: string, slug: string): Day[] {
  const channels = channelsByDay(slug);
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const days: Day[] = [];
  const cursor = new Date(start);
  const last = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  let i = 0;
  while (cursor <= end) {
    let label = "Pro main draw";
    let gates = "9:00 AM";
    let firstServe = "10:00 AM";
    const fromEnd = last - i;
    if (i === 0) {
      label = "Amateur & junior brackets";
      gates = "8:00 AM";
      firstServe = "9:00 AM";
    } else if (i === 1) {
      label = "Senior Open + pro qualifying";
      gates = "8:00 AM";
      firstServe = "9:00 AM";
    } else if (fromEnd === 0) {
      label = PRO_ROUNDS[0];
      gates = "10:00 AM";
      firstServe = "11:00 AM";
    } else if (fromEnd <= 5) {
      label = PRO_ROUNDS[fromEnd];
    } else {
      // Longer lead-in than a 64-draw ladder — earliest pro rounds still play.
      label = PRO_ROUNDS[5];
    }
    const iso = cursor.toISOString().slice(0, 10);
    // Real channels for this weekday, or none. Never a guess.
    const live = channels.get(weekdayOf(iso));
    days.push({
      date: formatDate(iso),
      iso,
      label,
      gates,
      firstServe,
      live,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    i++;
  }
  return days;
}

export default async function EventPage({ params }: Params) {
  const { year, slug } = await params;
  const resolved = await resolveEvent(year, slug);
  if (!resolved) notFound();
  if (resolved.kind === "link-out") {
    // The tour that runs it owns the page. No URL for it (nothing in the feed,
    // nothing curated) → 404, because a stub of our own is what this gate
    // exists to stop.
    if (!resolved.href) notFound();
    redirect(resolved.href);
  }
  const t = resolved.event;

  const countdown = daysUntil(t.startDate);
  const days = buildSchedule(t.startDate, t.endDate, t.slug);
  const broadcast = getBroadcast(t.slug);
  // The channels THIS event is actually on — see lib/event-watch.ts.
  const watchCards = watchCardsFor(t.slug);
  const guide = getEventGuide(t.slug);
  // Finalized details for this stop, or the approved holding line. Every parking
  // surface on the page (and the concierge) reads this one value.
  const parking = parkingFor(t.slug);
  const realSchedule = getEventSchedule(t.slug);
  /**
   * ⚠ THE OVERRIDE'S OWN `live` VALUES ARE NOT USED, and the reason is that
   * they were wrong. lib/event-schedule.ts is hand-authored, and Nationals'
   * entry credited Tennis Channel on Championship Sunday alone — while the
   * 8/13 broadcast sheet has TC carrying Thursday, Friday, Saturday AND Sunday.
   * So the tour's biggest event told people three days of national TV coverage
   * did not exist. Deriving from lib/broadcast.ts here means the Order of Play,
   * the Watch table and the channel cards all answer from one transcription.
   */
  const dayChannels = channelsByDay(t.slug);
  const mapQuery = guide?.mapQuery ?? `${t.venue}, ${t.city}, ${t.state}`;
  // Hotels published from Jackalope (Kristen's live blocks) override the static
  // guide list when present, matched by city; otherwise the guide's own hotels.
  const publishedHotels = await publishedHotelsFor(t.city);
  const stayHotels = publishedHotels ?? guide?.hotels ?? [];
  /**
   * What the Engine links need, and nothing more. Built from the RESOLVED event
   * `t`, so it inherits the feed overlays above — a stop whose dates moved (the
   * Malibu Cup, 8/17) prefills a fan's stay on the dates the tour is actually
   * playing, not the curated row's stale pair.
   */
  const engineEvent = {
    slug: t.slug,
    eventCode: t.eventCode,
    city: t.city,
    state: t.state,
    startDate: t.startDate,
    endDate: t.endDate,
  };

  // Serializable event context for the Trip Builder wizard — built by the shared
  // helper so the on-page wizard and the emailed plan can't drift.
  const tripEvent: TripEvent = await buildTripEvent(t);

  /**
   * Real Tixr tiers, not arithmetic. These were `base`, `base * 2` and
   * `round(base * 2.6)` with invented names — so Nationals advertised
   * "Reserved Seating from $118" when no such ticket exists and the actual
   * grounds pass is $25.
   *
   * Cheapest admission first, capped at three: the full ladder runs to a $1,500
   * On Court VIP and reads as a price list rather than an entry point. Clinics,
   * camps and King of the Court are filtered out upstream — they aren't
   * admission. Falls back to the old shape only when we have no Tixr listing.
   */
  /**
   * Whether this stop is listed on Tixr at all. When it isn't, we publish no
   * price and no ticket link anywhere on the page — see lib/tixr-prices.ts.
   */
  const onSale = ticketsOnSale(t.ticketsUrl);
  const description = eventMetaDescription(t);
  /**
   * Where a premium parking pass is bought — the event's own Tixr page, since
   * there is no pass-specific listing. Null when tickets aren't on sale, which
   * leaves "Tixr" as plain text in the parking copy rather than handing out a
   * Tixr link for a stop we're deliberately not selling.
   */
  const parkingPassUrl = onSale
    ? withUtm(t.ticketsUrl, {
        campaign: t.eventCode ?? t.slug,
        content: "event-parking-premium",
      })
    : null;
  /**
   * Per-day pricing, when Tixr sells this stop day by day (it sells most of them
   * as a week-long parent listing plus one listing per finals day). Null for stops
   * with only a single flat listing — those keep the tier cards below.
   */
  const ticketGrid = onSale ? buildTicketGrid(t.ticketsUrl, t.startDate, t.endDate) : null;
  const showGrid = Boolean(ticketGrid?.hasPerDayPricing);
  /**
   * A shot of this stop's grounds for the Tickets row. Deliberately the THIRD
   * gallery photo where there is one: `[0]` is the event card image and `[1]`
   * is the venue-section fallback, so leading with either prints the same
   * picture twice on one page. Falls back down the list, then to the event's
   * own image — never to another city's, since `t.gallery` is synced per venue
   * (lib/venue-photos.ts).
   */
  const ticketPhoto = t.gallery?.[2] ?? t.gallery?.[0] ?? t.image ?? null;
  const realTiers = admissionTiersFor(t.ticketsUrl)
    .filter((x) => !x.soldOut)
    .slice(0, 3);
  const base = t.ticketPriceFrom;
  const ticketTiers = realTiers.length
    ? realTiers.map((x) => ({
        name: x.name,
        from: x.price,
        blurb: x.allIn
          ? `$${x.allIn.toFixed(2)} with fees, per Tixr.`
          : "Sold through Tixr.",
      }))
    : [
        { name: "Grounds Pass", from: base, blurb: "All-day access to the outer courts and festival grounds." },
        { name: "Reserved Seating", from: base * 2, blurb: "Assigned seats at Championship Court for your session." },
        { name: "Championship Sunday", from: Math.round(base * 2.6), blurb: "The finals — the best seats for the title matches." },
      ];

  // Next stops on the domestic tour (excludes international sister-tour
  // stops and challengers), soonest first. Prefer events starting after this
  // one; top up from the rest of the season so it's always full.
  const mainTour = tournaments
    .filter(
      (x) =>
        x.slug !== t.slug &&
        x.region !== "international" &&
        x.tierKey !== "challenger" &&
        x.status !== "completed",
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const otherTournaments = [
    ...mainTour.filter((x) => x.startDate > t.startDate),
    ...mainTour.filter((x) => x.startDate <= t.startDate),
  ].slice(0, 3);

  const coverage = getArticlesForEvent(t.slug);
  // Completed once the tour marks it so, OR once the current date is past the
  // event's end date (recomputed on the page's daily revalidate).
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const completed = t.status === "completed" || (t.endDate ? t.endDate.slice(0, 10) < todayKey : false);
  // Completed events show champions + final scores (any event with a UUID);
  // full brackets only where we have the draw data (Atlanta for now).
  const uuid = t.tournamentUuid;
  const showResults = completed && Boolean(uuid);
  /**
   * Being played right now — the same calendar check the homepage flips on
   * (lib/placeholder-data), so the two surfaces cannot disagree about whether
   * the tour is on. Needs the tournament UUID as well, since without one there
   * is no scoreboard to show.
   */
  const showLiveScores = !completed && isTournamentLive(t) && Boolean(uuid);
  /**
   * First serve has happened — the stop is being played, or it is over.
   *
   * Connor, 9/1: "As soon as the event starts, Plan Your Trip goes away."
   * A travel guide is a pre-trip surface: once the gates are open, the fan
   * who is here wants the Venue Guide and the on-site Today screen, and the
   * fan at home is not booking a flight to a tournament that started. Note
   * this is NOT `showLiveScores` — that one also needs a tournament UUID, and
   * whether we hold a scoreboard has nothing to do with whether the trip is
   * still plannable.
   */
  const started = completed || isTournamentLive(t);
  // Brackets are built live from the match feed for any completed event.
  const showBracket = showResults;

  // Tournament replays — YouTube playlist mapped by slug (lib/event-replays.ts),
  // fetched server-side. Empty until a playlist ID is configured / a key exists.
  const replayPlaylistId = getReplayPlaylistId(t.slug);
  const replays = replayPlaylistId ? await getPlaylistVideos(replayPlaylistId) : [];
  const showReplays = replays.length > 0;

  // Last season's winners per division. A curated `defendingChampions` on the
  // record wins; otherwise the prior-year podium generated into
  // lib/data/defending-champions.json. [] → the honest fallback copy below.
  const defendingChampions = t.defendingChampions?.length
    ? t.defendingChampions
    : getDefendingChampions(year, t.slug);

  /**
   * ⚠ THE DRAW UUID IS NOT THE RESULTS UUID, AND THAT SEPARATION IS DELIBERATE.
   * `tournamentUuid` is API-sourced only and `resolveEvent` lets a CURATED
   * record win, so it is absent on every hand-authored stop — Nationals
   * included. That is why the draw surfaces below were dark on exactly the
   * events people care most about: not a data problem, a plumbing one.
   *
   * Looked up from the live feed here, the same way `/today` does it, rather
   * than added to `resolveEvent`'s overlay — that record also feeds results,
   * the champions banner and the registered count, and handing those a UUID
   * they have never had is a behaviour change to a live page (8/19 note).
   * So `uuid` above keeps its exact meaning and completed events are
   * byte-identical; only the draw reads `drawUuid`.
   */
  const drawUuid = t.tournamentUuid ?? (await getEvents()).events.find((e) => e.slug === t.slug)?.tournamentUuid;

  // Players to Watch is driven by the published draw: no draw, no column.
  const field = await getEventField(drawUuid);
  const watchPicks = getPlayersToWatch(field, defendingChampions, `${year}/${t.slug}`);

  /**
   * The draw, before the event — the bracket everyone already builds for
   * COMPLETED stops, shown from the moment the draw drops instead of only
   * after the last ball.
   *
   * ⚠ GATED ON `field.published`, NOT on the UUID. The ten pro shells exist as
   * soon as an event is on the calendar, so a UUID alone would publish an
   * empty bracket for every future stop on the schedule. `field.published` is
   * true only once a real, non-placeholder player is in a draw — which is the
   * same thing "the draw is out" means to a fan.
   */
  /**
   * ⚠ AND IT RETIRES THE MOMENT PLAY STARTS (Wesley, 8/31, mid-Nationals: "now
   * that we are live, we don't need The Draw section, since we show the live
   * brackets in the Live Scores section. Remember that for future tournaments as
   * well."). The Live Scores panel carries the same bracket with results in it,
   * so keeping a second, frozen copy above it is two answers to one question —
   * and the stale one is higher up the page.
   *
   * Gated on `showLiveScores` rather than on `isTournamentLive` on purpose: if
   * the live panel cannot render (no tournament UUID resolved), the draw is
   * still the best thing we have and stays. It only gives way to something that
   * actually replaced it.
   *
   * This is a rule, not a Nationals edit — every future stop follows it, because
   * both flags are derived from the calendar and the feed.
   */
  const showDraw =
    !completed && !showLiveScores && Boolean(drawUuid) && field.published;

  /**
   * Festival-stage lineup, where the event team has published one. Gated on
   * `!completed` for the same reason the Order of Play is: a lineup of music
   * and autograph sessions that already happened is clutter on a recap page.
   */
  const stage = stageScheduleFor(t.slug);
  const showStage = !completed && Boolean(stage);

  /**
   * The ops team's grounds map, shared with the /today screen so both read one
   * file. Absent on every stop whose owner has not supplied one, and the venue
   * slot falls back to the aerial photo it has always used.
   */
  const onsite = onSiteFor(t.slug);
  const venueMapUrl = onsite.venueMapUrl;
  /**
   * A portrait map gets a NARROWER column than the landscape aerial. At the
   * 1.5fr the photo uses, a 3:4 map runs ~890px tall and strands the essentials
   * column beside a wall of green. Read off the supplied dimensions rather than
   * hardcoded, so whichever orientation the ops team sends next lays out sanely.
   */
  const mapIsPortrait =
    Boolean(venueMapUrl) &&
    (onsite.venueMapHeight ?? 0) > (onsite.venueMapWidth ?? 0);

  /**
   * One featured on-site happening, pulled from its own announcement article.
   * Hidden once the event is over — a promo for a pro-am that already
   * happened is the same clutter as a lineup that already played.
   */
  const spotlight = completed ? null : spotlightFor(t.slug);

  const TABS = [
    { id: "overview", label: "Overview" },
    ...(showResults
      ? [
          { id: "champions", label: "Champions" },
          { id: "results", label: "Final Results" },
        ]
      : []),
    // Same anchor as Final Results — one section, two states, so a link to
    // #results lands whether the event is being played or is over.
    ...(showLiveScores ? [{ id: "results", label: "Live Scores" }] : []),
    ...(showReplays ? [{ id: "replays", label: "Replays" }] : []),
    ...(showDraw ? [{ id: "draw", label: "The Draw" }] : []),
    ...(completed
      ? []
      : [
          { id: "stakes", label: "What's at Stake" },
          // Tickets sits directly under What's at Stake on the page now
          // (Wesley, 8/27), and the tab order has to follow the section order —
          // a tab bar that runs in a different order than the page is how you
          // scroll past the thing you clicked.
          { id: "tickets", label: "Tickets" },
          { id: "schedule", label: "Order of Play" },
          /* No separate stage tab — the programme lives inside the venue
             section now, and two tabs scrolling into one section reads as a
             bug. "Venue Guide" covers it. */
          { id: "watch", label: "Watch" },
          { id: "venue", label: "Venue Guide" },
        ]),
    ...(guide && !started ? [{ id: "travel", label: "Plan Your Trip" }] : []),
    // Must match the #players section's own condition exactly — the section is
    // now also skipped when there is neither a published draw nor a prior-year
    // champion, and a tab pointing at an absent anchor scrolls nowhere.
    ...(!completed && (watchPicks.length > 0 || defendingChampions.length > 0)
      ? [{ id: "players", label: "Players" }]
      : []),
    ...(completed ? [] : [{ id: "involved", label: "Get Involved" }]),
    ...(coverage.length > 0 ? [{ id: "coverage", label: "Coverage" }] : []),
    { id: "sponsors", label: "Sponsors" },
  ];

  const conciergeFacts = {
    name: t.name,
    city: t.city,
    state: t.state,
    venue: t.venue,
    dates: formatDateRange(t.startDate, t.endDate, true),
    gates: days[0]?.gates ?? "an hour before first serve",
    // Same gate as the rest of the page — no price and no Tixr link when
    // tickets aren't on sale.
    ticketFrom: onSale ? t.ticketPriceFrom : null,
    ticketsUrl: onSale
      ? withUtm(t.ticketsUrl, { campaign: t.eventCode ?? t.slug, content: "event-concierge-tickets" })
      : null,
    registerUrl: withUtm(t.registerUrl, {
      campaign: t.eventCode ?? t.slug,
      content: "event-concierge-register",
    }),
    // Flattened from the same source the page renders — the chat bubble can't
    // render blocks, but it must not answer with a shorter/different arrangement.
    parking: parkingText(t.slug),
    parkingPassUrl,
    airport: guide ? `${guide.airport} (${guide.airportNote})` : undefined,
    hotels: guide?.hotels.map((h) => h.name) ?? [],
    dining: guide?.dining.map((d) => d.name) ?? [],
    hasTripGuide: Boolean(guide) && !started,
    watch:
      broadcast.length > 0
        ? `Every round streams live, and the marquee rounds hit national TV — ${[...new Set(broadcast.map((b) => b.platform))].join(", ")}. The full round-by-round broadcast table is under "Watch" on this page.`
        : `Every round streams live on PickleballTV and YouTube; marquee rounds hit national TV. Details under "Watch" on this page.`,
  };

  return (
    <div
      style={
        {
          "--event-primary": t.brand?.primary ?? "#0c2b44",
          "--event-accent": t.brand?.accent ?? "#228be6",
          ...(t.brand?.font === "cormorant"
            ? { "--font-event-serif": "var(--font-cormorant)" }
            : {}),
        } as React.CSSProperties
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildEventJsonLd(t, { onSale, description })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Events", path: "/events/" },
              { name: t.name, path: `${eventHref(t)}/` },
            ]),
          ),
        }}
      />
      {/* Hero */}
      <section className="relative isolate flex min-h-[62svh] flex-col justify-end overflow-hidden bg-ppa-navy text-white">
        <Image
          src={t.image}
          alt={t.name}
          fill
          priority
          sizes="100vw"
          className="animate-kenburns will-change-transform object-cover object-center motion-reduce:animate-none"
        />
        {/* Event-hero scrim: .scrim-hero plus an even veil below lg, where the
            badge and a wrapped four-line event name sit in the thin part of the
            gradient. Mirrored in NationalsLive.tsx — the two heroes drift. */}
        <div className="absolute inset-0 scrim-hero-event" />
        {/* Soften the header→hero seam: navy fades down into the hero image. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 bg-gradient-to-b from-ppa-navy to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-20">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.16em]">
            <span className={`${tierBadgeClass(t)} px-2 py-0.5`}>
              {eventTierShort(t)} · {tierPoints(t).toLocaleString()} PTS
            </span>
            {t.presentedBy && (
              <span className="text-white/70">Presented by {t.presentedBy}</span>
            )}
            {completed ? (
              <>
                <span className="text-white/25">/</span>
                <span className="text-ppa-yellow">Final</span>
              </>
            ) : (
              <>
                {/* Countdown here only below lg — the "First Serve In" block
                    (FirstServeCountdown, lg:block) is the desktop countdown, so
                    the two never show together. */}
                <span className="text-white/25 lg:hidden">/</span>
                <span className="text-ppa-yellow lg:hidden">
                  <Countdown
                    targetIso={t.startDate}
                    fallback={`${countdown} ${countdown === 1 ? "Day" : "Days"} Out`}
                  />
                </span>
              </>
            )}
          </div>
          <div className="mt-3 flex items-center gap-4">
            {/**
             * width/height must match the real badge ratio. They were 133x364
             * (0.365) while every file in public/ppa/badges is ~0.545 — e.g.
             * arizona.png is 726x1333. With `w-auto` the browser reserves space
             * from the declared ratio, then relays out to the intrinsic one once
             * the image loads, so the badge jumped ~50% wider on load and shoved
             * the H1 beside it. 720x1320 is exact for 6 of the 8 badges and
             * within 2% of the other two.
             *
             * `priority` because this sits in the hero above the fold, and Next
             * flagged it as the LCP element on /events/2026/veolia-arizona-open.
             */}
            {t.brand?.icon && (
              <Image
                src={t.brand.icon}
                alt=""
                width={720}
                height={1320}
                priority
                sizes="(min-width: 640px) 96px, 62px"
                className="h-28 w-auto shrink-0 rounded-md drop-shadow-[0_4px_18px_rgba(2,49,85,0.55)] motion-safe:animate-rise sm:h-44"
                style={{ animationDelay: "120ms" }}
              />
            )}
            <h1 className="max-w-[18ch] event-display text-[clamp(1.9rem,5.4vw,3.25rem)] uppercase leading-[0.98]">
              {t.name}
            </h1>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wide text-white/75">
            <span>{formatDateRange(t.startDate, t.endDate, true)}</span>
            <span className="text-white/25">|</span>
            <span>
              {t.venue} · {t.city}
              {t.state ? `, ${t.state}` : ""}
            </span>
            <span className="text-white/25">|</span>
            <span className="text-ppa-yellow">
              {completed ? "🏆 Champions crowned" : `${t.prizeMoney} Total Payout`}
            </span>
          </div>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            {completed ? (
              <>
                {showResults && (
                  <a
                    href="#results"
                    className="flex h-11 items-center justify-center bg-ppa-yellow px-6 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition hover:brightness-95 active:scale-[0.98]"
                  >
                    Full Results ↓
                  </a>
                )}
                <a
                  href={withCampaign("https://www.pickleballtv.com/?utm_source=ppatour&utm_medium=website&utm_campaign=event&utm_content=event-hero-replays", t.eventCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
                >
                  ▶ Watch Replays
                </a>
                {showBracket && (
                  <a
                    href={`/brackets?event=${uuid}`}
                    className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
                  >
                    Full Bracket ↗
                  </a>
                )}
              </>
            ) : (
              <>
                {onSale ? (
                  <a
                    href={withUtm(t.ticketsUrl, { campaign: t.eventCode ?? t.slug, content: "event-hero-buy-tickets" })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 items-center justify-center bg-[var(--event-accent)] px-6 text-xs font-bold uppercase tracking-[0.12em] transition hover:brightness-90 active:scale-[0.98]"
                  >
                    Buy Tickets — from ${t.ticketPriceFrom}
                  </a>
                ) : (
                  // Not listed on Tixr yet: no price, no link, no guess.
                  <span className="flex h-11 cursor-default items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white/70">
                    Tickets Coming Soon
                  </span>
                )}
                <a
                  href={withUtm(t.registerUrl, { campaign: t.eventCode ?? t.slug, content: "event-hero-register" })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
                >
                  Register to Play ↗
                </a>
                {/* Same gate as the section it scrolls to — a hero button
                    pointing at an anchor that isn't on the page scrolls
                    nowhere. */}
                {guide && !started && (
                  <a
                    href="#travel"
                    className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
                  >
                    Plan Your Trip ↓
                  </a>
                )}
                <a
                  href="#watch"
                  className="hidden h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy sm:flex"
                >
                  ▶ How to Watch
                </a>
                {/* On-site screen. Deliberately a real link, not an anchor: it
                    is the one CTA here for somebody who has already arrived,
                    and courts + gates + parking do not belong halfway down a
                    marketing page. */}
                <Link
                  href={`${eventHref(t)}/today`}
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
                >
                  At the Event →
                </Link>
              </>
            )}
            {!completed && <FirstServeCountdown targetIso={t.startDate} />}
          </div>
        </div>
        <div className={`relative h-1 ${completed ? "bg-ppa-yellow" : "bg-[var(--event-accent)]"}`} />
      </section>

      {/* Floating event nav */}
      <EventTabNav
        tabs={TABS}
        eventName={t.name}
        icon={t.brand?.icon}
        ticketsUrl={
          completed || !onSale
            ? undefined
            : withUtm(t.ticketsUrl, { campaign: t.eventCode ?? t.slug, content: "event-tabnav-buy-tickets" })
        }
        ticketPriceFrom={completed || !onSale ? undefined : t.ticketPriceFrom}
      />

      {/* Overview — quick facts (right below the hero) */}
      <section id="overview" className="scroll-mt-[120px] bg-ppa-navy-deep text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 divide-y divide-white/10 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { k: "Dates", v: formatDateRange(t.startDate, t.endDate, true) },
            { k: "Venue", v: t.venue },
            { k: eventTierLabel(t), v: `${tierPoints(t).toLocaleString()} Pts` },
          ].map((f) => (
            <div
              key={f.k}
              className="px-4 py-5 sm:first:pl-0 sm:last:pr-0"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                {f.k}
              </p>
              <p className="mt-1 font-display text-base uppercase text-white">
                {f.v}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live scores + bracket, while the event is being played ──────────
             The homepage's live band in event-page form (Wesley, 8/20): its
             "Scores & Brackets" button deep-links here, and until now there was
             nothing to link to — the scores section was gated on `completed`, so
             the page carried no scores at all on the days they matter most. */}
      {showLiveScores && uuid && (
        <section id="results" className="scroll-mt-[120px] bg-ppa-navy">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-ppa-live" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                Live Now
              </p>
            </div>
            <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
              {t.name} Live Scores
            </h2>
            <div className="mt-6">
              <ScoresBracketToggle eventId={uuid} expandHref={`/brackets?event=${uuid}`} />
            </div>
          </div>
        </section>
      )}

      {/* Completed events: champions → final results (standings / scores / bracket) */}
      {/* The Draw — the published bracket, before a ball is hit. The same
          BracketPanel the completed-event Results section uses; it polls, so
          the moment play starts these cells fill with live scores. */}
      {showDraw && drawUuid && (
        <section id="draw" className="scroll-mt-[120px] bg-ppa-navy">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-ppa-yellow" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                The Draw
              </p>
            </div>
            <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
              Who Plays Who at {t.name}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-white/55">
              Every pro main draw, seeded and in full. Scores fill in here live
              once play begins.
            </p>
            <div className="mt-6">
              <BracketPanel eventId={drawUuid} expandHref={`/brackets?event=${drawUuid}`} />
            </div>
          </div>
        </section>
      )}

      {showResults && uuid && (
        <>
          <ChampionsBanner eventId={uuid} />

          <section id="results" className="scroll-mt-[120px] bg-ppa-navy">
            <div className="mx-auto w-full max-w-6xl px-4 py-12">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 bg-ppa-yellow" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                  Final Results
                </p>
              </div>
              <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
                How {t.name} Finished
              </h2>
              <div className="mt-6">
                <ResultsPanel
                  eventId={uuid}
                  showBracket={showBracket}
                  expandHref={showBracket ? `/brackets?event=${uuid}` : undefined}
                />
              </div>
            </div>
          </section>
        </>
      )}

      {/* Replays — the tournament's YouTube playlist */}
      {showReplays && replayPlaylistId && (
        <section id="replays" className="scroll-mt-[120px] bg-ppa-navy-deep">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="flex items-center gap-2.5">
              <span className="text-ppa-yellow">▶</span>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                Replays
              </p>
            </div>
            <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
              Watch {t.name} Back
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-white/55">
              Every match, highlight, and marquee moment from {t.name}, straight
              from the PPA Tour on YouTube.
            </p>
            <div className="mt-6">
              <ReplayGallery videos={replays} playlistId={replayPlaylistId} />
            </div>
          </div>
        </section>
      )}

      {/* Audience router — one page, three ways in (upcoming/live only) */}
      {!completed && (
      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-px border-x border-b border-ppa-line bg-ppa-line sm:grid-cols-3">
          {[
            {
              href: "#venue",
              kicker: "Going to the Event",
              title: "Know Before You Go",
              blurb: "Grounds map, gates, parking, policies, where to stay.",
            },
            {
              href: "#involved",
              kicker: "Playing the Event",
              title: "Enter the Amateur Draw",
              blurb: "Same courts as the pros — brackets by skill and age.",
            },
            {
              href: "#watch",
              kicker: "Watching From Home",
              title: "Every Match, Live",
              blurb: "Streams, TV windows, and what's on the line.",
            },
          ].map((lane) => (
            <a
              key={lane.href}
              href={lane.href}
              className="group bg-white p-5 transition-colors hover:bg-ppa-paper"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--event-accent)]">
                {lane.kicker}
              </p>
              <p className="mt-1.5 flex items-baseline gap-2 font-display text-lg uppercase leading-tight text-ppa-navy">
                {lane.title}
                <span
                  aria-hidden
                  className="text-sm text-ppa-blue opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                >
                  ↓
                </span>
              </p>
              <p className="mt-1 text-xs text-ppa-navy/55">{lane.blurb}</p>
            </a>
          ))}
        </div>
      </section>
      )}

      {/* Attend/watch planning sections — hidden once the event is completed */}
      {!completed && (
      <>
      {/* What's at Stake */}
      <section id="stakes" className="scroll-mt-[120px] bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-[var(--event-accent)]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              What&apos;s at Stake
            </p>
          </div>
          <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            {/* Verb agrees with the name — see whyItMattersHeading. */}
            {whyItMattersHeading(t.name)}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/60">
            A {eventTierLabel(t)} title is worth{" "}
            <span className="font-bold text-ppa-navy">
              {tierPoints(t).toLocaleString()} ranking points
            </span>{" "}
            in every division — enough to reshuffle the season-long points
            race in one weekend. The tour puts{" "}
            <span className="font-bold text-ppa-navy">{t.prizeMoney}</span>{" "}
            in total payouts behind this event, with every top seed chasing
            the title.
          </p>

          <div data-reveal className="mt-6 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-3">
            {[
              {
                k: "Ranking Points",
                v: tierPoints(t).toLocaleString(),
                note: "Per division title — toward the season race",
              },
              {
                k: "Total Payout",
                v: t.prizeMoney,
                note: "Across five pro divisions, incl. appearance fees",
              },
              {
                k: "The Field",
                v: "Top 40+",
                note: "Every No. 1 seed is entered",
              },
            ].map((s) => (
              <div key={s.k} className="bg-white p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-navy/45">
                  {s.k}
                </p>
                <p className="mt-1 font-display text-2xl uppercase text-ppa-blue">
                  {s.v}
                </p>
                <p className="mt-1 text-xs text-ppa-navy/55">{s.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href="#players"
              className="group text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
            >
              See who&apos;s defending{" "}
              <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
            </a>
            <Link
              href="/rankings"
              className="group text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
            >
              Current standings{" "}
              <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery — real event photos when available */}
      {t.gallery && t.gallery.length > 0 && (
        <section className="bg-ppa-navy">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-[var(--event-accent)]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                The Scene
              </p>
            </div>
            <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
              Inside {t.name}
            </h2>
            <p className="mt-3 max-w-xl text-sm text-white/60">
              Real photos from the grounds — slide through and see what a
              day here actually looks like.
            </p>
            <EventGallery images={t.gallery} eventName={t.name} />
          </div>
        </section>
      )}

      {/* Tickets (upcoming/live only) */}
      {!completed && (
      <section id="tickets" className="scroll-mt-[120px] bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Tickets
              </p>
              <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Be There in {t.city}
              </h2>
            </div>
            <a
              href={withUtm(t.registerUrl, {
                campaign: t.eventCode ?? t.slug,
                content: "event-tickets-register",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
            >
              Or register to play ↗
            </a>
          </div>

          {!onSale && (
            /* Not listed on Tixr yet — no prices, no Buy buttons, no link to a
               group directory the fan would have to search. */
            <div className="mt-6 border border-ppa-line bg-ppa-paper p-6">
              <p className="font-display text-xl uppercase leading-none text-ppa-navy">
                Tickets Coming Soon
              </p>
              {/* One template string, not JSX text beside {t.name}. A
                  multi-line text node gets its leading whitespace trimmed by
                  JSX, which rendered "Pickleball Masterstickets" — the source
                  looked correct, so this is worth keeping as one string. */}
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ppa-navy/60">
                {`${t.name} tickets aren’t on sale yet. Prices and seating go live here the moment they open — or join the list below and we’ll tell you.`}
              </p>
            </div>
          )}

          {/* Day-by-day grid when Tixr sells the stop per day; the flat tier
              cards below are the fallback for stops it doesn't. */}
          {showGrid && ticketGrid && (
            <TicketGrid
              grid={ticketGrid}
              campaign={t.eventCode ?? t.slug}
              eventTicketsUrl={onSale ? t.ticketsUrl : null}
            />
          )}

          {/* ⚠ The photo is here because of what this row looks like WITHOUT it.
              When Tixr sells the stop day-by-day, `showGrid` renders the table
              above and the tier cards below are skipped — leaving the Suites
              card alone in a four-column grid, i.e. one small navy box and
              three columns of empty white. Bryce, 9/1: "Pictures need to go
              there. It's kind of ugly." So the photo fills the row it is
              actually in, and only in that state: when the tier cards render,
              the row is full and nothing is added. */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {onSale && !showGrid && ticketTiers.map((tier) => (
              <div
                key={tier.name}
                className="flex flex-col border border-ppa-line bg-ppa-paper p-5"
              >
                <p className="font-display text-lg uppercase leading-none text-ppa-navy">
                  {tier.name}
                </p>
                <p className="mt-2 text-sm text-ppa-navy/55">{tier.blurb}</p>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/40">
                  From
                </p>
                <p className="font-display text-3xl leading-none text-ppa-navy">
                  ${tier.from}
                </p>
                <a
                  href={withUtm(t.ticketsUrl, {
                    campaign: t.eventCode ?? t.slug,
                    content: `event-tickets-${tier.name.toLowerCase().replace(/\s+/g, "-")}`,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex h-9 items-center justify-center bg-ppa-blue px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-ppa-blue-deep"
                >
                  Buy
                </a>
              </div>
            ))}
            <div className="flex flex-col border border-ppa-navy bg-ppa-navy p-5 text-white">
              <p className="font-display text-lg uppercase leading-none">
                Suites & Hospitality
              </p>
              <p className="mt-2 text-sm text-white/65">
                Courtside boxes, private suites, and player experiences.
              </p>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                Premium
              </p>
              <p className="font-display text-3xl leading-none text-ppa-yellow">
                Inquire
              </p>
              <Link
                href="/tour/hospitality"
                className="mt-4 inline-flex h-9 items-center justify-center border border-white/30 px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white hover:text-ppa-navy"
              >
                Learn More
              </Link>
            </div>
            {/* Decorative — the section's own heading and the grid above carry
                the meaning, so `alt` is empty rather than a caption a screen
                reader has to sit through. Hidden below `sm`, where the grid is
                one column and a photo would just push the schedule down. */}
            {showGrid && ticketPhoto && (
              <div className="relative hidden min-h-[220px] overflow-hidden sm:block lg:col-span-3">
                <Image
                  src={ticketPhoto}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 830px, 50vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* Order of Play */}
      <section id="schedule" className="scroll-mt-[120px] bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Order of Play
          </p>
          <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Daily Schedule & Session Times
          </h2>
          <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
            All times local. Gates open an hour before first serve; finals
            move to a late-morning start for the broadcast window.
          </p>
          {realSchedule ? (
            <>
              {/* One calendar block — Pro Play and Amateur & Junior Play side
                  by side on the day each actually happens (Bryce, 7/31). */}
              <div className="mt-6 overflow-hidden border border-ppa-line">
                <div className="grid grid-cols-[4.5rem_1fr_auto] gap-3 border-b border-ppa-line bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45 lg:grid-cols-[5.5rem_1fr_1fr_6rem_9rem]">
                  <span>Date</span>
                  <span>Pro Play</span>
                  <span className="hidden lg:block">Amateur &amp; Junior Play</span>
                  <span className="hidden text-right lg:block">First Serve</span>
                  <span className="text-right">Live</span>
                </div>
                {realSchedule.proDays.map((d) => (
                  <div
                    key={d.date}
                    className="grid grid-cols-[4.5rem_1fr_auto] items-start gap-3 border-b border-ppa-line bg-white px-4 py-3 last:border-b-0 lg:grid-cols-[5.5rem_1fr_1fr_6rem_9rem] lg:items-center"
                  >
                    <span className="font-display text-base uppercase leading-tight text-[var(--event-accent)]">
                      <span className="block text-[10px] font-sans font-bold leading-none text-ppa-navy/40">
                        {d.dow}
                      </span>
                      {d.date}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ppa-navy">
                        {d.label}
                      </span>
                      <span className="block text-[11px] uppercase tracking-wide text-ppa-navy/40">
                        Gates {d.gates}
                        <span className="lg:hidden">
                          {" · "}First serve {d.firstServe}
                        </span>
                      </span>
                      {/* Under lg the amateur column folds under Pro Play —
                          the day still owns both, it just stacks. */}
                      {d.amateur && d.amateur.length > 0 && (
                        <span className="mt-1.5 block border-l-2 border-ppa-line pl-2 lg:hidden">
                          {d.amateur.map((a) => (
                            <span key={a.label} className="block text-[12px] text-ppa-navy/60">
                              {a.label}
                              {a.detail ? ` — ${a.detail}` : ""}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    <span className="hidden lg:block">
                      {d.amateur && d.amateur.length > 0 ? (
                        d.amateur.map((a) => (
                          <span key={a.label} className="mt-1 block first:mt-0">
                            <span className="block text-sm font-semibold text-ppa-navy">
                              {a.label}
                            </span>
                            {a.detail && (
                              <span className="block text-[11px] uppercase tracking-wide text-ppa-navy/40">
                                {a.detail}
                              </span>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-ppa-navy/25">—</span>
                      )}
                    </span>
                    <span className="hidden text-right text-sm font-bold tabular-nums text-ppa-navy lg:block">
                      {d.firstServe}
                    </span>
                    <span className="text-right text-[10px] font-bold uppercase tracking-[0.1em]">
                      {dayChannels.get(d.dow) ?? d.live ? (
                        <span className="text-[var(--event-accent)]">
                          {dayChannels.get(d.dow) ?? d.live}
                        </span>
                      ) : (
                        <span className="text-ppa-navy/30">—</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Only what the tournament hasn't dated yet. Everything with a
                  known day lives in the grid above. */}
              {realSchedule.amateur.length > 0 && (
                <div className="mt-4 border border-ppa-line bg-white px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                    Day still to be announced
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-8">
                    {realSchedule.amateur.map((a) => (
                      <span key={a.label} className="block">
                        <span className="block text-sm font-semibold text-ppa-navy">
                          {a.label}
                        </span>
                        {a.detail && (
                          <span className="block text-[11px] text-ppa-navy/50">
                            {a.detail}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-3 text-[12px] text-ppa-navy/50">
                {realSchedule.amateurNote}{" "}
                <a
                  href={withUtm(t.registerUrl, {
                    campaign: t.eventCode ?? t.slug,
                    content: "event-schedule-register",
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold uppercase tracking-[0.08em] text-[var(--event-accent)] hover:underline"
                >
                  Register to play ↗
                </a>
              </p>
            </>
          ) : (
          <div className="mt-6 overflow-hidden border border-ppa-line">
            <div className="grid grid-cols-[3.5rem_1fr_auto] gap-3 border-b border-ppa-line bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45 sm:grid-cols-[5rem_1fr_7rem_6rem]">
              <span>Date</span>
              <span>Session</span>
              <span className="hidden text-right sm:block">First Serve</span>
              <span className="text-right">Live</span>
            </div>
            {days.map((d) => (
              <div
                key={d.iso}
                className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 border-b border-ppa-line bg-white px-4 py-3 last:border-b-0 sm:grid-cols-[5rem_1fr_7rem_6rem]"
              >
                <span className="font-display text-base uppercase text-ppa-blue">
                  {d.date}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ppa-navy">
                    {d.label}
                  </span>
                  <span className="block text-[11px] uppercase tracking-wide text-ppa-navy/40">
                    Gates {d.gates}
                  </span>
                </span>
                <span className="hidden text-right text-sm font-bold tabular-nums text-ppa-navy sm:block">
                  {d.firstServe}
                </span>
                <span className="text-right text-[10px] font-bold uppercase tracking-[0.1em]">
                  {d.live ? (
                    <span className="text-ppa-blue">{d.live}</span>
                  ) : (
                    <span className="text-ppa-navy/30">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Watch at home — PGA-style */}
      <section id="watch" className="scroll-mt-[120px] bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-[var(--event-accent)]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              Watching at Home
            </p>
          </div>
          <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] sm:text-3xl">
            Every Match, Every Screen
          </h2>
          <p className="mt-3 max-w-xl text-sm text-white/65">
            Can&apos;t make it to {t.city}? Every court streams live on
            PickleballTV, with the marquee rounds on national TV.
          </p>

          {/* Two columns (Bryce, 7/31): the round — what's on and where to
              watch it — on the left, the channels this event is on stacked
              down the right. */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="overflow-hidden border border-white/10">
            <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/10 bg-ppa-navy-deep px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              <span>Round</span>
              <span className="text-right">Channel · Window</span>
            </div>
            {broadcast.length > 0
              ? broadcast.map((b, i) => (
                  <div
                    key={`${b.round}-${b.platform}-${i}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-white/5 px-4 py-3 last:border-b-0"
                  >
                    <span>
                      <span className="block text-sm font-bold uppercase tracking-wide text-white">
                        {b.round}
                        {b.type === "TAPE" && (
                          <span className="ml-1.5 text-[10px] font-bold text-white/40">
                            (Tape)
                          </span>
                        )}
                      </span>
                      <span className="block text-[11px] uppercase tracking-wide text-white/40">
                        {b.day}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-xs font-bold uppercase tracking-[0.1em] text-ppa-sky">
                        {b.platform}
                        {b.secondary ? ` · ${b.secondary}` : ""}
                      </span>
                      <span className="block text-[11px] tabular-nums text-white/45">
                        {b.window}
                      </span>
                    </span>
                  </div>
                ))
              : /* ⚠ NO SHEET ROWS MEANS NO BROADCAST TABLE, not a templated one.
                     This branch used to list every play day against a channel
                     the template had invented — "FOX · PBTV" on Championship
                     Sunday, "Tennis Channel · PBTV" on the semis — for events
                     whose coverage nobody has announced. The Order of Play above
                     still shows the days and first-serve times, which are real;
                     what is unknown is who is carrying them. */
                null}
            {broadcast.length === 0 && (
              <p className="px-4 py-6 text-sm text-white/55">
                Broadcast windows for this event are announced closer to the
                event.
              </p>
            )}
          </div>

          {/* The channels, in order: PickleballTV, Tennis Channel, MATCHDAY. */}
          <div className="flex flex-col gap-3">
            {watchCards.map((w) => (
              <div
                key={w.name}
                className="flex flex-col border border-white/10 bg-ppa-navy-deep p-5"
              >
                {w.logo ? (
                  <span className="flex h-10 w-fit items-center justify-center rounded bg-white px-3">
                    {/* ⚠ SVG MARKS GO THROUGH A PLAIN <img>. next/image 400s on
                        SVG via the optimizer proxy but renders it fine as a bare
                        src — the trap that broke the Tennis Channel card once
                        (it was moved to PNG then). CBS only ships as SVG, so the
                        branch is what lets it have a mark at all. */}
                    {w.logo.endsWith(".svg") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.logo} alt={w.name} className="h-6 w-auto object-contain" />
                    ) : (
                      <Image
                        src={w.logo}
                        alt={w.name}
                        width={120}
                        height={40}
                        className="h-6 w-auto object-contain"
                      />
                    )}
                  </span>
                ) : (
                  <span className="text-sm text-ppa-sky">▶</span>
                )}
                <p className="mt-2 font-display text-lg uppercase leading-none">
                  {w.name}
                </p>
                <p className="mt-1.5 text-xs text-white/60">{w.note}</p>
                {w.href ? (
                  <a
                    href={withCampaign(w.href, t.eventCode)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-yellow hover:text-white"
                  >
                    {w.detail} ↗
                  </a>
                ) : (
                  <span className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                    {w.detail}
                  </span>
                )}
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* Venue Guide — grounds map + know before you go */}
      <section id="venue" className="scroll-mt-[120px] bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-[var(--event-accent)]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              At the Venue
            </p>
          </div>
          <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Your Day at {t.venue}
          </h2>
          <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
            Get the lay of the land, then check the essentials — gates,
            parking, and what to bring.
          </p>

          <div
            className={`mt-6 grid gap-10 ${
              mapIsPortrait ? "lg:grid-cols-[1fr_1.15fr]" : "lg:grid-cols-[1.5fr_1fr]"
            }`}
          >
            {/* The ops team's grounds map where one exists, otherwise a real
                aerial of the venue (gallery photo → event hero). */}
            <div data-reveal className="self-start">
              {venueMapUrl ? (
                /* ⚠ A MAP GETS THE OPPOSITE TREATMENT TO THE AERIAL. No
                   `object-cover`, no Ken Burns pan and no bottom scrim: each
                   of those crops, drifts or covers part of the artwork, and on
                   a site map the part covered is the off-site parking address.
                   `object-contain` on white shows the whole thing. It also
                   links to the full file, because the point of a grounds map
                   is pinch-zooming it at the gate. */
                <a
                  href={venueMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden border border-ppa-line bg-white"
                >
                  {/* ⚠ NO FORCED ASPECT. The Cary map is portrait and the one
                      before it was landscape; a fixed 4:3 box renders a
                      portrait map small between two fat gutters. Intrinsic
                      width/height lets the slot size to whatever the ops team
                      supplies. */}
                  <Image
                    src={venueMapUrl}
                    alt={`${t.venue} grounds map — courts, entry, parking and amenities`}
                    width={2000}
                    height={2667}
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="h-auto w-full object-contain"
                  />
                  <p className="border-t border-ppa-line px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50 transition-colors group-hover:text-[var(--event-accent)]">
                    Grounds Map — Tap to Enlarge ↗
                  </p>
                </a>
              ) : (
                <div className="relative aspect-[4/3] overflow-hidden border border-ppa-line bg-ppa-navy">
                  <Image
                    src={t.gallery?.[1] ?? t.gallery?.[0] ?? t.image}
                    alt={`${t.venue} — the grounds`}
                    fill
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="animate-kenburns object-cover object-center will-change-transform motion-reduce:animate-none"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ppa-navy/90 via-ppa-navy/25 to-transparent p-5 pt-16">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/65">
                      The Grounds
                    </p>
                    <p className="mt-0.5 event-display text-lg uppercase leading-tight text-white sm:text-xl">
                      {t.venue}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* `self-start` or the grid stretches this column to the map's
                height and the container's hairline background shows through
                below the last row as a grey filler block. */}
            <div data-reveal className="flex flex-col gap-px self-start border border-ppa-line bg-ppa-line">
              {[
                {
                  k: "Gates & Sessions",
                  v: `Gates open ${days[0]?.gates ?? "an hour before first serve"} daily. Morning and evening sessions are ticketed separately at Championship Court; a grounds pass covers the outer courts all day.`,
                },
                {
                  k: "Parking & Shuttle",
                  v: (
                    <ParkingDetails
                      sections={parking}
                      ticketsUrl={parkingPassUrl}
                    />
                  ),
                },
                {
                  k: "What to Bring",
                  v: "Small bags OK (checked at the gate) · sunscreen and a hat · no coolers or outside alcohol · personal cameras welcome, no tripods.",
                },
                {
                  k: "Players & Autographs",
                  v: "Pros warm up on the practice courts and sign after matches near the player zone — bring a paddle or something from the merch store.",
                },
                {
                  k: "Weather Plan",
                  v: "Rain pauses play; sessions extend or shift and your ticket stays valid for that session day. Live updates on @ppatour.",
                },
                {
                  k: "Questions On-Site",
                  v: "Guest Services sits beside the main gate — lost & found, ADA services, first aid, and staff who know the answer.",
                },
              ].map((row, i) => (
                <details key={row.k} className="group bg-white" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--event-accent)]">
                      {row.k}
                    </span>
                    <span
                      aria-hidden
                      className="text-xs text-ppa-navy/40 transition-transform duration-300 group-open:rotate-180"
                    >
                      ▾
                    </span>
                  </summary>
                  {/* A div, not a p: the parking row renders labelled blocks. */}
                  <div className="px-4 pb-4 text-sm leading-relaxed text-ppa-navy/70">
                    {row.v}
                  </div>
                </details>
              ))}
              {/* Engine survives the `started` gate here, and this is the only
                  placement that does. Plan Your Trip retires at first serve (Connor,
                  9/1) — but the official room blocks above it have book-by cutoffs
                  weeks earlier, so during event week Engine is the page's only
                  remaining answer to "I need a room". Live only, never completed. */}
              {started && !completed && <EngineStay event={engineEvent} variant="onsite" />}
            </div>
          </div>

          {/* One featured on-site happening — thumbnail left, what it is right.
              Sits under the map and the essentials because it is a reason to
              come, not something you need in order to get in. */}
          {/* ⚠ A DIV, NOT A LINK. It used to be one big <Link>; two buttons
              cannot live inside that — nesting interactive elements is invalid
              HTML and gives a screen reader one target where there are two.
              The thumbnail carries the link to the article instead, and the
              buttons are the real affordances. */}
          {spotlight && (
            <div
              data-reveal
              className="mt-10 grid gap-5 border border-ppa-line bg-white p-4 sm:grid-cols-[minmax(0,20rem)_1fr] sm:items-center sm:gap-7 sm:p-5"
            >
              <Link
                href={spotlight.href}
                tabIndex={-1}
                aria-hidden
                className="group relative block aspect-[16/9] overflow-hidden bg-ppa-navy"
              >
                <Image
                  src={spotlight.article.image}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 20rem, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  style={
                    spotlight.article.imagePosition
                      ? { objectPosition: spotlight.article.imagePosition }
                      : undefined
                  }
                />
              </Link>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--event-accent)]">
                  {spotlight.eyebrow}
                </p>
                <h3 className="mt-1.5 event-display text-lg uppercase leading-[1.08] text-ppa-navy sm:text-xl">
                  {spotlight.article.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ppa-navy/60">
                  {spotlight.article.dek}
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Link
                    href={spotlight.href}
                    className="flex h-10 items-center border border-ppa-navy/25 px-5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:border-ppa-navy hover:bg-ppa-navy hover:text-white active:scale-[0.98]"
                  >
                    {spotlight.cta}
                  </Link>
                  {/* ⚠ Tagged HERE, not in the data. The article stores this
                      URL clean precisely so each placement can stamp its own
                      `utm_content` — reusing the article footer's tag would
                      report a venue-section click as an article click. */}
                  {spotlight.ticketUrl && (
                    <a
                      href={withUtm(spotlight.ticketUrl, {
                        campaign: t.eventCode ?? t.slug,
                        content: "event-venue-spotlight",
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 items-center bg-[var(--event-accent)] px-5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:brightness-90 active:scale-[0.98]"
                    >
                      {spotlight.ticketLabel}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* The week's programming, INSIDE At the Venue rather than as its own
              section — Bryan Renahan, 8/27: "Add a programming section under
              'At the Venue'", with Canes & the Cup standing out above the rest.
              Hence the order here: map and essentials, then the Canes callout,
              then everything else that is on. */}
          {showStage && stage && (
            <div id="stage" className="mt-12 scroll-mt-[120px]">
              <h3 className="event-display text-xl uppercase leading-[1.02] text-ppa-navy sm:text-2xl">
                {stage.name}
              </h3>
              {stage.note && (
                <p className="mt-2 max-w-2xl text-sm text-ppa-navy/55">{stage.note}</p>
              )}
              <StageSchedule days={stage.days} />
              <p className="mt-5 text-xs text-ppa-navy/45">
                Stage times are subject to change.
              </p>
            </div>
          )}
        </div>
      </section>
      </>
      )}

      {/* Plan Your Trip — Ragnar-style. Upcoming stops only: it disappears at
          first serve (Connor, 9/1), same gate as the hero button and the tab. */}
      {guide && !started && (
        <section id="travel" className="scroll-mt-[120px] bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-[var(--event-accent)]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                Make a Trip of It
              </p>
            </div>
            <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
              Plan Your {t.city} Weekend
            </h2>
            <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
              Where to land, where to stay, where to eat, and what to do
              between sessions — the full tour-stop getaway.
            </p>

            {/* Interactive Trip Builder — the guided way in. The static guide
                below is the full reference for anyone who'd rather browse. */}
            <div className="mt-6">
              <TripBuilder event={tripEvent} />
            </div>

            <div className="mt-8 flex items-center gap-2.5">
              <span className="h-2 w-2 bg-[var(--event-accent)]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                The Full Guide
              </p>
            </div>

            {/* Getting there + parking */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="border border-ppa-line bg-ppa-paper p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-blue">
                    Getting There
                  </p>
                  <p className="font-display text-lg uppercase text-ppa-navy">
                    {guide.airport}
                  </p>
                </div>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-ppa-navy/45">
                  {guide.airportNote}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ppa-navy/65">
                  {guide.gettingThere}
                </p>
              </div>
              <div className="border border-ppa-line bg-ppa-paper p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-blue">
                  Parking & Access
                </p>
                <ParkingDetails
                  sections={parking}
                  ticketsUrl={parkingPassUrl}
                  className="mt-3 text-sm leading-relaxed text-ppa-navy/65"
                />
              </div>
            </div>

            {/* Stay / Eat / Do */}
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {[
                { heading: "Where to Stay", items: stayHotels },
                { heading: "Where to Eat", items: guide.dining },
                { heading: "Things to Do", items: guide.doing },
              ].map((col) => (
                <div key={col.heading} className="border border-ppa-line bg-ppa-paper">
                  <p className="border-b border-ppa-line px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">
                    {col.heading}
                  </p>
                  <ul className="divide-y divide-ppa-line">
                    {col.items.map((p) => (
                      <li key={p.name} className="px-4 py-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2">
                            {p.brand && (
                              <Image
                                src={`/ppa/hotels/${p.brand}.png`}
                                alt=""
                                width={32}
                                height={32}
                                className="size-5 shrink-0 rounded-[3px] object-contain"
                              />
                            )}
                            <span className="font-display text-sm uppercase leading-tight text-ppa-navy">
                              {p.name}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 text-[9px] font-bold uppercase tracking-[0.1em] ${
                              p.tag === "Official"
                                ? "bg-[var(--event-accent)] px-1.5 py-0.5 text-white"
                                : "text-ppa-blue"
                            }`}
                          >
                            {p.tag}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-ppa-navy/55">
                          {p.note}
                        </p>
                        {(p.rate || p.cutoff) && (
                          <p className="mt-1 text-[11px] font-bold text-ppa-navy/70">
                            {[p.rate, p.cutoff].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {p.href && col.heading === "Where to Stay" && (
                          <BookGroupRateLink href={p.href} eventSlug={t.slug} />
                        )}
                        {col.heading === "Where to Stay" && (
                          <EngineHotelLink hotelName={p.name} event={engineEvent} />
                        )}
                      </li>
                    ))}
                  </ul>
                  {/* Engine sits UNDER the hotel list, never above it — the rows
                      above are negotiated group rates with a cutoff. */}
                  {col.heading === "Where to Stay" && <EngineStay event={engineEvent} />}
                </div>
              ))}
            </div>

            {/* Venue map */}
            <div className="mt-4 overflow-hidden border border-ppa-line">
              <div className="flex items-center justify-between gap-3 border-b border-ppa-line bg-ppa-paper px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">
                  Venue Map · {t.venue}
                </p>
                <a
                  href={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
                >
                  Directions ↗
                </a>
              </div>
              <iframe
                title={`Map of ${t.venue}`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=13&output=embed`}
                className="h-[320px] w-full border-0 grayscale-[20%]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <p className="mt-3 text-[11px] uppercase tracking-[0.1em] text-ppa-navy/35">
              Official hotel rates & travel partners finalized closer to the
              event.
            </p>
          </div>
        </section>
      )}

      {/* Players + Champions (upcoming/live only).
          ⚠ Both blocks can be empty — no published draw AND no prior-year event —
          and with the champions placeholder gone that would render an empty grey
          band. Gate the section on having something to put in it. */}
      {!completed && (watchPicks.length > 0 || defendingChampions.length > 0) && (
      <section id="players" className="scroll-mt-[120px] bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          {/**
           * ⚠ FULL WIDTH, STACKED BLOCKS — NOT TWO COLUMNS (Wesley, 8/5: make
           * Players to Watch "full-width and have the player cards lay
           * horizontal instead of stacking"). Each block now spans the container
           * and its cards run across it, so the three picks sit side by side
           * instead of in a narrow half-width column.
           */}
          <div className="grid gap-10">
            {/* Only rendered once the draw is published — before that we have no
                entry list, and generic picks are what made every event page show
                the same three players. See lib/players-to-watch.ts. */}
            {watchPicks.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Players to Watch
              </p>
              {/* Don't claim "In the Draw" before the draw exists — pre-draw
                  picks are storylines, not a statement of who is entered. */}
              <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                {field.published ? "In the Draw" : "Ones to Watch"}
              </h2>
              {/**
               * Three picks (the picker's `limit`), so three across on desktop,
               * two from sm, stacked on a phone.
               *
               * ⚠ `border-b border-r` here + `border-l border-t` on each card,
               * NOT the `gap-px` over `bg-ppa-line` trick used elsewhere. Once
               * this is a grid rather than a single column, a row that doesn't
               * fill leaves the line colour showing through as a grey ghost cell
               * — three cards in two columns at sm does exactly that. Same
               * reasoning and same classes as PartnerWall.
               */}
              <div className="mt-5 grid border-b border-r border-ppa-line sm:grid-cols-2 lg:grid-cols-3">
                {watchPicks.map((p) => {
                  // A card can hold more than one player — triple-crown winners
                  // share a box rather than taking a slot each.
                  const solo = p.players.length === 1 ? p.players[0] : null;
                  const href = solo ? playerProfileHref(solo) : null;
                  const card = (
                    <>
                      <div className="flex shrink-0 items-center -space-x-3">
                        {p.players.map((name) => {
                          const photo = playerPhoto(name);
                          return (
                            <div
                              key={name}
                              className="relative size-14 overflow-hidden rounded-full bg-ppa-navy-deep ring-2 ring-white"
                            >
                              {photo ? (
                                <Image
                                  src={photo}
                                  alt={name}
                                  fill
                                  sizes="56px"
                                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white/70">
                                  {playerInitials(name)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="font-display text-sm uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                          {p.players.join(" & ")}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-blue">
                          {p.badge}
                        </span>
                        <span className="mt-1 text-xs leading-snug text-ppa-navy/60">
                          {p.hook}
                        </span>
                      </div>
                    </>
                  );
                  const key = p.players.join("|");
                  return href ? (
                    <Link
                      key={key}
                      href={href}
                      className="group flex items-start gap-3 border-l border-t border-ppa-line bg-white p-3 transition-colors hover:bg-ppa-paper"
                    >
                      {card}
                    </Link>
                  ) : (
                    <div
                      key={key}
                      className="group flex items-start gap-3 border-l border-t border-ppa-line bg-white p-3"
                    >
                      {card}
                    </div>
                  );
                })}
              </div>
              {/* Hannah 7/28: people come looking for one specific player. */}
              <Link
                href="/athletes"
                className="group mt-4 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:text-ppa-blue"
              >
                See All Pros Competing
                <span
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </div>
            )}

            {/**
             * ⚠ NO CHAMPIONS, NO SECTION (Wesley, 8/5: "if we can't find any
             * defending champions, just hide the section all together").
             *
             * This replaced an honest-but-pointless placeholder — "No titles to
             * defend, this stop crowns its first champions this year" — which
             * rendered as a half-width column containing one grey sentence on
             * every stop with no mapped prior-year event. Measured before the
             * change: Arizona, Chicago and the National Championships all showed
             * it. A heading that exists only to say it has nothing to say is
             * worse than no heading.
             *
             * Note the completed case was ALREADY covered: the whole section is
             * gated on `!completed` further up, so a finished event never renders
             * any of this.
             */}
            {defendingChampions.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Last Season
              </p>
              <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Defending Champions
              </h2>
                {/* Five divisions in three columns leaves a short final row, so
                    the same border pattern as the picks grid above — see the
                    note there. */}
                <div className="mt-5 grid border-b border-r border-ppa-line sm:grid-cols-2 lg:grid-cols-3">
                  {defendingChampions.map((c) => (
                    <div
                      key={c.division}
                      className="border-l border-t border-ppa-line bg-white p-3"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                        {c.division}
                      </span>
                      {/* Champion names arrive joined ("A & B") — split so each
                          player gets their own headshot + profile link. */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                        {c.name.split(" & ").map((player) => {
                          const photo = playerPhoto(player);
                          const href = playerProfileHref(player);
                          const chip = (
                            <>
                              <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-ppa-navy-deep">
                                {photo ? (
                                  <Image
                                    src={photo}
                                    alt={player}
                                    fill
                                    sizes="36px"
                                    className="object-cover object-top"
                                  />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white/70">
                                    {playerInitials(player)}
                                  </span>
                                )}
                              </span>
                              <span className="font-display text-sm uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                                {player}
                              </span>
                            </>
                          );
                          return href ? (
                            <Link
                              key={player}
                              href={href}
                              className="group flex min-w-0 items-center gap-2"
                            >
                              {chip}
                            </Link>
                          ) : (
                            <span key={player} className="flex min-w-0 items-center gap-2">
                              {chip}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
            </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* Coverage — the event's editorial history */}
      {coverage.length > 0 && (
        <section id="coverage" className="scroll-mt-[120px] bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 bg-[var(--event-accent)]" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                    Coverage
                  </p>
                </div>
                <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                  {completed ? `Relive ${t.name}` : `The ${t.name} Story So Far`}
                </h2>
              </div>
              <Link
                href="/news"
                className="group hidden shrink-0 text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy sm:block"
              >
                All News{" "}
                <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coverage.map((c, i) => (
                <Link
                  key={c.slug}
                  href={`/${c.slug}`}
                  data-reveal
                  style={{ "--reveal-delay": `${(i % 3) * 80}ms` } as React.CSSProperties}
                  className="group relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden bg-ppa-navy"
                >
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 scrim-card" />
                  <div className="relative p-4 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-sky">
                      {c.category} · {c.date}
                    </p>
                    <p className="mt-1 font-display text-base uppercase leading-[1.1]">
                      {c.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-white/65">{c.dek}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Get Involved (upcoming/live only) */}
      {!completed && (
      <section id="involved" className="scroll-mt-[120px] bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-[var(--event-accent)]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              Get Involved
            </p>
          </div>
          <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] sm:text-3xl">
            Don&apos;t Just Watch It — Play It
          </h2>
          <p className="mt-3 max-w-xl text-sm text-white/65">
            Every PPA stop runs an amateur draw on the same courts as the
            pros, plus clinics, pro-ams, and ways to be part of event week.
          </p>

          {/* Live registered-player count (PT.com) — honest placeholder
              until Jason's API creds land (docs/DATA-ASKS.md). */}
          <div className="mt-4">
            <RegisteredCount tournamentUuid={t.tournamentUuid} accent />
          </div>

          <div data-reveal className="mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Play the Amateur Draw",
                note: "Brackets by skill + age · from $89 per division · medals on Championship Court",
                cta: "Register to Play",
                href: withUtm(t.registerUrl, {
                  campaign: t.eventCode ?? t.slug,
                  content: "event-involved-register",
                }),
                external: true,
                featured: true,
              },
              {
                title: "Junior Clinics & Camps",
                note: "Event-week sessions with tour coaches for U-19 players",
                cta: "PPA Camps",
                href: "/tour/camps",
              },
              {
                title: "Pro-Am & Hospitality",
                note: "Play with the pros, host clients courtside",
                cta: "Hospitality",
                href: "/tour/hospitality",
              },
              {
                title: "Volunteer Event Week",
                note: "Court crew, player services, transport — be inside the ropes",
                cta: "Volunteer",
                href: "/events/volunteer",
                modal: true,
              },
            ].map((c) => (
              <div
                key={c.title}
                className={`flex flex-col p-5 ${c.featured ? "bg-ppa-blue" : "bg-ppa-navy-deep"}`}
              >
                <p className="font-display text-lg uppercase leading-tight">
                  {c.title}
                </p>
                <p className={`mt-1.5 flex-1 text-xs leading-relaxed ${c.featured ? "text-white/85" : "text-white/55"}`}>
                  {c.note}
                </p>
                {"modal" in c && c.modal ? (
                  <VolunteerModalButton label={c.cta} eventName={t.name} />
                ) : c.external ? (
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group mt-4 inline-flex items-center gap-1.5 self-start pb-0.5 text-[11px] font-bold uppercase tracking-[0.12em] ${
                      c.featured
                        ? "border-b-2 border-white text-white"
                        : "border-b-2 border-ppa-blue text-white/85 hover:text-white"
                    }`}
                  >
                    {c.cta}
                    <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">↗</span>
                  </a>
                ) : (
                  <Link
                    href={c.href}
                    className="group mt-4 inline-flex items-center gap-1.5 self-start border-b-2 border-ppa-blue pb-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/85 hover:text-white"
                  >
                    {c.cta}
                    <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Sponsors — who backs this event + become-a-sponsor lead hook */}
      <EventSponsors event={t} />

      {/* More stops */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                More Stops
              </p>
              <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Next on Tour
              </h2>
            </div>
            <Link
              href="/events"
              className="text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
            >
              Full Schedule →
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {otherTournaments.map((o) => (
              <Link
                key={o.slug}
                href={eventHref(o)}
                className="group relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden bg-ppa-navy"
              >
                <Image
                  src={o.image}
                  alt={o.name}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover grayscale-[30%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 scrim-card" />
                {o.brand?.icon && (
                  <span className="absolute left-3 top-3 block h-16 w-[34px] overflow-hidden rounded drop-shadow-md transition-transform duration-500 group-hover:scale-105">
                    <Image
                      src={o.brand.icon}
                      alt={`${o.name} badge`}
                      fill
                      sizes="34px"
                      className="object-contain"
                    />
                  </span>
                )}
                <div className="relative p-4 text-white">
                  <p>
                    <span
                      className={`${tierBadgeClass(o)} px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] whitespace-nowrap`}
                    >
                      {eventTierShort(o)} · {tierPoints(o).toLocaleString()}
                    </span>
                  </p>
                  <p className="mt-0.5 font-display text-base uppercase leading-[1.05]">
                    {o.name}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    {formatDateRange(o.startDate, o.endDate, true)} · {o.city}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Email */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="streaming" />
        </div>
      </section>
      <EventConcierge facts={conciergeFacts} />
    </div>
  );
}
