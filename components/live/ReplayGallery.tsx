"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { ReplayVideo } from "@/lib/youtube";

/**
 * Branded replay gallery — a thumbnail grid of a tournament's YouTube playlist
 * (data fetched server-side via lib/youtube.ts). Clicking a card opens a
 * lightbox that plays the video inline; a link opens the full playlist on
 * YouTube.
 */
function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function ReplayGallery({
  videos,
  playlistId,
}: {
  videos: ReplayVideo[];
  playlistId: string;
}) {
  const [active, setActive] = useState<ReplayVideo | null>(null);

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

  if (!videos.length) return null;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(v)}
            className="group overflow-hidden rounded-md border border-white/10 bg-ppa-navy text-left transition-colors hover:border-white/30"
          >
            <div className="relative aspect-video">
              <Image
                src={v.thumbnail}
                alt={v.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
              <span className="absolute inset-0 bg-ppa-navy-deep/20 transition-colors group-hover:bg-ppa-navy-deep/40" />
              <span className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ppa-navy shadow-lg transition-transform group-hover:scale-110">
                <svg viewBox="0 0 24 24" className="ml-0.5 size-5" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              {v.duration && (
                <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white">
                  {v.duration}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-white">
                {v.title}
              </p>
              {v.views != null && (
                <p className="mt-1 text-[11px] text-white/45">{formatViews(v.views)} views</p>
              )}
            </div>
          </button>
        ))}
      </div>

      <a
        href={`https://www.youtube.com/playlist?list=${playlistId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-1.5 border-b-2 border-ppa-yellow pb-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/85 hover:text-white"
      >
        Full Playlist on YouTube
        <span aria-hidden>↗</span>
      </a>

      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
        >
          <div
            className="w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-2">
              <p className="font-display text-sm uppercase leading-tight text-white sm:text-base">
                {active.title}
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
                src={`https://www.youtube-nocookie.com/embed/${active.id}?autoplay=1&rel=0`}
                title={active.title}
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
