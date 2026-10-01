"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { photoSrc, type GalleryAlbum } from "@/lib/europe-gallery";

/**
 * Album tabs + photo grid + lightbox. Photos come from the Europe team's Drive
 * folder (lib/europe-gallery.ts); this file only displays them.
 */
export function EuropeGallery({ albums }: { albums: GalleryAlbum[] }) {
  const [albumIdx, setAlbumIdx] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const album = albums[albumIdx];
  const photos = album?.photos ?? [];
  const count = photos.length;

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % count));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + count) % count));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, count]);

  if (!album) return null;
  const current = open === null ? null : photos[open];

  return (
    <div>
      {albums.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {albums.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setAlbumIdx(i);
                setOpen(null);
              }}
              className={`border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                i === albumIdx
                  ? "border-ppa-navy bg-ppa-navy text-white"
                  : "border-ppa-line bg-white text-ppa-navy hover:border-ppa-navy/40"
              }`}
            >
              {a.title} · {a.photos.length}
            </button>
          ))}
        </div>
      )}
      <ul className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Open photo: ${p.title}`}
              className="group block aspect-[4/3] w-full overflow-hidden bg-ppa-navy/10"
            >
              <Image
                src={photoSrc(p.id, 1200)}
                alt={p.title}
                width={640}
                height={480}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {current && open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          className="fixed inset-0 z-50 flex flex-col bg-black p-4"
          onClick={() => setOpen(null)}
        >
          <div className="flex items-center justify-between text-[12px] text-white/70">
            <span>
              {album.title} · {open + 1} / {count}
              {current.credit ? ` · Photo ${current.credit}` : ""}
            </span>
            <button type="button" className="px-3 py-2 text-white" onClick={() => setOpen(null)} aria-label="Close">
              ✕
            </button>
          </div>
          <div
            className="flex min-h-0 flex-1 items-center justify-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Previous photo"
              className="px-3 py-6 text-2xl text-white/70 hover:text-white"
              onClick={() => setOpen((open - 1 + count) % count)}
            >
              ‹
            </button>
            <div className="relative h-full min-w-0 flex-1">
              <Image
                src={photoSrc(current.id, 2000)}
                alt={current.title}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <button
              type="button"
              aria-label="Next photo"
              className="px-3 py-6 text-2xl text-white/70 hover:text-white"
              onClick={() => setOpen((open + 1) % count)}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
