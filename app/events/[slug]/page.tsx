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

const BROADCAST = [
  {
    name: "FOX & FS1",
    note: "Sunday Final, live national TV",
    href: "/news",
    external: false,
  },
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

const TRAVEL_LINKS = [
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
];

function buildSchedule(startIso: string, endIso: string) {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const days: { date: string; iso: string; label: string }[] = [];
  const cursor = new Date(start);
  let i = 0;
  while (cursor <= end) {
    const total = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    let label = "Pro main draw";
    if (i === 0) label = "Amateur & junior brackets";
    else if (i === 1) label = "Senior open + pro qualifying";
    else if (i === total - 1) label = "Championship Sunday — Finals";
    else if (i === total - 2) label = "Pro semifinals + 3rd-place playoffs";
    else if (i === total - 3) label = "Pro quarterfinals";
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
  const otherTournaments = tournaments.filter((x) => x.slug !== t.slug).slice(0, 3);

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
          className="will-change-transform object-cover object-center"
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
                content: "event-page-buy-tickets",
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
                content: "event-page-register",
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

      {/* Quick facts band */}
      <section className="bg-ppa-navy-deep text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 px-4 sm:grid-cols-4">
          <div className="border-r border-white/10 px-4 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              Dates
            </p>
            <p className="mt-1 font-display text-base uppercase text-white">
              {formatDateRange(t.startDate, t.endDate)}
            </p>
          </div>
          <div className="border-white/10 px-4 py-5 sm:border-r">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              Venue
            </p>
            <p className="mt-1 font-display text-base uppercase text-white">
              {t.venue}
            </p>
          </div>
          <div className="border-r border-t border-white/10 px-4 py-5 sm:border-t-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              Ranking Points
            </p>
            <p className="mt-1 font-display text-base uppercase text-ppa-yellow">
              {t.points.toLocaleString()}
            </p>
          </div>
          <div className="border-t border-white/10 px-4 py-5 sm:border-t-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              Tier
            </p>
            <p className="mt-1 font-display text-base uppercase text-white">
              {t.tier}
            </p>
          </div>
        </div>
      </section>

      {/* Schedule + Players */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            {/* Schedule */}
            <div>
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

            {/* Players to watch */}
            <aside>
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

      {/* Where to Watch */}
      <section className="bg-white">
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
        </div>
      </section>

      {/* Travel + Hospitality cross-links */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            On-Site
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Make a Weekend of It
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {TRAVEL_LINKS.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="group flex flex-col border border-ppa-line bg-white p-5 transition-colors hover:bg-ppa-paper"
              >
                <span className="font-display text-lg uppercase leading-none text-ppa-navy transition-colors group-hover:text-ppa-blue">
                  {c.label}
                </span>
                <span className="mt-1.5 text-xs text-ppa-navy/55">
                  {c.blurb}
                </span>
                <span className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors group-hover:text-ppa-blue">
                  Learn More →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Other events */}
      <section className="bg-white">
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
