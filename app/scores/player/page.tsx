import type { Metadata } from "next";
import { Suspense } from "react";
import { PlayerScreen } from "@/components/app/PlayerScreen";
import { resolveScoresEvent } from "@/lib/app-scores";
import { getEvents } from "@/lib/events-api";
import { playerRuns, resolvePlayer } from "@/lib/player-event";
import { fetchLiveTicker } from "@/lib/ticker-api";

export const metadata: Metadata = {
  title: "Player",
  // App screen keyed by a query string; /athletes/<slug> is the indexed page.
  robots: { index: false, follow: true },
};

/**
 * The app's player screen — every name on Scores and in the bracket opens it
 * (components/app/PlayerScreen). Per request: it is keyed by `?name=`, and the
 * draws and ticker behind it are already cached upstream of this page
 * (lib/brackets-api 45s build, lib/ticker-api), so a render is mostly joins.
 */
export const dynamic = "force-dynamic";

export default async function PlayerPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; event?: string }>;
}) {
  const { name = "", event: eventParam } = await searchParams;
  if (!name.trim()) {
    return <p className="px-4 pt-10 text-center text-ppa-navy/60">No player picked.</p>;
  }
  const current = await resolveScoresEvent();
  // Only a tour event we know: an arbitrary ?event= would start a fresh
  // upstream draw build per string (lib/brackets-api caches by event id).
  const known =
    eventParam && eventParam !== current?.eventId
      ? await getEvents()
          .then(({ events }) => events.find((e) => e.tournamentUuid === eventParam))
          .catch(() => undefined)
      : undefined;
  const eventId = known ? eventParam! : current?.eventId || "";
  const isCurrent = Boolean(current && current.eventId === eventId);

  const [profile, runs, ticker, eventName] = await Promise.all([
    resolvePlayer(name),
    playerRuns(eventId, name),
    isCurrent && current?.live ? fetchLiveTicker() : Promise.resolve(undefined),
    Promise.resolve(isCurrent ? (current?.name ?? "") : (known?.name ?? "")),
  ]);

  return (
    // Suspense: useLiveTicker reads useSearchParams (?partner=).
    <Suspense fallback={null}>
      <PlayerScreen
        key={name}
        profile={profile}
        runs={runs}
        eventId={eventId}
        eventName={eventName}
        live={isCurrent && Boolean(current?.live)}
        initialTicker={ticker}
      />
    </Suspense>
  );
}
