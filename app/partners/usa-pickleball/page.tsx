import type { Metadata } from "next";
import { UsapDeck } from "@/components/partners/UsapDeck";

/**
 * Private partnership presentation for the USA Pickleball meeting (Aug 2026).
 *
 * ⚠ NOT PUBLIC. `noindex, nofollow` here, and the path is added to
 * `app/robots.ts`'s Disallow list and kept out of `app/sitemap.ts`. It is a
 * link-shared deck (Bryce → USAP / Connor / Taylor), not a page anyone should
 * reach from the site. This repo is public on GitHub, so the deck deliberately
 * carries only the outward partnership vision — no internal strategy, economics,
 * or org changes live in this source.
 */
export const metadata: Metadata = {
  title: "One Aligned Ecosystem",
  description:
    "USA Pickleball × Pickleball Inc — a partnership conversation about the future of the sport.",
  robots: { index: false, follow: false },
  alternates: { canonical: undefined },
};

export default function UsapPartnershipPage() {
  return <UsapDeck />;
}
