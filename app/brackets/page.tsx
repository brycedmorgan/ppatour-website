import type { Metadata } from "next";
import Link from "next/link";
import { BracketPanel } from "@/components/live/BracketPanel";
import { ATLANTA_EVENT_ID } from "@/lib/bracket-sample";
import { getTournamentDetails } from "@/lib/tournament-api";

/**
 * Full-page tournament brackets. Renders the same BracketPanel the live-scores
 * section uses, but edge-to-edge and viewport-tall so big draws have room to
 * breathe. Reached via the "Full-Page Bracket" link; deep-links a division via
 * ?division=. Not indexed (mirrors the event data pages).
 */
export const metadata: Metadata = {
  title: "Brackets",
  robots: { index: false, follow: false },
};

export default async function BracketsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; division?: string; back?: string }>;
}) {
  const sp = await searchParams;
  const event = sp.event || ATLANTA_EVENT_ID;
  const details = await getTournamentDetails(event).catch(() => null);
  const title = details?.name ? `${details.name} — Brackets` : "Tournament Brackets";
  const backHref = sp.back || "/events/veolia-pickleball-national-championships-live";

  return (
    <section className="min-h-screen bg-ppa-navy text-white">
      <div className="mx-auto w-full max-w-[120rem] px-4 py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
              Brackets
            </p>
            <h1 className="mt-1 font-display text-2xl uppercase leading-tight sm:text-3xl">
              {title}
            </h1>
          </div>
          <Link
            href={backHref}
            className="group text-xs font-bold uppercase tracking-[0.12em] text-white/60 hover:text-white"
          >
            <span aria-hidden className="inline-block transition-transform duration-300 group-hover:-translate-x-0.5">←</span>{" "}
            Back to Event
          </Link>
        </div>

        <div className="mt-6">
          <BracketPanel eventId={event} fullPage initialDivision={sp.division} />
        </div>
      </div>
    </section>
  );
}
