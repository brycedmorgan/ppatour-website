"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Flip-through event photo gallery. Grid of real event photos; any photo
 * opens a full-screen lightbox with arrows, keyboard (←/→/Esc), swipe, and
 * a counter — so future spectators can see exactly what to expect.
 */
export function EventGallery({
  images,
  eventName,
}: {
  images: string[];
  eventName: string;
}) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  const step = useCallback(
    (dir: 1 | -1) =>
      setOpenAt((i) =>
        i === null ? i : (i + dir + images.length) % images.length,
      ),
    [images.length],
  );

  useEffect(() => {
    if (openAt === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenAt(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openAt, step]);

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpenAt(i)}
            aria-label={`Open photo ${i + 1} of ${images.length}`}
            data-reveal
            style={{ "--reveal-delay": `${(i % 3) * 80}ms` } as React.CSSProperties}
            className={`group relative overflow-hidden bg-ppa-navy-deep ${
              i === 0
                ? "col-span-2 aspect-[16/8] sm:col-span-3 sm:aspect-[16/6.5]"
                : "aspect-[4/3]"
            }`}
          >
            <Image
              src={src}
              alt={`${eventName} — the scene at the venue (photo ${i + 1})`}
              fill
              sizes={i === 0 ? "100vw" : "(min-width: 640px) 33vw, 50vw"}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-ppa-navy/0 transition-colors duration-300 group-hover:bg-ppa-navy/30">
              <span className="flex size-10 items-center justify-center bg-white/0 text-lg text-white opacity-0 transition-all duration-300 group-hover:bg-ppa-blue group-hover:opacity-100">
                ⤢
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {openAt !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${eventName} photo viewer`}
          className="fixed inset-0 z-50 flex flex-col bg-ppa-navy-deep/97 backdrop-blur-sm motion-safe:animate-fade"
          onClick={() => setOpenAt(null)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
              {eventName} · {openAt + 1} / {images.length}
            </p>
            <button
              type="button"
              onClick={() => setOpenAt(null)}
              aria-label="Close photo viewer"
              className="flex size-9 items-center justify-center text-xl text-white/70 transition-colors hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
            <Image
              key={images[openAt]}
              src={images[openAt]}
              alt={`${eventName} — photo ${openAt + 1} of ${images.length}`}
              fill
              sizes="100vw"
              className="object-contain motion-safe:animate-fade"
              priority
            />

            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center bg-ppa-navy/70 text-xl text-white transition hover:bg-ppa-blue active:scale-95"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center bg-ppa-navy/70 text-xl text-white transition hover:bg-ppa-blue active:scale-95"
            >
              →
            </button>
          </div>

          <div
            className="flex justify-center gap-1.5 px-4 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setOpenAt(i)}
                aria-label={`Go to photo ${i + 1}`}
                className={`h-1 w-6 transition-colors ${
                  i === openAt ? "bg-ppa-yellow" : "bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
