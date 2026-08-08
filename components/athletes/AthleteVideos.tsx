"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { AthleteVideo, VideoTournament } from "@/lib/athlete-videos";

/** "1.2M views" / "34K views" — compact, only when a count is known. */
function formatViews(n?: number): string | null {
  if (!n || n < 1) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K views`;
  return `${n} views`;
}

/**
 * Athlete highlight gallery: a tournament dropdown + a grid of highlight clips
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
  const [uuid, setUuid] = useState(initialUuid);
  const [videos, setVideos] = useState<AthleteVideo[]>(initialVideos);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<AthleteVideo | null>(null);

  useEffect(() => {
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

  return (
    <div>
      {tournaments.length > 1 && (
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="video-tourney" className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">
            Tournament
          </label>
          <select
            id="video-tourney"
            value={uuid}
            onChange={(e) => setUuid(e.target.value)}
            className="rounded-md border border-ppa-line bg-white px-3 py-2 text-sm font-semibold text-ppa-navy focus:border-ppa-navy/50 focus:outline-none"
          >
            {tournaments.map((t) => (
              <option key={t.uuid} value={t.uuid}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
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
