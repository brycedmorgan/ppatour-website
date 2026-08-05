"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { ExplainerVideo } from "@/lib/explainer-videos";

/**
 * Click-to-play grid for the official explainer series.
 *
 * ⚠ THE IFRAME IS CREATED ON CLICK, NEVER ON LOAD, and that is deliberate —
 * same contract as `ReplayGallery` and `AthleteVideos`, which is the house
 * pattern for YouTube on this site. Mounting four inline players would pull
 * YouTube's ~1MB player bundle on every visit to /about/how-it-works and
 * /rankings, and /rankings is the page the 8/1 audit fought from 3.96MB down to
 * 2.04MB. A thumbnail is one image request.
 *
 * `youtube-nocookie.com` for the reason the rest of the site uses it: nothing
 * is set until a visitor presses play, so these sit outside the cookie
 * banner's scope rather than needing to be gated behind consent.
 */

/**
 * Two tones because both surfaces are in play: /about/how-it-works puts this
 * band on navy, /rankings puts it on paper. The site already proves both reads
 * (ReplayGallery is the dark one, AthleteVideos the light one).
 */
const TONE = {
  light: {
    card: "border-ppa-line bg-white hover:border-ppa-blue/40",
    title: "text-ppa-navy",
    blurb: "text-ppa-navy/55",
  },
  dark: {
    card: "border-white/10 bg-ppa-navy hover:border-white/30",
    title: "text-white",
    blurb: "text-white/55",
  },
} as const;

export function ExplainerVideos({
  videos,
  tone = "light",
}: {
  videos: readonly ExplainerVideo[];
  tone?: keyof typeof TONE;
}) {
  const [active, setActive] = useState<ExplainerVideo | null>(null);

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

  // Never render an empty heading-less shell; the callers wrap this in a
  // section with a heading that would otherwise stand over nothing.
  if (!videos.length) return null;

  const t = TONE[tone];
  const wide = videos.length > 2;
  const cols = wide ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2";
  const sizes = wide
    ? "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
    : "(min-width: 640px) 50vw, 100vw";

  return (
    <div>
      <div className={`grid gap-4 ${cols}`}>
        {/* ⚠ `flex flex-col` on the card IS THE FIX FOR A REAL BUG — do not
            drop it back to a plain block.

            A <button> vertically CENTERS its own content, and these cards are
            grid items, so they stretch to the tallest card in the row. Any card
            with a shorter blurb therefore had its whole content block centred in
            a taller box, and the leftover height was split evenly above and
            below it — measured at 20px slack → 9.9px of bare card background
            sitting ABOVE the thumbnail. It only hit *some* cards (the 2-line
            blurbs, not the 3-line ones), which is what made it look random.

            flex-col overrides that centring: children lay out from the top
            (justify-content defaults to flex-start), so the thumbnail is flush
            to the card's top border and any slack falls to the bottom where it
            is just card background. */}
        {videos.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(v)}
            className={`group flex flex-col overflow-hidden rounded-md border text-left transition-colors ${t.card}`}
          >
            {/* shrink-0: as a flex item this must never be squeezed out of its
                16:9 ratio to make room for a long title. */}
            <div className="relative aspect-video shrink-0">
              {/* alt="" on purpose: the title is rendered as text inside this
                  same button, so alt text would only duplicate the button's
                  accessible name. */}
              <Image
                src={`https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`}
                alt=""
                fill
                sizes={sizes}
                className="object-cover"
              />
              <span className="absolute inset-0 bg-ppa-navy-deep/20 transition-colors group-hover:bg-ppa-navy-deep/40" />
              <span className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ppa-navy shadow-lg transition-transform group-hover:scale-110">
                <svg viewBox="0 0 24 24" className="ml-0.5 size-5" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
            <div className="p-3">
              <p className={`text-[13px] font-semibold leading-snug ${t.title}`}>
                {v.title}
              </p>
              <p className={`mt-1.5 text-[11px] leading-relaxed ${t.blurb}`}>
                {v.blurb}
              </p>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
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
