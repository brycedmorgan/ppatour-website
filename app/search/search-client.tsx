"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SiteSearchResult } from "@/lib/site-search";

/**
 * Search UI. Queries `/api/search` instead of a bundled index — that is what
 * lets results come from article bodies, athlete bios and program copy without
 * shipping any of it to the browser. The previous version imported
 * `lib/search-index.ts` directly, which serialized the whole index into this
 * chunk and capped matching at titles and short meta strings.
 *
 * `initial` is the server-rendered result for a `?q=` URL, so a shared or
 * bookmarked search paints with results instead of an empty box.
 */
export function SearchClient({ initial }: { initial: SiteSearchResult }) {
  const [query, setQuery] = useState(initial.query);
  const [result, setResult] = useState<SiteSearchResult>(initial);
  const [pending, setPending] = useState(false);
  // Guards against a slow early response overwriting a newer one.
  const latest = useRef(0);

  useEffect(() => {
    const q = query.trim();
    // No state is written synchronously here — a query under two characters is
    // handled by deriving `visible` below, which keeps this effect free of the
    // setState-in-effect cascade.
    if (q.length < 2 || q === result.query) return;

    const ticket = ++latest.current;
    const controller = new AbortController();
    // Debounced so a typed word is one request, not eight.
    const timer = setTimeout(async () => {
      setPending(true);
      try {
        const res = await fetch(`/api/search/?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as SiteSearchResult;
        if (ticket === latest.current) setResult(data);
      } catch {
        /* aborted or offline — keep whatever is on screen */
      } finally {
        if (ticket === latest.current) setPending(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `result.query` is read but deliberately not tracked: including it would
    // re-run this effect on every response and refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  /** Keep the URL shareable without pushing a history entry per keystroke. */
  useEffect(() => {
    const q = query.trim();
    window.history.replaceState(null, "", q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }, [query]);

  // Derived rather than stored: a too-short query shows nothing without needing
  // a state write, and stale results never flash for a cleared box.
  const trimmed = query.trim();
  const visible: SiteSearchResult =
    trimmed.length < 2 ? { query: trimmed, groups: [], total: 0 } : result;
  const showEmpty = trimmed.length >= 2 && !pending && visible.groups.length === 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16">
      <label htmlFor="site-search" className="sr-only">
        Search the PPA Tour
      </label>
      <div className="relative">
        <input
          id="site-search"
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Players, events, keywords, tickets…"
          className="w-full border border-ppa-line bg-white px-4 py-3 pr-28 text-base text-ppa-navy outline-none placeholder:text-ppa-navy/35 focus:border-ppa-blue"
        />
        <span
          aria-live="polite"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/40"
        >
          {pending
            ? "Searching…"
            : visible.total > 0
              ? `${visible.total.toLocaleString()} ${visible.total === 1 ? "result" : "results"}`
              : ""}
        </span>
      </div>

      {trimmed.length === 1 && (
        <p className="mt-8 text-sm text-ppa-navy/55">Keep typing — two characters minimum.</p>
      )}

      {showEmpty && (
        <p className="mt-8 text-sm text-ppa-navy/55">
          No results for “{trimmed}”. Try a player, an event city, a keyword
          from a story, or a page like “rankings”.
        </p>
      )}

      {visible.groups.map((group) => (
        <section key={group.group} className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-ppa-blue" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                {group.group}
              </h2>
            </div>
            {group.total > group.hits.length && (
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/35">
                Top {group.hits.length} of {group.total.toLocaleString()}
              </span>
            )}
          </div>
          <ul className="mt-3 divide-y divide-ppa-line border border-ppa-line bg-white">
            {group.hits.map((doc) => (
              <li key={`${doc.group}-${doc.href}-${doc.title}`}>
                <Link
                  href={doc.href}
                  target={doc.external ? "_blank" : undefined}
                  rel={doc.external ? "noopener noreferrer" : undefined}
                  className="group flex items-start justify-between gap-4 px-4 py-3 hover:bg-ppa-paper"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ppa-navy group-hover:text-ppa-blue">
                      {doc.title}
                      {doc.external && " ↗"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ppa-navy/55">
                      {doc.meta}
                    </span>
                    {doc.snippet && (
                      <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-ppa-navy/45">
                        {doc.snippet}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 pt-1 text-xs font-bold text-ppa-blue opacity-0 transition-opacity group-hover:opacity-100">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {group.group === "News" && group.total > group.hits.length && (
            <Link
              href={`/news?q=${encodeURIComponent(trimmed)}`}
              className="mt-2 inline-block text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:underline"
            >
              All {group.total.toLocaleString()} matching stories →
            </Link>
          )}
        </section>
      ))}
    </div>
  );
}
