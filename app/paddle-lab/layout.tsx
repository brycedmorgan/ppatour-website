import type { Metadata } from "next";
import { CompareTray } from "@/components/paddle-lab/CompareTray";
import { LabNav } from "@/components/paddle-lab/LabNav";
import { nameBySlug } from "@/lib/paddle-lab";

export const metadata: Metadata = {
  title: {
    default: "Paddle Lab",
    template: "%s — Paddle Lab | PPA Tour",
  },
};

/**
 * Every lab page shares the section strip and the compare tray. The tray only
 * knows slugs (localStorage), so it gets the slug → name map here — small, and
 * it means a paddle added on one page is named correctly on every other.
 */
export default function PaddleLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LabNav />
      {children}
      <CompareTray names={nameBySlug} />
    </>
  );
}
