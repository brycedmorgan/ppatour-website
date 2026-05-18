import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  formatDateRange,
  daysUntil,
  tournaments,
} from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return tournaments.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { slug } = await params;
  const t = tournaments.find((x) => x.slug === slug);
  return { title: t ? t.shortName : "Event" };
}

/**
 * Tournament page — minimal UPCOMING-state stub. The full state machine
 * (UPCOMING / LIVE / RECAP, sticky division tabs, brackets) is the headline
 * Phase 2 deliverable — see CLAUDE_CODE_PASSOFF_v2.md §7.
 */
export default async function EventPage({ params }: Params) {
  const { slug } = await params;
  const t = tournaments.find((x) => x.slug === slug);
  if (!t) notFound();

  const countdown = daysUntil(t.startDate);

  return (
    <article className="bg-ppa-navy text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-ppa-red px-3 py-1 text-xs font-bold uppercase tracking-widest">
          Upcoming
          <span className="text-ppa-yellow">
            {countdown} {countdown === 1 ? "day" : "days"} to go
          </span>
        </div>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t.name}
        </h1>
        <p className="mt-3 text-lg text-white/70">
          {formatDateRange(t.startDate, t.endDate)} · {t.venue} · {t.city},{" "}
          {t.state}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a
            href={withUtm(t.ticketsUrl, {
              campaign: t.slug,
              content: "event-page-buy-tickets",
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-13 items-center justify-center rounded-lg bg-ppa-red px-7 font-bold transition-colors hover:bg-ppa-red-dark"
          >
            ▶ Buy Tickets · from ${t.ticketPriceFrom}
          </a>
          <a
            href={withUtm(t.registerUrl, {
              campaign: t.slug,
              content: "event-page-register",
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-13 items-center justify-center rounded-lg border border-white/25 px-7 font-bold transition-colors hover:border-ppa-yellow hover:text-ppa-yellow"
          >
            Register to Play
          </a>
        </div>
        <p className="mt-10 max-w-xl text-sm text-white/45">
          Full event experience — live brackets, division tabs, broadcast
          schedule, and the where-to-watch matrix — is the next Phase 2 build.
        </p>
        <Link
          href="/events"
          className="mt-4 inline-block font-bold text-ppa-yellow hover:underline"
        >
          ← All events
        </Link>
      </div>
    </article>
  );
}
