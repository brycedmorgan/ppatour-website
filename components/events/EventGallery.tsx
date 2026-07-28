"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Event photo gallery — a single horizontal rail that the visitor drags with
 * the mouse or swipes on touch (Bryce, 7/28: "one single row of images gliding
 * across the screen instead of taking up vertical space… the user can grab it
 * with the mouse and slide, or swipe on mobile").
 *
 * Any photo opens the full-screen lightbox with arrows, keyboard (←/→/Esc),
 * swipe, and a counter — so a future spectator sees exactly what to expect.
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

  // Pointer-drag scrolling for the rail. Native scroll already handles touch
  // and trackpads; this adds click-and-drag for mouse users. A drag that
  // travels more than a few pixels suppresses the click so dragging across a
  // photo doesn't open the lightbox.
  const rail = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || !rail.current) return;
    drag.current = { x: e.clientX, left: rail.current.scrollLeft, moved: false };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !rail.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    rail.current.scrollLeft = drag.current.left - dx;
  };
  const endDrag = () => {
    setDragging(false);
    // Clear on the next tick so the click handler can still read `moved`.
    const d = drag.current;
    if (d) setTimeout(() => (drag.current = null), 0);
  };
  const scrollBy = (dir: 1 | -1) => {
    const el = rail.current;
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

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
      <div className="relative mt-6">
        <div
          ref={rail}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          className={`flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            dragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => {
                if (drag.current?.moved) return; // it was a drag, not a click
                setOpenAt(i);
              }}
              aria-label={`Open photo ${i + 1} of ${images.length}`}
              className="group relative aspect-[4/3] w-[78vw] shrink-0 snap-start overflow-hidden bg-ppa-navy-deep sm:w-[44vw] lg:w-[30rem]"
            >
              <Image
                src={src}
                alt={`${eventName} — the scene at the venue (photo ${i + 1})`}
                fill
                draggable={false}
                sizes="(min-width: 1024px) 30rem, (min-width: 640px) 44vw, 78vw"
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

        {/* Desktop rail arrows — the rail is drag/swipe first, these are the
            discoverable affordance. */}
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll photos left"
          className="absolute left-2 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center bg-ppa-navy/70 text-lg text-white transition hover:bg-ppa-blue active:scale-95 lg:flex"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll photos right"
          className="absolute right-2 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center bg-ppa-navy/70 text-lg text-white transition hover:bg-ppa-blue active:scale-95 lg:flex"
        >
          →
        </button>
      </div>
      {/* Both mount points are dark ("The Scene" band on navy). */}
      <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/35">
        Drag or swipe to browse · tap any photo to enlarge
      </p>

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
