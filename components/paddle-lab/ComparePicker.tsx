"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { readCompare, writeCompare } from "./compare-store";
import { compareHref, matchesQuery, MAX_COMPARE, type PaddleSummary } from "@/lib/paddle-lab-shared";

/**
 * Add a paddle to the comparison. The URL (`?p=a,b,c`) is the source of truth
 * on this page; this component turns a pick into a new URL and keeps the
 * localStorage tray in step so the rest of the lab agrees.
 *
 * With no `p` in the URL, it promotes whatever the tray holds — that is how
 * "Add to compare" on four paddle pages then "Compare" in the tray lands here
 * with the four already in the table.
 */
export function ComparePicker({
  items,
  selected,
  swapFor,
}: {
  items: PaddleSummary[];
  selected: string[];
  /** When set, the pick replaces this slug instead of appending. */
  swapFor?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (selected.length === 0) {
      const tray = readCompare();
      if (tray.length) router.replace(compareHref(tray));
    } else {
      writeCompare(selected);
    }
  }, [selected, router]);

  /* ⚠ TESTED PADDLES RANK FIRST, AND THAT IS NOT A PREFERENCE.
     The lab is the union of two catalogues: John Kew's 468 measured paddles and
     ~350 that are on sale at Pickleball Central and have never been on his rig.
     Alphabetically they interleave, so a search for "joola" used to return a
     mixture and it was possible to build a whole comparison out of paddles that
     have no measurements at all — every row reading "Unknown" or an em dash,
     with nothing on the page saying why. Tested first, and an untested row says
     so where the specs would be. */
  const results = useMemo(() => {
    const query = q.trim();
    if (!query) return [];
    const hits = items.filter((p) => !selected.includes(p.slug) && matchesQuery(p, query));
    return [...hits.filter((p) => p.tested), ...hits.filter((p) => !p.tested)].slice(0, 8);
  }, [items, q, selected]);

  const full = !swapFor && selected.length >= MAX_COMPARE;

  const pick = (slug: string) => {
    const next = swapFor
      ? selected.map((s) => (s === swapFor ? slug : s))
      : [...selected, slug].slice(0, MAX_COMPARE);
    setQ("");
    router.replace(compareHref(next));
  };

  if (full) return null;

  return (
    <div className="relative">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppa-navy/40" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={swapFor ? "Search to swap this paddle" : `Add a paddle (${selected.length}/${MAX_COMPARE})`}
          aria-label="Search paddles to compare"
          className="h-11 w-full border border-ppa-line bg-white pl-10 pr-3 text-sm text-ppa-navy placeholder:text-ppa-navy/40 focus:border-ppa-blue focus:outline-none"
        />
      </label>
      {results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 border border-ppa-line bg-white shadow-lg">
          {results.map((p) => (
            <li key={p.slug}>
              <button
                type="button"
                onClick={() => pick(p.slug)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-ppa-paper"
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold text-ppa-navy">{p.name}</span>
                  <span className="block text-[11px] text-ppa-navy/55">
                    {p.tested
                      ? [p.shape, p.thicknessMm ? `${p.thicknessMm} mm` : null].filter(Boolean).join(" · ")
                      : `In the shop, not tested yet${p.thicknessMm ? ` · ${p.thicknessMm} mm` : ""}`}
                  </span>
                </span>
                <Plus className="h-4 w-4 shrink-0 text-ppa-blue" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.trim() && results.length === 0 && (
        <p className="absolute left-0 right-0 top-full z-30 mt-1 border border-ppa-line bg-white px-3 py-2.5 text-xs text-ppa-navy/55">
          No paddle matches “{q.trim()}”.
        </p>
      )}
    </div>
  );
}
