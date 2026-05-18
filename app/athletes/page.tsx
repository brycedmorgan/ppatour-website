import type { Metadata } from "next";
import { ComingSoon } from "@/components/global/ComingSoon";

export const metadata: Metadata = { title: "Athletes" };

export default function AthletesPage() {
  return (
    <ComingSoon
      title="The Athletes"
      blurb="Profiles, head-to-heads, rankings, and match history for every pro on tour — landing here in Phase 2."
    />
  );
}
