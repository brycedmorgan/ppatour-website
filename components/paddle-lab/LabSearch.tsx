"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { browseHref, matchesQuery } from "@/lib/paddle-lab-shared";

/** `sub` tells two same-named builds apart in the list, e.g. "16 mm · Elongated". */
export type SearchItem = { slug: string; name: string; brand: string; href: string; sub: string };
export type SearchBrand = { name: string; count: number };

type Suggestion = { key: string; kind: "brand" | "paddle" | "all"; label: string; sub: string; href: string };

const MAX_BRANDS = 3;
const MAX_PADDLES = 7;

/**
 * The hero search with predictive results (Bryce, 9/3). Typing shows brands
 * that match, then paddles that match, then "see all". Enter on a highlighted
 * row goes there; Enter with nothing highlighted runs the full search on the
 * browse page. Everything is in-memory: the whole index is ~40 KB of slugs and
 * names, which is cheaper than a round trip per keystroke.
 */
export function LabSearch({ items, brands }: { items: SearchItem[]; brands: SearchBrand[] }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);

  const suggestions = useMemo<Suggestion[]>(() => {
    const query = q.trim();
    if (query.length < 2) return [];
    const ql = query.toLowerCase();
    const brandHits = brands
      .filter((b) => b.name.toLowerCase().includes(ql))
      .sort((a, b) => Number(b.name.toLowerCase().startsWith(ql)) - Number(a.name.toLowerCase().startsWith(ql)) || b.count - a.count)
      .slice(0, MAX_BRANDS)
      .map<Suggestion>((b) => ({
        key: `b:${b.name}`,
        kind: "brand",
        label: b.name,
        sub: `${b.count} paddle${b.count === 1 ? "" : "s"} · brand`,
        href: browseHref({ brand: b.name }),
      }));
    const paddleHits = items
      .filter((p) => matchesQuery(p, query))
      .sort((a, b) => Number(b.name.toLowerCase().startsWith(ql)) - Number(a.name.toLowerCase().startsWith(ql)) || a.name.localeCompare(b.name))
      .slice(0, MAX_PADDLES)
      .map<Suggestion>((p) => ({ key: `p:${p.slug}`, kind: "paddle", label: p.name, sub: p.sub, href: p.href }));
    const all: Suggestion = {
      key: "all",
      kind: "all",
      label: `See all results for “${query}”`,
      sub: "",
      href: browseHref({ q: query }),
    };
    return [...brandHits, ...paddleHits, all];
  }, [q, items, brands]);

  // Close on a click anywhere else.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const submit = () => {
    if (active >= 0 && suggestions[active]) return go(suggestions[active].href);
    const query = q.trim();
    go(query ? browseHref({ q: query }) : browseHref());
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (suggestions.length ? (i + 1) % suggestions.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (suggestions.length ? (i <= 0 ? suggestions.length - 1 : i - 1) : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <div ref={wrap} className="relative max-w-2xl">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex"
      >
        <label className="relative flex-1">
          <span className="sr-only">Search paddles</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ppa-navy/40" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(-1);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder="Search by brand or paddle name"
            autoComplete="off"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            className="h-14 w-full bg-white pl-12 pr-11 text-base text-ppa-navy placeholder:text-ppa-navy/40 focus:outline-none"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setOpen(false);
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ppa-navy/40 hover:text-ppa-navy"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
        <button
          type="submit"
          className="h-14 bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
        >
          Search
        </button>
      </form>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-96 overflow-y-auto border border-ppa-line bg-white text-left shadow-2xl"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(s.href)}
              className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 ${
                i === active ? "bg-ppa-paper" : ""
              } ${s.kind === "all" ? "border-t border-ppa-line" : ""}`}
            >
              <span className="min-w-0">
                <span
                  className={`block truncate ${
                    s.kind === "all" ? "text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue" : "text-sm font-bold text-ppa-navy"
                  }`}
                >
                  {s.label}
                </span>
                {s.sub && <span className="block text-[11px] text-ppa-navy/50">{s.sub}</span>}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ppa-navy/35" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
