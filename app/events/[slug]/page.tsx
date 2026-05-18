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
      <section className="relative isolate flex min-h-[82svh] flex-col justify-end overflow-hidden bg-ppa-ink text-white">
        <Image
          src={t.image}
          alt={t.name}
          fill
          priority
          sizes="100vw"
          className="will-change-transform object-cover object-center"
        />
        <div className="absolute inset-0 scrim-hero" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-32">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-[0.18em]">
            <span className="bg-ppa-red px-2.5 py-1">{t.tier}</span>
            <span className="text-ppa-yellow">
              {countdown} {countdown === 1 ? "Day" : "Days"} Out
            </span>
          </div>
          <h1 className="mt-6 max-w-[14ch] font-display text-[clamp(2.75rem,10vw,7rem)] uppercase leading-[0.86]">
            {t.shortName}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm font-semibold uppercase tracking-wide text-white/75">
            <span>{formatDateRange(t.startDate, t.endDate)}</span>
            <span className="text-white/25">|</span>
            <span>{t.venue}</span>
            <span className="text-white/25">|</span>
            <span className="text-ppa-yellow">
              {t.points.toLocaleString()} Ranking Points
            </span>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={withUtm(t.ticketsUrl, {
                campaign: t.slug,
                content: "event-page-buy-tickets",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 items-center justify-center bg-ppa-red px-9 text-sm font-bold uppercase tracking-[0.14em] transition-colors hover:bg-ppa-red-dark"
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
              className="flex h-14 items-center justify-center border border-white/25 px-9 text-sm font-bold uppercase tracking-[0.14em] transition-colors hover:border-white hover:bg-white hover:text-ppa-ink"
            >
              Register to Play
            </a>
          </div>
        </div>
        <div className="relative h-1 bg-ppa-red" />
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        <p className="max-w-xl text-sm text-ppa-ink/55">
          Full event experience — live brackets, division tabs, broadcast
          schedule, and the where-to-watch matrix — is the next Phase 2 build.
        </p>
        <Link
          href="/events"
          className="mt-5 inline-flex items-center gap-2 border-b-2 border-ppa-red pb-1 text-sm font-bold uppercase tracking-[0.14em] text-ppa-ink hover:text-ppa-red"
        >
          ← All Events
        </Link>
      </div>
    </article>
  );
}
