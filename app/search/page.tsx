import type { Metadata } from "next";
import { newsCount } from "@/lib/news";
import { searchSite } from "@/lib/site-search";
import { SearchClient } from "./search-client";

type Search = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Search): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  return {
    title: query ? `“${query}” — Search` : "Search",
    // Result pages are thin and unbounded in number, and the content they list
    // is already indexed at its own URL.
    robots: query ? { index: false, follow: true } : undefined,
  };
}

export default async function SearchPage({ searchParams }: Search) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  // Rendered on the server so a shared /search?q=… link arrives with results,
  // and so the page is useful before (or without) the client effect running.
  const initial = query ? await searchSite(query) : { query: "", groups: [], total: 0 };

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
          Every story, athlete, event, program, and page — matched on keywords,
          not just headlines. All {newsCount().toLocaleString()} articles are
          searched right down to the words inside them.
        </p>
      </div>
      <SearchClient initial={initial} />
    </section>
  );
}
