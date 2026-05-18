import type { Metadata } from "next";
import Image from "next/image";
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

export async function generateMetadata({ params }: Params): Promise<Metadata> {
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
    <article>
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

      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <p className="max-w-xl text-sm text-ppa-navy/55">
          Full event experience — live brackets, division tabs, broadcast
          schedule, and the where-to-watch matrix — is the next Phase 2 build.
        </p>
        <Link
          href="/events"
          className="mt-4 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
        >
          ← All Events
        </Link>
      </div>
    </article>
  );
}
