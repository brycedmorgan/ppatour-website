"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { searchSite, type SearchDoc, type SearchGroup } from "@/lib/search-index";

const GROUP_ORDER: SearchGroup[] = [
  "Events",
  "Athletes",
  "Programs",
  "News",
  "Pages",
];

export function SearchClient() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const results = useMemo(() => searchSite(query), [query]);

  const grouped = useMemo(() => {
    const byGroup = new Map<SearchGroup, SearchDoc[]>();
    for (const doc of results) {
      const list = byGroup.get(doc.group) ?? [];
      list.push(doc);
      byGroup.set(doc.group, list);
    }
    return GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({
      group: g,
      docs: byGroup.get(g)!,
    }));
  }, [results]);

  function onChange(value: string) {
    setQuery(value);
    const url = value.trim()
      ? `/search?q=${encodeURIComponent(value.trim())}`
      : "/search";
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16">
      <label htmlFor="site-search" className="sr-only">
        Search the PPA Tour
      </label>
      <input
        id="site-search"
        type="search"
        autoFocus
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Events, athletes, rankings, tickets…"
        className="w-full border border-ppa-line bg-white px-4 py-3 text-base text-ppa-navy outline-none placeholder:text-ppa-navy/35 focus:border-ppa-blue"
      />

      {query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-8 text-sm text-ppa-navy/55">
          No results for “{query.trim()}”. Try an event city, an athlete’s
          name, or a page like “rankings”.
        </p>
      )}

      {grouped.map(({ group, docs }) => (
        <section key={group} className="mt-8">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              {group}
            </h2>
          </div>
          <ul className="mt-3 divide-y divide-ppa-line border border-ppa-line bg-white">
            {docs.map((doc) => (
              <li key={`${doc.group}-${doc.href}-${doc.title}`}>
                <Link
                  href={doc.href}
                  target={doc.external ? "_blank" : undefined}
                  rel={doc.external ? "noopener noreferrer" : undefined}
                  className="group flex items-baseline justify-between gap-4 px-4 py-3 hover:bg-ppa-paper"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ppa-navy group-hover:text-ppa-blue">
                      {doc.title}
                      {doc.external && " ↗"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ppa-navy/55">
                      {doc.meta}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-ppa-blue opacity-0 transition-opacity group-hover:opacity-100">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
