import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchClient } from "./search-client";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <section className="min-h-[60svh] bg-ppa-paper">
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 bg-ppa-blue" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
            Site Search
          </p>
        </div>
        <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
          Find Anything
        </h1>
        <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
          Events, athletes, rankings, programs, and news — one box.
        </p>
      </div>
      <Suspense>
        <SearchClient />
      </Suspense>
    </section>
  );
}
