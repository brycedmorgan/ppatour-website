import type { Metadata } from "next";
import { ComingSoon } from "@/components/global/ComingSoon";

export const metadata: Metadata = { title: "Watch" };

export default function WatchPage() {
  return (
    <ComingSoon
      title="The Fan Hub"
      blurb="Live streams, the Where-to-Watch matrix, storylines, and everything for PPA Tour fans — landing here in Phase 2."
    />
  );
}
