"use client";

import { useEffect, useState } from "react";
import { SITE_URL } from "@/lib/site";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { EventConcierge } from "@/components/events/EventConcierge";
import { EventTabNav } from "@/components/events/EventTabNav";
import { EventGallery } from "@/components/events/EventGallery";
import { VolunteerModalButton } from "@/components/events/VolunteerModalButton";
import { ScoresBoard } from "@/components/live/ScoresBoard";
import { ChampionsBanner } from "@/components/live/ChampionsBanner";
import { BracketPanel } from "@/components/live/BracketPanel";
import { ATLANTA_EVENT_ID } from "@/lib/bracket-sample";
import { getBroadcast } from "@/lib/broadcast";
import { getEventGuide } from "@/lib/event-guides";
import { getEventSchedule } from "@/lib/event-schedule";
import { playersToWatch } from "@/lib/home-content";
import { getArticlesForEvent } from "@/lib/news-articles";
import {
  eventHref,
  formatDate,
  formatDateRange,
  eventTierLabel,
  tierPoints,
  eventTierShort,
  whyItMattersHeading,
  tournaments,
} from "@/lib/placeholder-data";
import { withUtm, withCampaign } from "@/lib/utm";
import { TicketGrid } from "@/components/events/TicketGrid";
import type { TicketGrid as TicketGridData } from "@/lib/ticket-grid-view";
import { matchdayPrimary } from "@/lib/matchday";

/**
 * LIVE variant of the National Championships event page. Counts down to first
 * serve, then transitions to the live experience the moment the clock hits 0 —
 * no reload: LIVE NOW hero, live score ticker, and an order-of-play with the
 * current round flagged live. Mirrors the real event page otherwise.
 *
 * First serve resolves (client-side) from, in priority order:
 *   ?at=<ISO>       — absolute datetime (e.g. ?at=2026-08-31T09:00:00)
 *   ?in=<seconds>   — relative to page load (e.g. ?in=60)
 *   default         — DEFAULT_DEMO_LEAD_S after load, so the page always
 *                     demonstrates the countdown → live transition.
 */
const BASE_SLUG = "veolia-pickleball-national-championships";
// Pro-day index that goes "live" first (once the clock hits 0): Quarterfinals.
// Earlier days read as Final, later days stay upcoming.
const LIVE_DAY_INDEX = 4;
// Seconds from page load until first serve when no ?at/?in is given.
const DEFAULT_DEMO_LEAD_S = 20;

/** Days/hours/mins/secs left until `ms` from now (0-floored). */
function splitDiff(ms: number) {
  const d = Math.max(0, ms);
  return {
    days: Math.floor(d / 86_400_000),
    hours: Math.floor((d % 86_400_000) / 3_600_000),
    mins: Math.floor((d % 3_600_000) / 60_000),
    secs: Math.floor((d % 60_000) / 1_000),
  };
}

const DIVISIONS = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
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
    // PNG, not SVG — next/image 400s on SVG.
    logo: "/ppa/networks/tennis-channel.png",
    note: "Featured rounds and Championship Sunday on national television.",
    detail: "Check local listings",
  },
  {
    name: "MATCHDAY App",
    logo: "/ppa/networks/matchday.png",
    note: "Live scores, brackets, order of play, and match alerts.",
    detail: "iOS · Android",
    href: matchdayPrimary("event-watch-matchday"),
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

export function NationalsLive({
  ticketGrid = null,
}: {
  /**
   * Built on the server by the route (lib/ticket-grid.ts reads the 200KB price
   * snapshot and must stay out of the client bundle). Null when the stop isn't
   * on sale or is withheld, in which case the flat tier cards below apply.
   */
  ticketGrid?: TicketGridData | null;
} = {}) {
  const baseEvent = tournaments.find((x) => x.slug === BASE_SLUG);
  if (!baseEvent) notFound();
  // Same event; the hero + live sections flip on once first serve arrives.
  const t = { ...baseEvent, status: "live" as const };

  // Lifecycle clock. `target` = first serve, `endTarget` = tournament over.
  // Resolved on mount (needs the URL); until then it renders the countdown.
  const [target, setTarget] = useState<number | null>(null);
  const [endTarget, setEndTarget] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const at = params.get("at");
    const inS = params.get("in");
    let tgt: number;
    if (at && !Number.isNaN(Date.parse(at))) tgt = Date.parse(at);
    else if (inS && Number.isFinite(Number(inS)))
      tgt = Date.now() + Number(inS) * 1000;
    else tgt = Date.now() + DEFAULT_DEMO_LEAD_S * 1000;
    setTarget(tgt);

    // This live demo stays live once first serve hits — the completed state
    // lives on the real completed event pages (/events/[slug]), not here.
    setEndTarget(Number.MAX_SAFE_INTEGER);

    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const ready = now !== null && target !== null && endTarget !== null;
  const diffMs = ready ? Math.max(0, target - now) : null;
  const isCompleted = ready ? now >= endTarget : false;
  const isLive = ready ? now >= target && now < endTarget : false;
  const started = isLive || isCompleted; // first serve has happened

  // Live-scores area: scoreboard vs bracket.
  const [scoreView, setScoreView] = useState<"scores" | "bracket">("scores");

  const days = buildSchedule(t.startDate, t.endDate);
  const broadcastDays = days.filter((d) => d.live);
  const broadcast = getBroadcast(t.slug);
  const guide = getEventGuide(t.slug);
  const realSchedule = getEventSchedule(t.slug);
  const mapQuery = guide?.mapQuery ?? `${t.venue}, ${t.city}, ${t.state}`;

  const showGrid = Boolean(ticketGrid?.hasPerDayPricing);
  // Fallback only. These three were derived arithmetically (base x2, x2.6) and
  // were never real Tixr prices — the main event page stopped publishing them
  // once the snapshot landed, and this file kept doing it. They now render only
  // when there is no real per-day grid to show.
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
  const completed = false;

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "live", label: "Live Scores" },
    { id: "stakes", label: "What's at Stake" },
    { id: "schedule", label: "Order of Play" },
    { id: "watch", label: "Watch" },
    { id: "venue", label: "Venue Guide" },
    { id: "travel", label: "Plan Your Trip" },
    { id: "players", label: "Players" },
    { id: "involved", label: "Get Involved" },
    ...(coverage.length > 0 ? [{ id: "coverage", label: "Coverage" }] : []),
    { id: "tickets", label: "Tickets" },
  ];

  const conciergeFacts = {
    name: t.name,
    city: t.city,
    state: t.state,
    venue: t.venue,
    dates: formatDateRange(t.startDate, t.endDate, true),
    gates: days[0]?.gates ?? "an hour before first serve",
    ticketFrom: t.ticketPriceFrom,
    ticketsUrl: withUtm(t.ticketsUrl, {
      campaign: t.eventCode ?? t.slug,
      content: "event-concierge-tickets",
    }),
    registerUrl: withUtm(t.registerUrl, {
      campaign: t.eventCode ?? t.slug,
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
          // This was missing, which is why the live page rendered every heading
          // in Gotham while the main page for the SAME event rendered them in
          // Cormorant. `.event-display` falls back to Gotham when the variable
          // is absent, so the drift was silent — the classes looked right.
          // Keep in step with app/events/[year]/[slug]/page.tsx.
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
            url: `${SITE_URL}/events/${t.slug}-live`,
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
        {/* Kept in step with app/events/[year]/[slug]/page.tsx — see the note on
            `.scrim-hero-event` in globals.css. These two heroes render the same
            event and drift silently. */}
        <div className="absolute inset-0 scrim-hero-event" />
        {/* Soften the header→hero seam: navy fades down into the hero image. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 bg-gradient-to-b from-ppa-navy to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-20">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.16em]">
            {isLive && (
              <span className="flex items-center gap-1.5 bg-ppa-live px-2 py-0.5 text-white">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                Live Now
              </span>
            )}
            {isCompleted && (
              <span className="bg-ppa-yellow px-2 py-0.5 text-ppa-navy">Final</span>
            )}
            <span className="bg-[var(--event-accent)] px-2 py-0.5">
              {eventTierShort(t)} · {tierPoints(t).toLocaleString()} PTS
            </span>
            {t.presentedBy && (
              <span className="text-white/70">Presented by {t.presentedBy}</span>
            )}
            <span className="text-white/25">/</span>
            <span className="text-ppa-yellow tabular-nums">
              {isCompleted
                ? "Champions crowned"
                : isLive
                  ? "Matches in progress"
                  : diffMs === null
                    ? "First Serve Soon"
                    : (() => {
                        const { days: dd, hours, mins, secs } = splitDiff(diffMs);
                        return `${dd}D : ${hours}H : ${mins}M : ${secs}S`;
                      })()}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-4">
            {/* Same badge, same fix as the event hero: 133x364 declared a 0.365
                ratio against real files at ~0.545, so it relaid out ~50% wider
                once loaded. Above the fold here too, hence `priority`. */}
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
              {isCompleted
                ? "🏆 Champions crowned"
                : isLive
                  ? "▶ Live on PickleballTV"
                  : `${t.prizeMoney} On the Line`}
            </span>
          </div>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            {isCompleted ? (
              <>
                <a
                  href="#live"
                  className="flex h-11 items-center justify-center bg-ppa-yellow px-6 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition hover:brightness-95 active:scale-[0.98]"
                >
                  Full Results ↓
                </a>
                <a
                  href="https://www.pickleballtv.com/?utm_source=ppatour&utm_medium=website&utm_campaign=veolia-pickleball-national-championships-live&utm_content=event-hero-replays"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
                >
                  ▶ Watch Replays
                </a>
                <a
                  href={`/brackets?event=${ATLANTA_EVENT_ID}`}
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
                >
                  Full Bracket ↗
                </a>
              </>
            ) : isLive ? (
              <>
                <a
                  href="https://www.pickleballtv.com/?utm_source=ppatour&utm_medium=website&utm_campaign=veolia-pickleball-national-championships-live&utm_content=event-hero-watch-live"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center gap-1.5 bg-ppa-live px-6 text-xs font-bold uppercase tracking-[0.12em] transition hover:bg-ppa-live-deep active:scale-[0.98]"
                >
                  ▶ Watch Live
                </a>
                <a
                  href="#live"
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
                >
                  Live Scores ↓
                </a>
                <a
                  href={withUtm(t.ticketsUrl, { campaign: t.eventCode ?? t.slug, content: "event-hero-buy-tickets" })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
                >
                  Buy Tickets — from ${t.ticketPriceFrom}
                </a>
                <a
                  href="#travel"
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
                >
                  Plan Your Trip ↓
                </a>
              </>
            ) : (
              <>
                <a
                  href={withUtm(t.ticketsUrl, { campaign: t.eventCode ?? t.slug, content: "event-hero-buy-tickets" })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center bg-[var(--event-accent)] px-6 text-xs font-bold uppercase tracking-[0.12em] transition hover:brightness-90 active:scale-[0.98]"
                >
                  Buy Tickets — from ${t.ticketPriceFrom}
                </a>
                <a
                  href={withUtm(t.registerUrl, { campaign: t.eventCode ?? t.slug, content: "event-hero-register" })}
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
        {/* First Serve clock — bottom-right, until the moment it goes live */}
        {!started && diffMs !== null && (
          <div className="absolute bottom-8 right-4 hidden text-right motion-safe:animate-fade lg:block xl:right-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
              First Serve In
            </p>
            <div className="mt-1.5 flex items-start justify-end gap-2.5">
              {(() => {
                const s = splitDiff(diffMs);
                return [
                  { v: s.days, label: "Days" },
                  { v: s.hours, label: "Hrs" },
                  { v: s.mins, label: "Min" },
                  { v: s.secs, label: "Sec" },
                ];
              })().map((u, i, arr) => (
                <div key={u.label} className="flex items-start gap-2.5">
                  <div>
                    <p className="min-w-[2ch] font-display text-4xl leading-none text-white tabular-nums">
                      {String(u.v).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">
                      {u.label}
                    </p>
                  </div>
                  {i < arr.length - 1 && (
                    <span
                      aria-hidden
                      className="font-display text-3xl leading-none text-[var(--event-accent,#228be6)]"
                    >
                      :
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className={`relative h-1 ${isCompleted ? "bg-ppa-yellow" : isLive ? "bg-ppa-live" : "bg-[var(--event-accent)]"}`} />
      </section>

      {/* Floating event nav */}
      <EventTabNav tabs={TABS} eventName={t.name} icon={t.brand?.icon} />

      {/* Champions — leads the completed state */}
      {isCompleted && <ChampionsBanner eventId={ATLANTA_EVENT_ID} />}

      {/* Audience router — one page, three ways in */}
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

      {/* Overview — quick facts */}
      <section id="overview" className="scroll-mt-[120px] bg-ppa-navy-deep text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 px-4 sm:grid-cols-4">
          {[
            { k: "Dates", v: formatDateRange(t.startDate, t.endDate, true) },
            { k: "Venue", v: t.venue },
            { k: "Prize Money & Fees", v: t.prizeMoney, accent: true },
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

      {/* Live scores — happening now */}
      <section id="live" className="scroll-mt-[120px] bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className={`size-2 rounded-full ${isLive ? "animate-pulse bg-ppa-live" : isCompleted ? "bg-ppa-yellow" : "bg-white/30"}`} />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                  {isLive ? "Happening Now" : isCompleted ? "Final Results" : "Starts at First Serve"}
                </p>
              </div>
              <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
                {isCompleted ? "Scores & Brackets" : "Live Scores"}
              </h2>
            </div>
            <a
              href="https://www.pickleballtv.com/?utm_source=ppatour&utm_medium=website&utm_campaign=veolia-pickleball-national-championships-live&utm_content=live-scores-pbtv"
              target="_blank"
              rel="noopener noreferrer"
              className="group text-xs font-bold uppercase tracking-[0.12em] text-ppa-yellow hover:text-white"
            >
              Watch on PickleballTV{" "}
              <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">↗</span>
            </a>
          </div>
          {/* Scores ↔ Bracket toggle (once play has started) */}
          {started && (
            <div className="mt-6 inline-flex rounded-full border border-white/15 p-0.5">
              {(["scores", "bracket"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setScoreView(v)}
                  className={`rounded-full px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                    scoreView === v ? "bg-ppa-yellow text-ppa-navy" : "text-white/60 hover:text-white"
                  }`}
                >
                  {v === "scores" ? "Scores" : "Bracket"}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6">
            {started ? (
              scoreView === "scores" ? (
                <ScoresBoard eventId={ATLANTA_EVENT_ID} />
              ) : (
                <BracketPanel
                  eventId={ATLANTA_EVENT_ID}
                  expandHref={`/brackets?event=${ATLANTA_EVENT_ID}`}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 border border-white/10 bg-ppa-navy-deep px-6 py-10 text-center">
                <p className="font-display text-xl uppercase text-white tabular-nums">
                  {diffMs === null
                    ? "First Serve Soon"
                    : (() => {
                        const s = splitDiff(diffMs);
                        return `${s.days}D : ${s.hours}H : ${s.mins}M : ${s.secs}S`;
                      })()}
                </p>
                <p className="text-sm text-white/55">
                  Live scores go live the moment first serve hits — no refresh needed.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

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
            {/* Verb agrees with the name — see whyItMattersHeading. Kept in step
                with app/events/[year]/[slug]/page.tsx. */}
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
            in prize purse behind this event, with every top seed chasing
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
                k: "Prize Money & Fees",
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
                {realSchedule.proDays.map((d, i) => {
                  const dayDone = isCompleted || (isLive && i < LIVE_DAY_INDEX);
                  const dayLive = isLive && i === LIVE_DAY_INDEX;
                  return (
                  <div
                    key={d.date}
                    className={`grid grid-cols-[4.5rem_1fr_auto] items-start gap-3 border-b border-ppa-line px-4 py-3 last:border-b-0 lg:grid-cols-[5.5rem_1fr_1fr_6rem_9rem] lg:items-center ${
                      dayLive ? "bg-ppa-live/5" : "bg-white"
                    }`}
                  >
                    <span className={`font-display text-base uppercase leading-tight ${dayDone ? "text-ppa-navy/35" : "text-[var(--event-accent)]"}`}>
                      <span className="block text-[10px] font-sans font-bold leading-none text-ppa-navy/40">
                        {d.dow}
                      </span>
                      {d.date}
                    </span>
                    <span>
                      <span className={`block text-sm font-semibold ${dayDone ? "text-ppa-navy/50" : "text-ppa-navy"}`}>
                        {d.label}
                      </span>
                      <span className="block text-[11px] uppercase tracking-wide text-ppa-navy/40">
                        Gates {d.gates}
                        <span className="lg:hidden">
                          {" · "}First serve {d.firstServe}
                        </span>
                      </span>
                      {/* Under lg the amateur column folds under Pro Play. */}
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
                            <span className={`block text-sm font-semibold ${dayDone ? "text-ppa-navy/50" : "text-ppa-navy"}`}>
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
                      {dayLive ? (
                        <span className="inline-flex items-center gap-1 text-ppa-live">
                          <span className="size-1.5 animate-pulse rounded-full bg-ppa-live" />
                          Live
                        </span>
                      ) : dayDone ? (
                        <span className="text-ppa-navy/35">Final</span>
                      ) : d.live ? (
                        <span className="text-[var(--event-accent)]">{d.live}</span>
                      ) : (
                        <span className="text-ppa-navy/30">—</span>
                      )}
                    </span>
                  </div>
                  );
                })}
              </div>

              {/* Only what the tournament hasn't dated yet. */}
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

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            {/* A real aerial of the grounds (venue photo, aerial-first), not an
                illustrative map. Always resolves: gallery photo → event hero. */}
            <div data-reveal className="self-start">
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
                  <p className="px-4 pb-4 text-sm leading-relaxed text-ppa-navy/70">
                    {row.v}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Plan Your Trip — Ragnar-style */}
      {guide && (
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
                { heading: "Where to Stay", items: guide.hotels },
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
                        {p.href && (
                          <a
                            href={p.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/book mt-2 inline-flex items-center gap-1.5 bg-ppa-navy px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--event-accent)] active:scale-[0.98]"
                          >
                            Book the Group Rate
                            <span aria-hidden className="transition-transform duration-300 group-hover/book:translate-x-0.5">↗</span>
                          </a>
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

      {/* Players + Divisions + Champions.
          ⚠ Kept in step with app/events/[year]/[slug]/page.tsx — these two render
          the same event and drift silently. Full-width stacked blocks with the
          player cards running across, and no champions block when there are none
          to show (Wesley, 8/5). */}
      <section id="players" className="scroll-mt-[120px] bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Players to Watch
              </p>
              <h2 className="mt-2 event-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                In the Draw
              </h2>
              {/* border-b/r on the grid + border-l/t on each card, so a row that
                  doesn't fill leaves no grey ghost cell. See the note in
                  app/events/[year]/[slug]/page.tsx. */}
              <div className="mt-5 grid border-b border-r border-ppa-line sm:grid-cols-2 lg:grid-cols-3">
                {playersToWatch.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/athletes/${p.slug}`}
                    className="group flex items-center gap-3 border-l border-t border-ppa-line bg-white p-3 transition-colors hover:bg-ppa-paper"
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
              {/* No champions, no heading — the placeholder this replaced said
                  only that it had nothing to say. */}
              {t.defendingChampions && t.defendingChampions.length > 0 && (
                <>
                  <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                    Defending Champions
                  </p>
                  <div className="mt-2 border-t border-ppa-line">
                    {t.defendingChampions.map((c) => (
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
                </>
              )}
            </div>
          </div>
        </div>
      </section>

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

      {/* Get Involved */}
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

      {/* Tickets */}
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

          {showGrid && ticketGrid && (
            <TicketGrid grid={ticketGrid} campaign={t.eventCode ?? t.slug} />
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {!showGrid && ticketTiers.map((tier) => (
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
          </div>
        </div>
      </section>

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
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                    {eventTierShort(o)} · {tierPoints(o).toLocaleString()}
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
