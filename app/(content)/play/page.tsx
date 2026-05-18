import type { Metadata } from "next";
import { ComingSoon } from "@/components/global/ComingSoon";

export const metadata: Metadata = { title: "Play" };

export default function PlayPage() {
  return (
    <ComingSoon
      title="The Amateur Hub"
      blurb="Register, compete, rise. Your three-step path into PPA Tour amateur events — landing here in Phase 2."
    />
  );
}
