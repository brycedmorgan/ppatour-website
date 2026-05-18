import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import {
  daysUntil,
  formatDateRange,
  getNextTournament,
  getUpcomingTournaments,
} from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

const STORYLINES = [
  { tag: "Story of the Match", title: "Johns brothers chase a third straight doubles crown" },
  { tag: "Rivalry Watch", title: "Can Anna Leigh Waters be stopped in Raleigh?" },
  { tag: "On the Rise", title: "The 19-year-old turning pro heads everywhere" },
];

const SPONSORS = ["VEOLIA", "SELKIRK", "LIFE TIME", "HYPEROX", "GUARANTEED RATE"];

export default function Home() {
  const next = getNextTournament();
  const upcoming = getUpcomingTournaments(3);
  const countdown = daysUntil(next.startDate);

  return (
    <>
      {/* ── Next-event hero ─────────────────────────────────── */}
      <section className="bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-ppa-red px-3 py-1 text-xs font-bold uppercase tracking-widest">
            Next Stop
            <span className="text-ppa-yellow">
              {countdown} {countdown === 1 ? "day" : "days"} to go
            </span>
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            {next.name}
          </h1>
          <p className="mt-3 text-lg text-white/70">
            {formatDateRange(next.startDate, next.endDate)} · {next.venue} ·{" "}
            {next.city}, {next.state}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href={withUtm(next.ticketsUrl, {
                campaign: next.slug,
                content: "hero-buy-tickets",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-13 items-center justify-center rounded-lg bg-ppa-red px-7 text-base font-bold transition-colors hover:bg-ppa-red-dark"
            >
              ▶ Buy Tickets · from ${next.ticketPriceFrom}
            </a>
            <Link
              href={`/events/${next.slug}`}
              className="flex h-13 items-center justify-center rounded-lg border border-white/25 px-7 text-base font-bold transition-colors hover:border-ppa-yellow hover:text-ppa-yellow"
            >
              Event Details
            </Link>
          </div>
        </div>
      </section>

      {/* ── Two-path routing fork ───────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <h2 className="text-center text-sm font-bold uppercase tracking-widest text-ppa-navy/50">
          What brings you here?
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Link
            href="/watch"
            className="group rounded-2xl bg-ppa-navy p-7 text-white transition-transform hover:-translate-y-1"
          >
            <p className="text-3xl">🏆</p>
            <h3 className="mt-3 text-2xl font-extrabold">I Want to Watch</h3>
            <p className="mt-1 text-white/65">
              Live streams, brackets, and the pros — everything for fans.
            </p>
            <span className="mt-4 inline-block font-bold text-ppa-yellow group-hover:underline">
              Go to Watch →
            </span>
          </Link>
          <Link
            href="/play"
            className="group rounded-2xl bg-ppa-red p-7 text-white transition-transform hover:-translate-y-1"
          >
            <p className="text-3xl">🎾</p>
            <h3 className="mt-3 text-2xl font-extrabold">I Want to Play</h3>
            <p className="mt-1 text-white/80">
              Register for an amateur event and start your tournament journey.
            </p>
            <span className="mt-4 inline-block font-bold text-ppa-yellow group-hover:underline">
              Go to Play →
            </span>
          </Link>
        </div>
      </section>

      {/* ── Next Stop stack ─────────────────────────────────── */}
      <section className="bg-zinc-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-extrabold tracking-tight text-ppa-navy">
            Next Stop on Tour
          </h2>
          <div className="mt-5 space-y-3">
            {upcoming.map((t) => (
              <div
                key={t.slug}
                className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ppa-red">
                    {t.tier}
                  </p>
                  <Link
                    href={`/events/${t.slug}`}
                    className="text-lg font-bold text-ppa-navy hover:underline"
                  >
                    {t.name}
                  </Link>
                  <p className="text-sm text-zinc-500">
                    {formatDateRange(t.startDate, t.endDate)} · {t.city},{" "}
                    {t.state}
                  </p>
                </div>
                <a
                  href={withUtm(t.ticketsUrl, {
                    campaign: t.slug,
                    content: "next-stop-buy-tickets",
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 shrink-0 items-center justify-center rounded-lg bg-ppa-red px-6 font-bold text-white transition-colors hover:bg-ppa-red-dark"
                >
                  Buy Tickets
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story of the Match carousel ─────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-extrabold tracking-tight text-ppa-navy">
          Story of the Match
        </h2>
        <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
          {STORYLINES.map((s) => (
            <div
              key={s.title}
              className="flex aspect-[9/12] w-52 shrink-0 flex-col justify-end rounded-xl bg-gradient-to-b from-ppa-navy-light to-ppa-navy p-4 text-white"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-ppa-red text-lg">
                ▶
              </span>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-ppa-yellow">
                {s.tag}
              </p>
              <p className="mt-1 text-sm font-bold leading-snug">{s.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sponsors ────────────────────────────────────────── */}
      <section className="border-y border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-7">
          {SPONSORS.map((s) => (
            <span
              key={s}
              className="text-sm font-extrabold tracking-widest text-zinc-400"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ── Email capture ───────────────────────────────────── */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="fan" />
        </div>
      </section>
    </>
  );
}
