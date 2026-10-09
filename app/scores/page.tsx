import type { Metadata } from "next";
import { Suspense } from "react";
import { ScoresHome } from "@/components/app/ScoresHome";
import { resolveScoresEvent } from "@/lib/app-scores";
import { fetchLiveTicker } from "@/lib/ticker-api";

export const metadata: Metadata = {
  title: "Scores",
  description: "Live PPA Tour scores and brackets.",
  // App-first screen; the event pages carry the same scores for search.
  robots: { index: false, follow: true },
};

/**
 * The app's home screen (manifest start_url, first tab). Scores and brackets
 * first — see components/app/ScoresHome. ISR: which stop is live changes by
 * the day, the scores themselves are polled client-side.
 */
export const revalidate = 60;

export default async function ScoresPage() {
  const [event, ticker] = await Promise.all([resolveScoresEvent(), fetchLiveTicker()]);
  return (
    // Suspense: useLiveTicker reads useSearchParams (?partner=).
    <Suspense fallback={null}>
      <ScoresHome event={event} initialTicker={event?.live ? ticker : undefined} />
    </Suspense>
  );
}
