"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { photoSrc, type GalleryAlbum, type GalleryPhoto } from "@/lib/europe-gallery";

/**
 * One section per event album (folder name as the header), photo grid, and a
 * lightbox. `perAlbum` trims each album for the /europe home (Payton, 10/2:
 * "just 2 images per folder"); /europe/gallery passes nothing and shows all.
 * Photos come from the Europe team's Drive folder (lib/europe-gallery.ts).
 */
export function EuropeGallery({
  albums,
  perAlbum,
}: {
  albums: GalleryAlbum[];
  perAlbum?: number;
}) {
  const [open, setOpen] = useState<{ album: GalleryAlbum; i: number } | null>(null);
  const count = open?.album.photos.length ?? 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o ? { ...o, i: (o.i + 1) % count } : o));
      if (e.key === "ArrowLeft") setOpen((o) => (o ? { ...o, i: (o.i - 1 + count) % count } : o));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, count]);

  const current: GalleryPhoto | null = open ? open.album.photos[open.i] : null;

  return (
    <div className={`grid gap-10 ${perAlbum ? "lg:grid-cols-2" : ""}`}>
      {albums.map((album) => {
        const shown = perAlbum ? album.photos.slice(0, perAlbum) : album.photos;
        return (
          <section key={album.id}>
            <h3 className="font-display text-lg uppercase text-ppa-navy">
              {album.title}
              <span className="ml-2 text-xs font-normal normal-case text-ppa-navy/50">
                {album.photos.length} photos
              </span>
            </h3>
            <ul
              className={`mt-3 grid gap-1.5 ${perAlbum ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}
            >
              {shown.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setOpen({ album, i })}
                    aria-label={`Open photo: ${p.title}`}
                    className="group block aspect-[4/3] w-full overflow-hidden bg-ppa-navy/10"
                  >
                    <Image
                      src={photoSrc(p.id, 1200)}
                      alt={p.title}
                      width={640}
                      height={480}
                      sizes={perAlbum ? "(min-width: 1024px) 50vw, 50vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {open && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          className="fixed inset-0 z-50 flex flex-col bg-black p-4"
          onClick={() => setOpen(null)}
        >
          <div className="flex items-center justify-between text-[12px] text-white/70">
            <span>
              {open.album.title} · {open.i + 1} / {count}
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
              onClick={() => setOpen({ ...open, i: (open.i - 1 + count) % count })}
            >
              ‹
            </button>
            <div className="relative h-full min-w-0 flex-1">
              <Image src={photoSrc(current.id, 2000)} alt={current.title} fill sizes="100vw" className="object-contain" />
            </div>
            <button
              type="button"
              aria-label="Next photo"
              className="px-3 py-6 text-2xl text-white/70 hover:text-white"
              onClick={() => setOpen({ ...open, i: (open.i + 1) % count })}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
