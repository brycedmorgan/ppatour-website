"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AthleteVideo, VideoTournament } from "@/lib/athlete-videos";

/** "1.2M views" / "34K views" — compact, only when a count is known. */
function formatViews(n?: number): string | null {
  if (!n || n < 1) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K views`;
  return `${n} views`;
}

/** Lower-case, accents off, so "cancún" finds "Cancun". */
const fold = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Athlete highlight gallery: season + search filters and a tournament dropdown
 * with ‹ › arrows (the same controls as Tournament Results in PlayerCareer,
 * Wesley 11/12) + a grid of highlight clips
 * (matchup + thumbnail) that open in a lightbox at their broadcast timestamp.
 * The first tournament is server-rendered; switching fetches /api/athlete-videos.
 */
export function AthleteVideos({
  slug,
  tournaments,
  initialUuid,
  initialVideos,
}: {
  slug: string;
  tournaments: VideoTournament[];
  initialUuid: string;
  initialVideos: AthleteVideo[];
}) {
  const [picked, setPicked] = useState(initialUuid);
  const [year, setYear] = useState("all");
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<AthleteVideo[]>(initialVideos);

  const years = useMemo(
    () => [...new Set(tournaments.map((t) => t.year).filter(Boolean))].sort((a, b) => b.localeCompare(a)),
    [tournaments],
  );
  // The season and the search narrow the list the dropdown and the arrows walk.
  // Every word typed must appear in the tournament's name ("vegas open").
  const list = useMemo(() => {
    const words = fold(query).split(/\s+/).filter(Boolean);
    return tournaments.filter(
      (t) => (year === "all" || t.year === year) && words.every((w) => fold(t.title).includes(w)),
    );
  }, [tournaments, year, query]);
  // The pick survives a filter change when it still matches; else the newest match.
  const found = list.findIndex((t) => t.uuid === picked);
  const i = found < 0 ? 0 : found;
  const current = list[i];
  const uuid = current?.uuid ?? "";
  const groups = useMemo(() => {
    const out: { year: string; items: VideoTournament[] }[] = [];
    for (const t of list) {
      const g = out[out.length - 1];
      if (g?.year === t.year) g.items.push(t);
      else out.push({ year: t.year, items: [t] });
    }
    return out;
  }, [list]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<AthleteVideo | null>(null);

  useEffect(() => {
    if (!uuid) return;
    if (uuid === initialUuid) {
      setVideos(initialVideos);
      return;
    }
    let alive = true;
    setLoading(true);
    fetch(`/api/athlete-videos?slug=${encodeURIComponent(slug)}&tournament=${uuid}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { videos?: AthleteVideo[] } | null) => {
        if (alive) setVideos(d?.videos ?? []);
      })
      .catch(() => {
        if (alive) setVideos([]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [uuid, slug, initialUuid, initialVideos]);

  const close = useCallback(() => setActive(null), []);
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close]);

  const arrow =
    "flex size-10 shrink-0 items-center justify-center border border-ppa-line bg-white text-ppa-navy/80 transition-colors hover:bg-ppa-paper disabled:opacity-30 disabled:hover:bg-white";
  const field =
    "h-10 w-full min-w-0 border border-ppa-line bg-white px-3 text-[13px] font-semibold text-ppa-navy focus:border-ppa-navy/50 focus:outline-none";
  const q = query.trim();
  const scope = `${year !== "all" ? ` in ${year}` : ""}${q ? ` matching “${q}”` : ""}`;
  const option = (t: VideoTournament) => (
    <option key={t.uuid} value={t.uuid}>
      {t.title}
    </option>
  );

  return (
    <div>
      {tournaments.length > 1 && (
        <>
          {/* Filters: season + search. */}
          <div className="flex flex-col gap-2 sm:flex-row">
            {years.length > 1 && (
              <label className="sm:w-40">
                <span className="sr-only">Season</span>
                <select value={year} onChange={(e) => setYear(e.target.value)} className={field}>
                  <option value="all">All years</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search tournaments</span>
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ppa-navy/40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="m13 13 4 4" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tournaments"
                className={`${field} pl-9 font-normal placeholder:text-ppa-navy/40`}
              />
            </label>
          </div>

          {current && (
            <>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className={arrow}
                  aria-label="Newer tournament"
                  disabled={i === 0}
                  onClick={() => setPicked(list[i - 1].uuid)}
                >
                  ‹
                </button>
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Tournament</span>
                  <select value={uuid} onChange={(e) => setPicked(e.target.value)} className={field}>
                    {year === "all" && groups.length > 1
                      ? groups.map((g) => (
                          <optgroup key={g.year || "undated"} label={g.year || "Other"}>
                            {g.items.map(option)}
                          </optgroup>
                        ))
                      : list.map(option)}
                  </select>
                </label>
                <button
                  type="button"
                  className={arrow}
                  aria-label="Older tournament"
                  disabled={i === list.length - 1}
                  onClick={() => setPicked(list[i + 1].uuid)}
                >
                  ›
                </button>
              </div>
              <p className="mt-2 text-[11px] font-semibold text-ppa-navy/45">
                {i + 1} of {list.length} {list.length === 1 ? "tournament" : "tournaments"}
                {scope}
              </p>
            </>
          )}
        </>
      )}

      <div className="mt-6">
        {!current && tournaments.length > 0 ? (
          <p className="text-sm text-ppa-navy/60">
            No tournaments{scope}.{" "}
            <button
              type="button"
              className="font-semibold text-ppa-navy underline underline-offset-2"
              onClick={() => {
                setYear("all");
                setQuery("");
              }}
            >
              Clear filters
            </button>
          </p>
        ) : loading ? (
          <div className="flex h-[160px] items-center justify-center rounded-lg border border-ppa-line bg-ppa-paper">
            <span aria-hidden className="size-6 animate-spin rounded-full border-2 border-ppa-line border-t-ppa-blue" />
          </div>
        ) : videos.length === 0 ? (
          <p className="rounded-lg border border-ppa-line bg-ppa-paper px-6 py-10 text-center text-sm text-ppa-navy/55">
            No highlights for this tournament.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v, i) => (
              <button
                key={`${v.id}-${v.start}-${i}`}
                type="button"
                onClick={() => setActive(v)}
                className="group overflow-hidden rounded-md border border-ppa-line bg-white text-left transition-colors hover:border-ppa-blue/40"
              >
                <div className="relative aspect-video">
                  <Image
                    src={v.thumbnail}
                    alt={v.matchup}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                  <span className="absolute inset-0 bg-ppa-navy-deep/15 transition-colors group-hover:bg-ppa-navy-deep/35" />
                  <span className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ppa-navy shadow-lg transition-transform group-hover:scale-110">
                    <svg viewBox="0 0 24 24" className="ml-0.5 size-5" fill="currentColor" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-ppa-navy">
                    {v.matchup}
                  </p>
                  {(v.tournament || formatViews(v.views)) && (
                    <p className="mt-1 text-[11px] text-ppa-navy/45">
                      {[v.tournament, formatViews(v.views)].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={active.matchup}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 pb-2">
              <p className="font-display text-sm uppercase leading-tight text-white sm:text-base">
                {active.matchup}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="shrink-0 text-2xl leading-none text-white/70 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-md bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${active.id}?start=${active.start}&autoplay=1&rel=0`}
                title={active.matchup}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
