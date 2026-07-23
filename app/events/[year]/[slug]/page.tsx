import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { EventConcierge } from "@/components/events/EventConcierge";
import { EventTabNav } from "@/components/events/EventTabNav";
import { FirstServeCountdown } from "@/components/events/FirstServeCountdown";
import { EventGallery } from "@/components/events/EventGallery";
import { EventSponsors } from "@/components/events/EventSponsors";
import { RegisteredCount } from "@/components/events/RegisteredCount";
import { VenueMap } from "@/components/events/VenueMap";
import { VolunteerModalButton } from "@/components/events/VolunteerModalButton";
import { BookGroupRateLink } from "@/components/events/BookGroupRateLink";
import { publishedHotelsFor } from "@/lib/published-hotels";
import { ResultsPanel } from "@/components/live/ResultsPanel";
import { ChampionsBanner } from "@/components/live/ChampionsBanner";
import { ReplayGallery } from "@/components/live/ReplayGallery";
import { getReplayPlaylistId } from "@/lib/event-replays";
import { getPlaylistVideos } from "@/lib/youtube";
import { Countdown } from "@/components/motion/Countdown";
import { getBroadcast } from "@/lib/broadcast";
import { getEventGuide } from "@/lib/event-guides";
import { getEventSchedule } from "@/lib/event-schedule";
import { getEvents } from "@/lib/events-api";
import { playersToWatch } from "@/lib/home-content";
import { getArticlesForEvent } from "@/lib/news-articles";
import {
  daysUntil,
  eventHref,
  eventYear,
  formatDate,
  formatDateRange,
  tierLabel,
  eventTierLabel,
  tierPoints,
  tierShort,
  eventTierShort,
  type Tournament,
  tournaments,
} from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

type Params = { params: Promise<{ year: string; slug: string }> };

/**
 * Resolve an event for its detail page by year + slug: a curated record wins
 * (keeps the rich, hand-authored content), otherwise an API-sourced US event
 * that has an internal page. Matching on the year disambiguates recurring
 * events (e.g. the 2026 vs 2027 PPA Finals, which share the slug `ppa-finals`).
 * Returns null for unknown events, challengers, and international stops (which
 * all link out to their details_url instead).
 */
async function resolveEvent(year: string, slug: string): Promise<Tournament | null> {
  const match = (x: Tournament) => x.slug === slug && eventYear(x) === year;
  const t = tournaments.find(match) ?? (await getEvents()).events.find(match) ?? null;
  if (!t || t.tierKey === "challenger") return null;
  return t;
}

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
  for (const t of tournaments) if (t.tierKey !== "challenger") add(t);
  for (const e of events) if (e.hasInternalPage) add(e);
  return params;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { year, slug } = await params;
  const t = await resolveEvent(year, slug);
  if (!t) return { title: "Event" };
  const where = t.state ? `${t.city}, ${t.state}` : t.city;
  const description = `${eventTierLabel(t)} · ${formatDateRange(t.startDate, t.endDate, true)} · ${where} · ${t.prizeMoney} prize purse. Schedule, players, tickets, trip guide, and how to watch.`;
  return {
    title: t.shortName,
    description,
    openGraph: {
      title: `${t.shortName} — Carvana PPA Tour`,
      description,
      images: [t.image],
    },
    twitter: { card: "summary_large_image", images: [t.image] },
  };
}

const DIVISIONS = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
];

const PAST_CHAMPIONS = [
  { division: "Men's Singles", name: "Ben Johns" },
  { division: "Women's Singles", name: "Anna Bright" },
  { division: "Men's Doubles", name: "B. Johns / JW Johnson" },
  { division: "Women's Doubles", name: "Bright / Parenteau" },
  { division: "Mixed Doubles", name: "JW Johnson / Bright" },
];

const HOW_TO_WATCH: {
  name: string;
  logo?: string;
  note: string;
  detail: string;
  href?: string;
}[] = [
  {
    name: "PickleballTV",
    logo: "/ppa/networks/pbtv.png",
    note: "Every court, every match, all weekend — the home of live PPA streaming.",
    detail: "Stream on PBTV",
    href: "https://www.pickleballtv.com/?utm_source=ppatour&utm_medium=website&utm_campaign=event&utm_content=event-watch-pbtv",
  },
  {
    name: "Tennis Channel",
    logo: "/ppa/networks/tennis-channel.svg",
    note: "Featured rounds and Championship Sunday on national television.",
    detail: "Check local listings",
  },
  {
    name: "MATCHDAY App",
    note: "Live scores, brackets, order of play, and match alerts.",
    detail: "iOS · Android",
    href: "https://www.matchday.app/?utm_source=ppatour&utm_medium=website&utm_campaign=event&utm_content=event-watch-matchday",
  },
];

type Day = {
  date: string;
  iso: string;
  label: string;
  gates: string;
  firstServe: string;
  live?: string;
};

function buildSchedule(startIso: string, endIso: string): Day[] {
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
    let live: string | undefined;
    if (i === 0) {
      label = "Amateur & junior brackets";
      gates = "8:00 AM";
      firstServe = "9:00 AM";
    } else if (i === 1) {
      label = "Senior Open + pro qualifying";
      gates = "8:00 AM";
      firstServe = "9:00 AM";
    } else if (i === last) {
      label = "Championship Sunday — Finals";
      gates = "10:00 AM";
      firstServe = "11:00 AM";
      live = "FOX · PBTV";
    } else if (i === last - 1) {
      label = "Pro semifinals";
      live = "Tennis Channel · PBTV";
    } else if (i === last - 2) {
      label = "Pro quarterfinals";
      live = "Tennis Channel · PBTV";
    } else {
      live = "PBTV";
    }
    days.push({
      date: formatDate(cursor.toISOString().slice(0, 10)),
      iso: cursor.toISOString().slice(0, 10),
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
  const t = await resolveEvent(year, slug);
  if (!t) notFound();

  const countdown = daysUntil(t.startDate);
  const days = buildSchedule(t.startDate, t.endDate);
  const broadcastDays = days.filter((d) => d.live);
  const broadcast = getBroadcast(t.slug);
  const guide = getEventGuide(t.slug);
  const realSchedule = getEventSchedule(t.slug);
  const mapQuery = guide?.mapQuery ?? `${t.venue}, ${t.city}, ${t.state}`;
  // Hotels published from Jackalope (Kristen's live blocks) override the static
  // guide list when present, matched by city; otherwise the guide's own hotels.
  const publishedHotels = await publishedHotelsFor(t.city);
  const stayHotels = publishedHotels ?? guide?.hotels ?? [];

  const base = t.ticketPriceFrom;
  const ticketTiers = [
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
  // Brackets are built live from the match feed for any completed event.
  const showBracket = showResults;

  // Tournament replays — YouTube playlist mapped by slug (lib/event-replays.ts),
  // fetched server-side. Empty until a playlist ID is configured / a key exists.
  const replayPlaylistId = getReplayPlaylistId(t.slug);
  const replays = replayPlaylistId ? await getPlaylistVideos(replayPlaylistId) : [];
  const showReplays = replays.length > 0;

  const TABS = [
    { id: "overview", label: "Overview" },
    ...(showResults
      ? [
          { id: "champions", label: "Champions" },
          { id: "results", label: "Final Results" },
        ]
      : []),
    ...(showReplays ? [{ id: "replays", label: "Replays" }] : []),
    ...(completed
      ? []
      : [
          { id: "stakes", label: "What's at Stake" },
          { id: "schedule", label: "Order of Play" },
          { id: "watch", label: "Watch" },
          { id: "venue", label: "Venue Guide" },
        ]),
    ...(guide && !completed ? [{ id: "travel", label: "Plan Your Trip" }] : []),
    ...(completed ? [] : [{ id: "players", label: "Players" }]),
    ...(completed ? [] : [{ id: "involved", label: "Get Involved" }]),
    ...(coverage.length > 0 ? [{ id: "coverage", label: "Coverage" }] : []),
    { id: "sponsors", label: "Sponsors" },
    ...(completed ? [] : [{ id: "tickets", label: "Tickets" }]),
  ];

  const conciergeFacts = {
    shortName: t.shortName,
    city: t.city,
    state: t.state,
    venue: t.venue,
    dates: formatDateRange(t.startDate, t.endDate, true),
    gates: days[0]?.gates ?? "an hour before first serve",
    ticketFrom: t.ticketPriceFrom,
    ticketsUrl: withUtm(t.ticketsUrl, {
      campaign: t.slug,
      content: "event-concierge-tickets",
    }),
    registerUrl: withUtm(t.registerUrl, {
      campaign: t.slug,
      content: "event-concierge-register",
    }),
    parking: guide?.parking,
    airport: guide ? `${guide.airport} (${guide.airportNote})` : undefined,
    hotels: guide?.hotels.map((h) => h.name) ?? [],
    dining: guide?.dining.map((d) => d.name) ?? [],
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
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            name: t.name,
            sport: "Pickleball",
            startDate: t.startDate,
            endDate: t.endDate,
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode:
              "https://schema.org/MixedEventAttendanceMode",
            location: {
              "@type": "Place",
              name: t.venue,
              address: t.state ? `${t.city}, ${t.state}` : t.city,
            },
            image: `${SITE_URL}${t.image}`,
            url: `${SITE_URL}${eventHref(t)}`,
            organizer: {
              "@type": "Organization",
              name: "Carvana PPA Tour",
              url: SITE_URL,
            },
            offers: {
              "@type": "Offer",
              url: t.ticketsUrl,
              price: t.ticketPriceFrom,
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
            },
          }),
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
        <div className="absolute inset-0 scrim-hero" />
        {/* Soften the header→hero seam: navy fades down into the hero image. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 bg-gradient-to-b from-ppa-navy to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-20">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.16em]">
            <span className="bg-[var(--event-accent)] px-2 py-0.5">
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
            {t.brand?.icon && (
              <Image
                src={t.brand.icon}
                alt=""
                width={133}
                height={364}
                className="h-28 w-auto shrink-0 rounded-md drop-shadow-[0_4px_18px_rgba(2,49,85,0.55)] motion-safe:animate-rise sm:h-44"
                style={{ animationDelay: "120ms" }}
              />
            )}
            <h1 className="max-w-[18ch] event-display text-[clamp(1.9rem,5.4vw,3.25rem)] uppercase leading-[0.98]">
              {t.shortName}
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
              {completed ? "🏆 Champions crowned" : `${t.prizeMoney} On the Line`}
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
                  href="https://www.pickleballtv.com/?utm_source=ppatour&utm_medium=website&utm_campaign=event&utm_content=event-hero-replays"
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
                <a
                  href={withUtm(t.ticketsUrl, { campaign: t.slug, content: "event-hero-buy-tickets" })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center bg-[var(--event-accent)] px-6 text-xs font-bold uppercase tracking-[0.12em] transition hover:brightness-90 active:scale-[0.98]"
                >
                  Buy Tickets — from ${t.ticketPriceFrom}
                </a>
                <a
                  href={withUtm(t.registerUrl, { campaign: t.slug, content: "event-hero-register" })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
                >
                  Register to Play ↗
                </a>
                <a
                  href="#travel"
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
                >
                  Plan Your Trip ↓
                </a>
                <a
                  href="#watch"
                  className="hidden h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy sm:flex"
                >
                  ▶ How to Watch
                </a>
              </>
            )}
          </div>
        </div>
        {!completed && <FirstServeCountdown targetIso={t.startDate} />}
        <div className={`relative h-1 ${completed ? "bg-ppa-yellow" : "bg-[var(--event-accent)]"}`} />
      </section>

      {/* Floating event nav */}
      <EventTabNav
        tabs={TABS}
        eventName={t.shortName}
        icon={t.brand?.icon}
        ticketsUrl={
          completed
            ? undefined
            : withUtm(t.ticketsUrl, { campaign: t.slug, content: "event-tabnav-buy-tickets" })
        }
        ticketPriceFrom={completed ? undefined : t.ticketPriceFrom}
      />

      {/* Overview — quick facts (right below the hero) */}
      <section id="overview" className="scroll-mt-[120px] bg-ppa-navy-deep text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 px-4 sm:grid-cols-4">
          {[
            { k: "Dates", v: formatDateRange(t.startDate, t.endDate, true) },
            { k: "Venue", v: t.venue },
            { k: "Prize Purse", v: t.prizeMoney, accent: true },
            { k: eventTierLabel(t), v: `${tierPoints(t).toLocaleString()} Pts` },
          ].map((f, i) => (
            <div
              key={f.k}
              className={`px-4 py-5 ${i % 2 === 1 ? "border-l border-white/10" : ""} ${i >= 2 ? "border-t border-white/10 sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                {f.k}
              </p>
              <p className={`mt-1 font-display text-base uppercase ${f.accent ? "text-ppa-yellow" : "text-white"}`}>
                {f.v}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Completed events: champions → final results (standings / scores / bracket) */}
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
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
                How {t.shortName} Finished
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
            <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
              Watch {t.shortName} Back
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-white/55">
              Every match, highlight, and marquee moment from {t.shortName}, straight
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
            Why {t.shortName} Matters
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/60">
            A {eventTierLabel(t)} title is worth{" "}
            <span className="font-bold text-ppa-navy">
              {tierPoints(t).toLocaleString()} ranking points
            </span>{" "}
            in every division — enough to reshuffle the season-long points
            race in one weekend. The tour puts{" "}
            <span className="font-bold text-ppa-navy">{t.prizeMoney}</span>{" "}
            in prize purse behind this event, and the
            defending champions below are all back to protect their titles.
          </p>

          <div data-reveal className="mt-6 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-3">
            {[
              {
                k: "Ranking Points",
                v: tierPoints(t).toLocaleString(),
                note: "Per division title — toward the season race",
              },
              {
                k: "Prize Purse",
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

          <div className="mt-4 flex flex-wrap gap-4">
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
              Inside {t.shortName}
            </h2>
            <p className="mt-3 max-w-xl text-sm text-white/60">
              Real photos from the grounds — tap any shot to flip through
              what a day here actually looks like.
            </p>
            <EventGallery images={t.gallery} eventName={t.shortName} />
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
              {/* Pro Play */}
              <div className="mt-6 overflow-hidden border border-ppa-line">
                <div className="grid grid-cols-[4.5rem_1fr_auto] gap-3 border-b border-ppa-line bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45 sm:grid-cols-[5.5rem_1fr_7rem_10rem]">
                  <span>Date</span>
                  <span>Pro Play</span>
                  <span className="hidden text-right sm:block">First Serve</span>
                  <span className="text-right">Live</span>
                </div>
                {realSchedule.proDays.map((d) => (
                  <div
                    key={d.date}
                    className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 border-b border-ppa-line bg-white px-4 py-3 last:border-b-0 sm:grid-cols-[5.5rem_1fr_7rem_10rem]"
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
                      </span>
                    </span>
                    <span className="hidden text-right text-sm font-bold tabular-nums text-ppa-navy sm:block">
                      {d.firstServe}
                    </span>
                    <span className="text-right text-[10px] font-bold uppercase tracking-[0.1em]">
                      {d.live ? (
                        <span className="text-[var(--event-accent)]">{d.live}</span>
                      ) : (
                        <span className="text-ppa-navy/30">—</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Amateur & Junior Play */}
              <h3 className="mt-8 font-display text-lg uppercase text-ppa-navy">
                Amateur & Junior Play
              </h3>
              <div className="mt-3 overflow-hidden border border-ppa-line">
                <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-b border-ppa-line bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45 sm:grid-cols-[9rem_1fr]">
                  <span>When</span>
                  <span>Amateur & Junior Play</span>
                </div>
                {realSchedule.amateur.map((a) => (
                  <div
                    key={a.label}
                    className="grid grid-cols-[7.5rem_1fr] items-baseline gap-3 border-b border-ppa-line bg-white px-4 py-3 last:border-b-0 sm:grid-cols-[9rem_1fr]"
                  >
                    <span className="font-display text-sm uppercase leading-tight text-[var(--event-accent)]">
                      {a.when}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ppa-navy">
                        {a.label}
                      </span>
                      {a.detail && (
                        <span className="block text-[12px] text-ppa-navy/55">
                          {a.detail}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-ppa-navy/50">
                {realSchedule.amateurNote}{" "}
                <a
                  href={withUtm(t.registerUrl, {
                    campaign: t.slug,
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
            Can&apos;t make it to {t.city}? Follow all four days live — free on
            YouTube, with the marquee rounds on national TV.
          </p>

          {/* Broadcast schedule — real windows from the PPA broadcast sheet */}
          <div className="mt-6 overflow-hidden border border-white/10">
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
              : broadcastDays.map((d) => (
                  <div
                    key={d.iso}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-white/5 px-4 py-3 last:border-b-0"
                  >
                    <span className="text-sm font-bold uppercase tracking-wide text-white">
                      {d.label.replace("Championship Sunday — ", "")}
                    </span>
                    <span className="text-right text-xs font-bold uppercase tracking-[0.1em] text-ppa-sky">
                      {d.live} · {d.date}
                    </span>
                  </div>
                ))}
          </div>

          {/* How to watch */}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {HOW_TO_WATCH.map((w) => (
              <div
                key={w.name}
                className="flex flex-col border border-white/10 bg-ppa-navy-deep p-5"
              >
                {w.logo ? (
                  <span className="flex h-10 w-fit items-center justify-center rounded bg-white px-3">
                    <Image
                      src={w.logo}
                      alt={w.name}
                      width={120}
                      height={40}
                      className="h-6 w-auto object-contain"
                    />
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
                    href={w.href}
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
            Find your way around the grounds, then check the essentials —
            gates, parking, and what to bring.
          </p>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div data-reveal>
              <VenueMap venue={t.venue} />
            </div>

            <div data-reveal className="flex flex-col gap-px border border-ppa-line bg-ppa-line">
              {[
                {
                  k: "Gates & Sessions",
                  v: `Gates open ${days[0]?.gates ?? "an hour before first serve"} daily. Morning and evening sessions are ticketed separately at Championship Court; a grounds pass covers the outer courts all day.`,
                },
                {
                  k: "Parking & Shuttle",
                  v: guide?.parking ?? "On-site lots open with the gates; ADA and rideshare drop-off at the main gate. Official parking map published event week.",
                },
                {
                  k: "What to Bring",
                  v: "Small bags OK (checked at the gate) · sunscreen and a hat · no coolers or outside alcohol · personal cameras welcome, no tripods.",
                },
                {
                  k: "Players & Autographs",
                  v: "Pros warm up on the practice courts and sign after matches near the player zone — bring a paddle skin or ball.",
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
                  <p className="px-4 pb-4 text-sm leading-relaxed text-ppa-navy/70">
                    {row.v}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
      </>
      )}

      {/* Plan Your Trip — Ragnar-style (upcoming/live only) */}
      {guide && !completed && (
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
                <p className="mt-3 text-sm leading-relaxed text-ppa-navy/65">
                  {guide.parking}
                </p>
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
                      </li>
                    ))}
                  </ul>
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

      {/* Players + Divisions + Champions (upcoming/live only) */}
      {!completed && (
      <section id="players" className="scroll-mt-[120px] bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Players to Watch
              </p>
              <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                In the Draw
              </h2>
              <div className="mt-5 flex flex-col gap-px border border-ppa-line bg-ppa-line">
                {playersToWatch.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/athletes/${p.slug}`}
                    className="group flex items-center gap-3 bg-white p-3 transition-colors hover:bg-ppa-paper"
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-ppa-navy-deep">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="56px"
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="font-display text-sm uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-blue">
                        No. {p.rank} · {p.division}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Divisions
              </p>
              <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Five Brackets, {tierPoints(t).toLocaleString()} Points
              </h2>
              <ul className="mt-5 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2">
                {DIVISIONS.map((d) => (
                  <li
                    key={d}
                    className="flex items-center gap-2 bg-white p-3 text-sm font-semibold text-ppa-navy"
                  >
                    <span className="size-1.5 bg-ppa-blue" />
                    {d}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Defending Champions
              </p>
              <div className="mt-2 border-t border-ppa-line">
                {PAST_CHAMPIONS.map((c) => (
                  <div
                    key={c.division}
                    className="flex items-center justify-between gap-3 border-b border-ppa-line py-2.5"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45">
                      {c.division}
                    </span>
                    <span className="font-display text-sm uppercase text-ppa-navy">
                      {c.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
                  {completed ? `Relive ${t.shortName}` : `The ${t.shortName} Story So Far`}
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
                  href={`/news/${c.slug}`}
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
                  campaign: t.slug,
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
                  <VolunteerModalButton label={c.cta} eventName={t.shortName} />
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
                campaign: t.slug,
                content: "event-tickets-register",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
            >
              Or register to play ↗
            </a>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ticketTiers.map((tier) => (
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
                    campaign: t.slug,
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
          </div>
        </div>
      </section>
      )}

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
                      alt={`${o.shortName} badge`}
                      fill
                      sizes="34px"
                      className="object-contain"
                    />
                  </span>
                )}
                <div className="relative p-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                    {eventTierShort(o)} · {tierPoints(o).toLocaleString()}
                  </p>
                  <p className="mt-0.5 font-display text-base uppercase leading-[1.05]">
                    {o.shortName}
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
