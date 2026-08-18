import type { Metadata } from "next";
import { FollowingScreen } from "@/components/app/FollowingScreen";

/**
 * The app's "You" tab. A real route rather than a sheet, so the tab bar, the
 * back button and a notification tap all land in the same place.
 *
 * `noindex`: the page is empty for everyone but its owner — the follow list
 * lives in that device's localStorage — so there is nothing here for Google to
 * rank, and an indexed empty page would just compete with /athletes.
 */
export const metadata: Metadata = {
  title: "Your players",
  robots: { index: false, follow: false },
};

export default function FollowingPage() {
  return (
    <div className="min-h-screen bg-ppa-navy">
      <FollowingScreen />
    </div>
  );
}
