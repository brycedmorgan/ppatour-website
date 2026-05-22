import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { getEventGuide } from "@/lib/event-guides";
import { playersToWatch } from "@/lib/home-content";
import {
  daysUntil,
  formatDate,
  formatDateRange,
  tierLabel,
  tierPoints,
  tierShort,
  tournaments,
} from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return tournaments.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const t = tournaments.find((x) => x.slug === slug);
  return { title: t ? t.shortName : "Event" };
}

const DIVISIONS = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
];

const PAST_CHAMPIONS = [
  { division: "Men's Singles", name: "Diego Marín" },
  { division: "Women's Singles", name: "Jade Rau" },
  { division: "Men's Doubles", name: "Bricker / Hartman" },
  { division: "Women's Doubles", name: "Safdar / Boyd" },
  { division: "Mixed Doubles", name: "Marín / Frost" },
];

const HOW_TO_WATCH = [
  {
    name: "FOX & FS1",
    note: "Championship Sunday and select semifinals, live on national television.",
    detail: "Check local listings",
  },
  {
    name: "PPA Tour · YouTube",
    note: "Every court, every match, every day — streamed free.",
    detail: "youtube.com/@ppatour",
    href: "https://www.youtube.com/@ppatour",
  },
  {
    name: "MATCHDAY App",
    note: "Live scores, brackets, order of play, and match alerts.",
    detail: "iOS · Android",
    href: "https://www.matchday.app",
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
      live = "FOX";
    } else if (i === last - 1) {
      label = "Pro semifinals";
      live = "FS1 + YouTube";
    } else if (i === last - 2) {
      label = "Pro quarterfinals";
      live = "PPA Tour YouTube";
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
  const { slug } = await params;
  const t = tournaments.find((x) => x.slug === slug);
  if (!t) notFound();

  const countdown = daysUntil(t.startDate);
  const days = buildSchedule(t.startDate, t.endDate);
  const broadcastDays = days.filter((d) => d.live);
  const guide = getEventGuide(t.slug);
  const mapQuery = guide?.mapQuery ?? `${t.venue}, ${t.city}, ${t.state}`;

  const base = t.ticketPriceFrom;
  const ticketTiers = [
    { name: "Grounds Pass", from: base, blurb: "All-day access to the outer courts and festival grounds." },
    { name: "Reserved Seating", from: base * 2, blurb: "Assigned seats at Championship Court for your session." },
    { name: "Championship Sunday", from: Math.round(base * 2.6), blurb: "The finals — the best seats for the title matches." },
  ];

  const otherTournaments = tournaments
    .filter((x) => x.slug !== t.slug && tierPoints(x) >= 1000)
    .slice(0, 3);

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "schedule", label: "Order of Play" },
    { id: "watch", label: "Watch" },
    { id: "travel", label: "Plan Your Trip" },
    { id: "players", label: "Players" },
    { id: "tickets", label: "Tickets" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-[62svh] flex-col justify-end overflow-hidden bg-ppa-navy text-white">
        <Image
          src={t.image}
          alt={t.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 scrim-hero" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-20">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.16em]">
            <span className="bg-ppa-blue px-2 py-0.5">
              {tierShort(t)} · {tierPoints(t).toLocaleString()} PTS
            </span>
            {t.presentedBy && (
              <span className="text-white/70">Presented by {t.presentedBy}</span>
            )}
            <span className="text-white/25">/</span>
            <span className="text-ppa-yellow">
              {countdown} {countdown === 1 ? "Day" : "Days"} Out
            </span>
          </div>
          <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(1.9rem,5.4vw,3.25rem)] uppercase leading-[0.98]">
            {t.shortName}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wide text-white/75">
            <span>{formatDateRange(t.startDate, t.endDate)}</span>
            <span className="text-white/25">|</span>
            <span>
              {t.venue} · {t.city}
              {t.state ? `, ${t.state}` : ""}
            </span>
            <span className="text-white/25">|</span>
            <span className="text-ppa-yellow">{t.prizeMoney} Purse</span>
          </div>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <a
              href={withUtm(t.ticketsUrl, {
                campaign: t.slug,
                content: "event-hero-buy-tickets",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-ppa-blue-deep"
            >
              Buy Tickets — from ${t.ticketPriceFrom}
            </a>
            <a
              href="#travel"
              className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
            >
              Plan Your Trip ↓
            </a>
            <a
              href="#watch"
              className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
            >
              ▶ How to Watch
            </a>
          </div>
        </div>
        <div className="relative h-1 bg-ppa-blue" />
      </section>

      {/* Sticky tab nav */}
      <nav className="sticky top-[100px] z-40 border-b border-ppa-line bg-ppa-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              className="shrink-0 px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/55 transition-colors hover:text-ppa-blue"
            >
              {tab.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Overview — quick facts */}
      <section id="overview" className="scroll-mt-[150px] bg-ppa-navy-deep text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 px-4 sm:grid-cols-4">
          {[
            { k: "Dates", v: formatDateRange(t.startDate, t.endDate) },
            { k: "Venue", v: t.venue },
            { k: "Total Purse", v: t.prizeMoney, accent: true },
            { k: tierLabel(t), v: `${tierPoints(t).toLocaleString()} Pts` },
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

      {/* Gallery — real event photos when available */}
      {t.gallery && t.gallery.length > 0 && (
        <section className="bg-ppa-navy">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-ppa-blue" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                The Scene
              </p>
            </div>
            <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
              Inside {t.shortName}
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {t.gallery.map((src, i) => (
                <div
                  key={src}
                  className={`group relative aspect-[4/3] overflow-hidden bg-ppa-navy-deep ${
                    i === 0 ? "sm:col-span-3 sm:aspect-[16/7]" : ""
                  }`}
                >
                  <Image
                    src={src}
                    alt={`${t.shortName} — championship action`}
                    fill
                    sizes={i === 0 ? "100vw" : "(min-width: 640px) 33vw, 100vw"}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Order of Play */}
      <section id="schedule" className="scroll-mt-[150px] bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Order of Play
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Daily Schedule & Session Times
          </h2>
          <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
            All times local. Gates open an hour before first serve; finals
            move to a late-morning start for the broadcast window.
          </p>
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
        </div>
      </section>

      {/* Watch at home — PGA-style */}
      <section id="watch" className="scroll-mt-[150px] bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              Watching at Home
            </p>
          </div>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] sm:text-3xl">
            Every Match, Every Screen
          </h2>
          <p className="mt-3 max-w-xl text-sm text-white/65">
            Can&apos;t make it to {t.city}? Follow all four days live — free on
            YouTube, with the marquee rounds on national TV.
          </p>

          {/* Broadcast schedule */}
          <div className="mt-6 overflow-hidden border border-white/10">
            <div className="grid grid-cols-[1fr_auto_5rem] gap-3 border-b border-white/10 bg-ppa-navy-deep px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              <span>Round</span>
              <span>Channel</span>
              <span className="text-right">Date</span>
            </div>
            {broadcastDays.map((d) => (
              <div
                key={d.iso}
                className="grid grid-cols-[1fr_auto_5rem] items-center gap-3 border-b border-white/5 px-4 py-3 last:border-b-0"
              >
                <span className="text-sm font-bold uppercase tracking-wide text-white">
                  {d.label.replace("Championship Sunday — ", "")}
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.1em] text-ppa-sky">
                  {d.live}
                </span>
                <span className="text-right text-sm font-semibold tabular-nums text-white/70">
                  {d.date}
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
                <span className="text-sm text-ppa-sky">▶</span>
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

      {/* Plan Your Trip — Ragnar-style */}
      {guide && (
        <section id="travel" className="scroll-mt-[150px] bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-ppa-blue" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                Make a Trip of It
              </p>
            </div>
            <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
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
                          <span className="font-display text-sm uppercase leading-tight text-ppa-navy">
                            {p.name}
                          </span>
                          <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.1em] text-ppa-blue">
                            {p.tag}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-ppa-navy/55">
                          {p.note}
                        </p>
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

      {/* Players + Divisions + Champions */}
      <section id="players" className="scroll-mt-[150px] bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Players to Watch
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                In the Draw
              </h2>
              <div className="mt-5 flex flex-col gap-px border border-ppa-line bg-ppa-line">
                {playersToWatch.map((p) => (
                  <Link
                    key={p.name}
                    href="/athletes"
                    className="group flex items-center gap-3 bg-white p-3 transition-colors hover:bg-ppa-paper"
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden bg-ppa-navy-deep">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="56px"
                        className="object-cover object-top grayscale transition-all duration-500 group-hover:grayscale-0"
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
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
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

      {/* Tickets */}
      <section id="tickets" className="scroll-mt-[150px] bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Tickets
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
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

      {/* More stops */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                More Stops
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Next on the Main Tour
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
                href={`/events/${o.slug}`}
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
                <div className="relative p-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                    {tierShort(o)} · {tierPoints(o).toLocaleString()}
                  </p>
                  <p className="mt-0.5 font-display text-base uppercase leading-[1.05]">
                    {o.shortName}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    {formatDateRange(o.startDate, o.endDate)} · {o.city}
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
    </>
  );
}
