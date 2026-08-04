"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

export type CarouselItem = {
  image: string;
  alt?: string;
  title?: string;
  caption?: string;
};

/**
 * Crossfade carousel used for the Superior-room set on /vacations.
 *
 * All slides stay mounted and are faded with opacity rather than swapped, so
 * next/image can prefetch them and an advance never shows a blank frame on a
 * slow connection. Arrows and dots are hidden for a single slide.
 */
export function PhotoCarousel({
  items,
  aspect = "aspect-[4/3]",
  className = "",
}: {
  items: CarouselItem[];
  aspect?: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const count = items.length;

  // Clamp at render rather than correcting in an effect: if `items` ever
  // shrinks under a parked index, an effect would paint one blank frame first
  // and cost a cascading render to fix it.
  const active = count > 0 ? Math.min(index, count - 1) : 0;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );

  // Arrow keys work when the carousel itself has focus — not globally, which
  // would hijack the arrow keys for someone reading the page around it.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(active - 1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(active + 1);
    }
  };

  if (count === 0) return null;

  return (
    <div
      className={`group relative overflow-hidden bg-ppa-navy ${aspect} ${className}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="group"
      aria-roledescription="carousel"
      aria-label="Photo carousel"
    >
      {items.map((item, i) => (
        <div
          key={item.image}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === active ? 1 : 0 }}
          aria-hidden={i !== active}
        >
          <Image
            src={item.image}
            alt={item.alt ?? item.title ?? ""}
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-cover"
          />
          {(item.title || item.caption) && (
            <>
              <div className="absolute inset-x-0 bottom-0 h-1/2 scrim-card" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                {item.title && (
                  <p className="font-display text-lg uppercase leading-tight text-white">
                    {item.title}
                  </p>
                )}
                {item.caption && (
                  <p className="mt-1 text-xs leading-relaxed text-white/75">
                    {item.caption}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(active - 1)}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 focus-visible:opacity-100 group-hover:opacity-100"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(active + 1)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 focus-visible:opacity-100 group-hover:opacity-100"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.image}
                type="button"
                onClick={() => go(i)}
                aria-label={`Photo ${i + 1} of ${count}`}
                aria-current={i === active}
                className={`h-1.5 transition-all ${
                  i === active
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
