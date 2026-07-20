import type { Metadata } from "next";
import { NationalsLive } from "@/components/events/NationalsLive";

/**
 * Live variant of the National Championships event page. Counts down to first
 * serve and transitions to the live experience automatically when the clock
 * hits 0 (all client-side — see NationalsLive). First serve is configurable via
 * ?at=<ISO> or ?in=<seconds>; defaults to a short lead so the transition is
 * always demoable. Kept out of search (noindex) so it doesn't compete with the
 * real event page.
 */
export const metadata: Metadata = {
  title: "National Championships — Live",
  description:
    "Live coverage of the Veolia Pickleball National Championships — counting down to first serve, then live scores, order of play, and how to watch.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <NationalsLive />;
}
