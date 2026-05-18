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
      <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden">
        <Image
          src={t.image}
          alt={t.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ppa-ink via-ppa-ink/70 to-ppa-ink/20" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-14 pt-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-ppa-ink/60 px-3 py-1.5 backdrop-blur">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/90">
              {t.tier}
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-ppa-yellow">
              {countdown} {countdown === 1 ? "day" : "days"} out
            </span>
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.25rem,9vw,5.5rem)] font-bold uppercase leading-[0.92] tracking-tight">
            {t.shortName}
          </h1>
          <p className="mt-4 text-lg font-medium text-white/75">
            {formatDateRange(t.startDate, t.endDate)} · {t.venue} · {t.city},{" "}
            {t.state}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={withUtm(t.ticketsUrl, {
                campaign: t.slug,
                content: "event-page-buy-tickets",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 items-center justify-center bg-ppa-red px-8 font-display text-base font-bold uppercase tracking-wide transition-colors hover:bg-ppa-red-dark"
            >
              Buy Tickets · from ${t.ticketPriceFrom}
            </a>
            <a
              href={withUtm(t.registerUrl, {
                campaign: t.slug,
                content: "event-page-register",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 items-center justify-center border border-white/30 bg-white/5 px-8 font-display text-base font-bold uppercase tracking-wide backdrop-blur transition-colors hover:border-ppa-yellow hover:text-ppa-yellow"
            >
              Register to Play
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <p className="max-w-xl text-sm text-white/45">
          Full event experience — live brackets, division tabs, broadcast
          schedule, and the where-to-watch matrix — is the next Phase 2 build.
        </p>
        <Link
          href="/events"
          className="mt-4 inline-block font-display text-sm font-bold uppercase tracking-wide text-ppa-yellow hover:underline"
        >
          ← All events
        </Link>
      </div>
    </article>
  );
}
