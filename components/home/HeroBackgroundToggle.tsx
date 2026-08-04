"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Preview-only control that flips the hero between its two candidate
 * backgrounds (Wesley, 8/4: "give me a toggle in the hero to show the video and
 * the #3 option so people can see and review").
 *
 * ⚠ BOTH BACKGROUNDS ARE ALREADY IN THE DOM — this only changes which one is
 * visible, via `data-hero-bg` on the hero <section> (see globals.css). It does
 * NOT re-render the hero. That matters: the hero is a server component and the
 * still's parallax is bound to a named view timeline declared on the section,
 * so swapping the subtree would tear the timeline down and rebuild it on every
 * click. Toggling one attribute leaves both layers and the timeline untouched.
 *
 * ⚠ NOT FOR THE REAL HOMEPAGE. Visitors get one hero, chosen in code.
 */
export function HeroBackgroundToggle() {
  const ref = useRef<HTMLDivElement>(null);
  const [bg, setBg] = useState<"video" | "still">("video");

  useEffect(() => {
    const section = ref.current?.closest("section");
    if (!section) return;
    section.setAttribute("data-hero-bg", bg);

    // Replay the zoom on switching to the still, otherwise a reviewer who
    // toggles after the first 16 seconds sees a settled image and concludes it
    // does not move. The drift is scroll-linked and must NOT be touched —
    // calling play() on it would fight its timeline.
    if (bg !== "still") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const img = section.querySelector(".hero-zoom-parallax");
    img?.getAnimations().forEach((anim) => {
      if ((anim as CSSAnimation).animationName !== "ppa-hero-zoomout") return;
      anim.cancel();
      anim.play();
    });
  }, [bg]);

  const base =
    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition";

  return (
    <div
      ref={ref}
      className="absolute right-4 top-16 z-[3] flex flex-col items-end gap-1.5 sm:top-20 lg:right-8"
    >
      <span className="bg-ppa-navy-deep/80 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-ppa-sky backdrop-blur-sm">
        Preview · Hero background
      </span>
      <div
        role="group"
        aria-label="Hero background"
        className="flex overflow-hidden border border-white/30 bg-ppa-navy-deep/80 backdrop-blur-sm"
      >
        {(["video", "still"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setBg(opt)}
            aria-pressed={bg === opt}
            className={`${base} ${
              bg === opt
                ? "bg-ppa-blue text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {opt === "video" ? "Video" : "Still + Motion"}
          </button>
        ))}
      </div>
      <span className="max-w-[13rem] text-right text-[10px] leading-snug text-white/70">
        {bg === "video"
          ? "Worlds hype cut, muted and looping."
          : "Zooms out on load, drifts as you scroll."}
      </span>
    </div>
  );
}
