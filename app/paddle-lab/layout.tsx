import type { Metadata } from "next";
import { CompareTray } from "@/components/paddle-lab/CompareTray";
import { LabNav } from "@/components/paddle-lab/LabNav";
import { nameBySlug } from "@/lib/paddle-lab";
import { paddleLabRobots } from "@/lib/paddle-lab-access";

export const metadata: Metadata = {
  title: {
    default: "Paddle Lab",
    template: "%s — Paddle Lab | PPA Tour",
  },
  /**
   * ⚠ Noindex on every lab surface while PADDLE_LAB_PUBLIC is false. proxy.ts
   * already answers 401 before this renders, so no crawler reads this tag —
   * it is here so the day the password comes off is not also the day a
   * forgotten meta tag lets the lab back into Google by accident.
   */
  robots: paddleLabRobots,
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
