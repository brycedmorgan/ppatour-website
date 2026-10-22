import type { Metadata } from "next";
import { AppRankings } from "@/components/app/AppRankings";
import { getRankings, rankingsAsOf, toBoardDivisions } from "@/lib/rankings-api";

export const metadata: Metadata = {
  title: "Rankings",
  // The app's Rankings tab; /rankings is the indexed page for the same board.
  robots: { index: false, follow: true },
};

/**
 * The app's Rankings tab — see components/app/AppRankings. Top 100 per board:
 * every count up to the board page size slices the same cached upstream page,
 * so this costs no extra request over /rankings.
 *
 * `force-static` for the same reason as /rankings (its page has the long
 * note): a 429 retry with no-store mid-build would otherwise make it dynamic.
 */
export const revalidate = 300;
export const dynamic = "force-static";

export default async function AppRankingsPage() {
  const ranking = await getRankings(100);
  const asOf = new Date(`${rankingsAsOf()}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return <AppRankings divisions={toBoardDivisions(ranking.divisions)} asOf={asOf} />;
}
