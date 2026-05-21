import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { playersToWatch } from "@/lib/home-content";
import {
  daysUntil,
  formatDate,
  formatDateRange,
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

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "schedule", label: "Schedule" },
  { id: "divisions", label: "Divisions" },
  { id: "players", label: "Players" },
  { id: "tickets", label: "Tickets" },
  { id: "watch", label: "Watch" },
];

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

const BROADCAST = [
  { name: "FOX & FS1", note: "Sunday Final, live national TV", href: "/news", external: false },
  {
    name: "PPA Tour · YouTube",
    note: "Every court, all weekend",
    href: "https://www.youtube.com/@ppatour",
    external: true,
  },
  {
    name: "MATCHDAY App",
    note: "Live scores + match alerts",
    href: "https://www.matchday.app",
    external: true,
  },
];

function buildSchedule(startIso: string, endIso: string) {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const days: { date: string; iso: string; label: string }[] = [];
  const cursor = new Date(start);
  const total = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  let i = 0;
  while (cursor <= end) {
    let label = "Pro main draw";
    if (i === 0) label = "Amateur & junior brackets";
    else if (i === 1) label = "Senior open + pro qualifying";
    else if (i === total) label = "Championship Sunday — Finals";
    else if (i === total - 1) label = "Pro semifinals + 3rd-place playoffs";
    else if (i === total - 2) label = "Pro quarterfinals";
    days.push({
      date: formatDate(cursor.toISOString().slice(0, 10)),
      iso: cursor.toISOString().slice(0, 10),
      label,
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
  const base = t.ticketPriceFrom;
  const ticketTiers = [
    {
      name: "Grounds Pass",
      from: base,
      blurb: "All-day access to the outer courts and festival grounds.",
    },
    {
      name: "Reserved Seating",
      from: base * 2,
      blurb: "Assigned seats at Championship Court for your session.",
    },
    {
      name: "Championship Sunday",
      from: Math.round(base * 2.6),
      blurb: "The finals — the best seats for the title matches.",
    },
  ];
  const otherTournaments = tournaments
    .filter((x) => x.slug !== t.slug)
    .slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-[58svh] flex-col justify-end overflow-hidden bg-ppa-navy text-white">
        <Image
          src={t.image}
          alt={t.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 scrim-hero" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-9 pt-20">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.16em]">
            <span className="bg-ppa-blue px-2 py-0.5">{t.tier}</span>
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
            <span>{t.venue}</span>
            <span className="text-white/25">|</span>
            <span className="text-ppa-yellow">
              {t.points.toLocaleString()} Ranking Points
            </span>
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
              href={withUtm(t.registerUrl, {
                campaign: t.slug,
                content: "event-hero-register",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
            >
              Register to Play
            </a>
          </div>
        </div>
        <div className="relative h-1 bg-ppa-blue" />
      </section>

      {/* Sticky in-page tab nav */}
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
      <section
        id="overview"
        className="scroll-mt-[150px] bg-ppa-navy-deep text-white"
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 px-4 sm:grid-cols-4">
          {[
            { k: "Dates", v: formatDateRange(t.startDate, t.endDate) },
            { k: "Venue", v: t.venue },
            { k: "Ranking Points", v: t.points.toLocaleString(), accent: true },
            { k: "Tier", v: t.tier },
          ].map((f, i) => (
            <div
              key={f.k}
              className={`px-4 py-5 ${i % 2 === 1 ? "border-l border-white/10" : ""} ${i >= 2 ? "border-t border-white/10 sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                {f.k}
              </p>
              <p
                className={`mt-1 font-display text-base uppercase ${f.accent ? "text-ppa-yellow" : "text-white"}`}
              >
                {f.v}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Schedule + Players */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div id="schedule" className="scroll-mt-[150px]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Schedule
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Day by Day
              </h2>
              <div className="mt-5 border-t border-ppa-line">
                {days.map((d) => (
                  <div
                    key={d.iso}
                    className="grid grid-cols-[5rem_1fr] gap-3 border-b border-ppa-line py-3.5"
                  >
                    <span className="font-display text-base uppercase text-ppa-blue">
                      {d.date}
                    </span>
                    <span className="text-sm text-ppa-navy/75">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <aside id="players" className="scroll-mt-[150px]">
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
              <Link
                href="/athletes"
                className="mt-4 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
              >
                Full Player List →
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {/* Divisions + Past Champions */}
      <section id="divisions" className="scroll-mt-[150px] bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Divisions
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Five Brackets, {t.points.toLocaleString()} Points
              </h2>
              <p className="mt-3 max-w-md text-sm text-ppa-navy/60">
                Every division at {t.shortName} carries{" "}
                {t.points.toLocaleString()} ranking points toward the season
                race, plus amateur, junior, and senior brackets all weekend.
              </p>
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
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Last Year
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Defending Champions
              </h2>
              <div className="mt-5 border-t border-ppa-line">
                {PAST_CHAMPIONS.map((c) => (
                  <div
                    key={c.division}
                    className="flex items-center justify-between gap-3 border-b border-ppa-line py-3"
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
      <section id="tickets" className="scroll-mt-[150px] bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Tickets
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Pick Your Seats
              </h2>
            </div>
            <p className="max-w-xs text-sm text-ppa-navy/55 sm:text-right">
              Tickets are sold through tixr. Kids under 5 are free on the
              grounds.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ticketTiers.map((tier) => (
              <div
                key={tier.name}
                className="flex flex-col border border-ppa-line bg-white p-5"
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

            {/* Suites / hospitality */}
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

      {/* Where to Watch */}
      <section id="watch" className="scroll-mt-[150px] bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Where to Watch
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Every Court, Every Match
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {BROADCAST.map((b) => (
              <Link
                key={b.name}
                href={b.href}
                target={b.external ? "_blank" : undefined}
                rel={b.external ? "noopener noreferrer" : undefined}
                className="group flex flex-col border border-ppa-line bg-ppa-paper p-5 transition-colors hover:bg-white"
              >
                <span className="text-sm text-ppa-blue">▶</span>
                <p className="mt-2 font-display text-lg uppercase leading-none text-ppa-navy">
                  {b.name}
                </p>
                <p className="mt-1.5 text-xs text-ppa-navy/55">{b.note}</p>
                <span className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors group-hover:text-ppa-blue">
                  Open {b.external ? "↗" : "→"}
                </span>
              </Link>
            ))}
          </div>

          {/* Travel + hospitality cross-links */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              {
                label: "Travel & Hotels",
                href: "/tour/travel",
                blurb: "Partner hotels with event-rate rooms and shuttles.",
              },
              {
                label: "Hospitality",
                href: "/tour/hospitality",
                blurb: "Courtside boxes, suites, and player experiences.",
              },
            ].map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="group flex items-center justify-between gap-3 border border-ppa-line bg-ppa-paper p-4 transition-colors hover:bg-white"
              >
                <span>
                  <span className="block font-display text-base uppercase text-ppa-navy transition-colors group-hover:text-ppa-blue">
                    {c.label}
                  </span>
                  <span className="text-xs text-ppa-navy/55">{c.blurb}</span>
                </span>
                <span aria-hidden className="text-ppa-blue">
                  →
                </span>
              </Link>
            ))}
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
                Next on the Schedule
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
                    {o.tier}
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
