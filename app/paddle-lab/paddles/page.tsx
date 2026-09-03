import type { Metadata } from "next";
import { Suspense } from "react";
import { PaddleBrowser } from "@/components/paddle-lab/PaddleBrowser";
import { brandList, paddleCount, summaries } from "@/lib/paddle-lab";

export const metadata: Metadata = {
  title: "Browse All Paddles",
  description: `Filter ${paddleCount} pickleball paddles by brand, price, shape, play style, spin, core thickness and weight. Every one measured the same way.`,
};

/**
 * The browser reads its filters from the URL (useSearchParams), which needs a
 * Suspense boundary above it so the static shell can render before the
 * client-side params resolve.
 */
export default function BrowsePaddlesPage() {
  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Paddle Lab</p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">Browse All Paddles</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/60">
            Narrow it down, then add up to four to compare side by side. Power and pop are shown where
            John Kew has run the ball-speed test; spin and handling are measured on every paddle.
          </p>
        </div>
      </section>
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <Suspense fallback={<p className="text-sm text-ppa-navy/50">Loading paddles…</p>}>
            <PaddleBrowser items={summaries} brands={brandList.map((b) => b.name)} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
