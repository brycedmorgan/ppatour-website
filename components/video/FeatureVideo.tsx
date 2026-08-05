"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * ONE video, played at full width in place — for a brand film or a single
 * featured piece, where `ExplainerVideos` is the wrong shape.
 *
 * ⚠ WHY THIS EXISTS RATHER THAN `<ExplainerVideos videos={[one]} />`: that grid
 * is `sm:grid-cols-2` at two-or-fewer videos, so a single video renders as a
 * HALF-WIDTH thumbnail card next to empty space, and opens in a modal. Correct
 * for a series of shorts, wrong for the tour's brand film, which is the piece a
 * visitor is meant to sit and watch.
 *
 * ⚠ THE IFRAME IS CREATED ON CLICK, NEVER ON LOAD — the same contract as
 * `ExplainerVideos`, `ReplayGallery` and `AthleteVideos`, which is the house
 * pattern for YouTube on this site. An inline player would pull YouTube's ~1MB
 * bundle on every visit; more to the point here, this sits high on the page, so
 * an eager player would compete directly with the section above it for
 * bandwidth. Unplayed, this component costs one image request.
 *
 * `youtube-nocookie.com` for the reason the rest of the site uses it: nothing is
 * set until a visitor presses play, so it sits outside the cookie banner's
 * scope rather than needing to be gated behind consent.
 *
 * It swaps in place rather than opening a modal — at this size the player is
 * already as big as a lightbox would make it, and an overlay would only add a
 * dismiss step between the click and the film.
 */
export function FeatureVideo({
  id,
  title,
  /**
   * `maxresdefault` (1280×720) is NOT guaranteed to exist for every YouTube
   * video — check it before passing false, or leave it and get `hqdefault`,
   * which always exists.
   */
  maxres = true,
  /**
   * ⚠ PASS THE WIDTH THE PLAYER ACTUALLY RENDERS AT, not the viewport's. The
   * default assumes a full-width container; dropped into a column it will pull
   * a candidate wider than anything on screen. (The default is deliberately not
   * `100vw` — nothing on this site renders a player edge-to-edge.)
   */
  sizes = "(min-width: 1024px) 1024px, calc(100vw - 2rem)",
}: {
  /** YouTube video id. */
  id: string;
  /** Real YouTube title — the iframe title and the pre-play accessible name. */
  title: string;
  maxres?: boolean;
  sizes?: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    // ring, not border: a film's title card is usually near-black, so on a dark
    // section the frame would otherwise have no edge at all. Inset so it can't
    // move the 16:9 box by a pixel either side, and low enough contrast to be
    // invisible on a light section.
    <div className="relative aspect-video overflow-hidden rounded-md bg-black ring-1 ring-inset ring-white/10">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play: ${title}`}
          className="group absolute inset-0 h-full w-full"
        >
          {/* alt="" on purpose: the button already carries the title as its
              accessible name, so alt text would only duplicate it. */}
          <Image
            src={`https://i.ytimg.com/vi/${id}/${maxres ? "maxresdefault" : "hqdefault"}.jpg`}
            alt=""
            fill
            sizes={sizes}
            className="object-cover"
            priority={false}
          />
          <span className="absolute inset-0 bg-ppa-navy-deep/25 transition-colors group-hover:bg-ppa-navy-deep/40" />
          <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ppa-navy shadow-lg transition-transform group-hover:scale-110 sm:size-20">
            <svg viewBox="0 0 24 24" className="ml-1 size-7 sm:size-9" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
