import type { Metadata } from "next";
import { ComingSoon } from "@/components/global/ComingSoon";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <ComingSoon
      title="About the PPA Tour"
      blurb="The story of professional pickleball's premier tour — refreshed page landing in Phase 2."
    />
  );
}
