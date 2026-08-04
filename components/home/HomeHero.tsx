import Image from "next/image";
import Link from "next/link";
import { HeroBackgroundToggle } from "@/components/home/HeroBackgroundToggle";
import { Countdown } from "@/components/motion/Countdown";
import { WatchLiveButton } from "@/components/live/WatchLiveButton";
import {
  eventHref,
  formatDateRange,
  tierPoints,
  type Tournament,
} from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

/**
 * The homepage hero, extracted so it has exactly one definition.
 *
 * Connor, 8/4 (via Wesley): the hero should be better — "not sure if we have
 * some movement (slow mo video), or use something like this [still]".
 *
 * /hero-preview renders the WHOLE homepage through this component with
 * `toggle` on, so a reviewer switches backgrounds in place and judges each one
 * against the real page beneath it. The copy, countdown, CTAs and live branch
 * are identical either way because they are literally the same code.
 *
 * ⚠ Adopting a winner is a one-word change — the `heroVariant` default in
 * HomeContent. Do not fork this component to do it.
 */

/**
 * ⚠ Trimmed twice on 8/4 at Wesley's call:
 *   - `grounds` (a packed grounds-court still) — dropped outright.
 *   - `zoomout` + `parallax` were separate; they are now the single
 *     `zoom-parallax`, which does both. See globals.css for why the two
 *     motions have to animate different CSS properties to coexist.
 */
export type HeroVariant = "photo" | "video" | "zoom-parallax";

/**
 * The Worlds Championship hype cut (Wesley, 8/4), pulled from
 * worlds.unitedpickleball.com and self-hosted. Real tour footage, so the video
 * option can finally be judged on its merits rather than on a game trailer.
 *
 * ⚠ NOT SHIPPABLE AS-IS: 12.5 MB, 21s, 1280x720, ~5 Mbps, and it still carries
 * an audio track we never play. That is ~6x what a hero background should
 * weigh, on the page whose LCP two previous sessions were spent protecting. It
 * is fine for a decision page; it needs a compressed cut before it goes near
 * the real homepage. Target: 8-15s, no audio track, ~2 MB.
 *
 * ⚠ IT SHIPPED moov-LAST and was re-laid-out to faststart here. Without that a
 * browser must download all 12.5 MB before the first frame appears, which for a
 * hero is a blank navy box on any slow connection. There is no ffmpeg on this
 * machine, so the atom was relocated and all 1,254 stco chunk offsets rewritten
 * directly (scratchpad/faststart.mjs) — a pure relocation, byte count
 * unchanged, no re-encode. Verified decoding in Chrome afterwards, because a
 * mis-patched offset table yields a structurally valid file that will not play.
 *
 * ⚠ THIS IS THE ON/OFF SWITCH FOR THE VIDEO HERO (Wesley, 8/4: "have the video
 * background be an option — if no video, the fallback is the #3 option"). Set
 * it to `null` and every `variant="video"` hero quietly becomes the still with
 * its zoom-out and parallax. Nothing else needs to change, and no surface can
 * end up with an empty background.
 */
const HERO_VIDEO: string | null = "/ppa/home/hero-worlds-hype.mp4";

/**
 * The still behind the zoom-out/parallax option, and the video's fallback layer.
 * The filename is historical — it predates the parallax; the file itself is
 * just "the hero still".
 *
 * ⚠ TO CHANGE THIS PHOTO, REPLACE THE FILE — don't edit this path. Drop a
 * landscape JPEG (1600px+ wide) at public/ppa/home/hero-zoomout.jpg,
 * overwriting what's there, and the option picks it up on the next build.
 *
 * ⚠ RESIZE BEFORE COMMITTING. The current shot arrived as a 5240x3924 /
 * 15.3 MB camera original — larger than the hype video — and was reduced to
 * 2560px / 1.0 MB. next/image would have served a sensible size either way,
 * but the source still has to be read and re-encoded on every cold optimise,
 * and a 15 MB binary in git is permanent.
 *
 * ⚠ Replacing the file does NOT invalidate .next/cache/images — that cache is
 * keyed on the URL, which doesn't change. Delete it (or bump the filename)
 * after a swap or you will keep seeing the old photo and think nothing
 * happened.
 */
const STILL_IMAGE = "/ppa/home/hero-zoomout.jpg";

type Ev = {
  name: string; city: string; state: string;
  venue: string; startDate: string; endDate: string;
};

export function HomeHero({
  variant = "photo",
  toggle = false,
  next,
  ev,
  countdown,
  live = false,
  liveEvent,
  priority = true,
}: {
  variant?: HeroVariant;
  /** Preview only: render both backgrounds and let the reviewer switch. */
  toggle?: boolean;
  next: Tournament;
  ev: Ev;
  countdown: number;
  live?: boolean;
  liveEvent?: { logo?: string } | undefined;
  priority?: boolean;
}) {
  /**
   * ⚠ THE STILL IS THE VIDEO'S FALLBACK LAYER, NOT A SEPARATE OPTION (Wesley,
   * 8/4). It renders UNDERNEATH the video, with its zoom-out and parallax live,
   * so every way the video can fail to appear lands on option 3 rather than on
   * flat navy: `HERO_VIDEO` set to null, prefers-reduced-motion (which hides
   * the video outright), a decode failure, and the buffering gap before enough
   * of a 12.5 MB file has arrived.
   *
   * That last case is why the video carries no `poster` attribute — a poster
   * would paint over the still while buffering, hiding the very fallback this
   * is built on. A <video> with no poster is transparent until it has a frame.
   */
  const showVideo = (variant === "video" || toggle) && HERO_VIDEO !== null;
  const showStill = variant === "video" || variant === "zoom-parallax" || toggle;

  return (
    <>
      {/* ── Hero (event lead) ───────────────────────────────── */}
      {/* Hero trimmed 58svh → 50svh (Bryce 7/28) to buy height for the taller
          audience callouts below. Video hero drops into this same slot. */}
      {/* ⚠ `hero-parallax-root` declares the NAMED view timeline the background
          image consumes, and it has to sit on this element. The section is
          `overflow-hidden`, which makes it its own scroll container — a bare
          `animation-timeline: view()` on the image would resolve against the
          section, pin at 100% and render static. See globals.css. */}
      <section
        data-hero-bg={toggle ? "video" : undefined}
        className={`relative isolate flex min-h-[50svh] flex-col justify-end overflow-hidden bg-ppa-navy text-white${
          showStill ? " hero-parallax-root" : ""
        }`}
      >
        {/* ⚠ BACKGROUND IS THE ONLY THING THE VARIANT CHANGES. Everything below —
            eyebrow, countdown, headline, meta row, CTAs, the live branch — is
            shared, so the preview compares treatments rather than separately
            built heroes. */}
        {showStill ? (
          <Image
            src={STILL_IMAGE}
            alt=""
            fill
            priority={priority}
            quality={65}
            sizes="100vw"
            // Lands at 1.5 and eases out to 1.24 over 16s, AND drifts +/-10% on
            // scroll. It settles at 1.24 rather than 1 because the leftover
            // scale is exactly what gives the drift room to move without
            // exposing an edge — see globals.css.
            className="hero-zoom-parallax object-cover object-[center_60%]"
          />
        ) : (
          <Image
            src={next.image}
            alt={next.name}
            fill
            priority={priority}
            quality={65}
            sizes="100vw"
            className="animate-kenburns will-change-transform object-cover object-[center_60%] motion-reduce:animate-none"
          />
        )}
        {showVideo && (
          <video
            className="hero-video-layer absolute inset-0 size-full object-cover object-[center_60%] motion-reduce:hidden"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        )}
        {/* ⚠ Gated on `showVideo`, not just `toggle`. With HERO_VIDEO set to
            null there is nothing to switch to, and a "Video" button that
            silently does nothing is worse than no control at all. Caught by
            actually building with the video off. */}
        {toggle && showVideo && <HeroBackgroundToggle />}
        {/* Left-weighted scrim so the venue reads on the right (Hannah, 7/28). */}
        <div className="absolute inset-0 scrim-hero-left" />
        <div className="absolute inset-0 scrim-side" />
        {/* Soften the header→hero seam: navy fades down into the hero image. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 bg-gradient-to-b from-ppa-navy to-transparent" />

        {/* Floating event crest removed (Bryce 7/28: the Nationals mark
            hovering over the hero "doesn't make a whole lot of sense there").
            The hero photo + headline already name the event. Kept on /live,
            where the crest identifies which tournament is on. */}

        {/* Live tournament crest — same hero slot/treatment as the homepage. */}
        {live && liveEvent?.logo && (
          <div
            className="pointer-events-none absolute right-4 top-16 z-[2] block motion-safe:animate-rise sm:right-8 sm:top-20 lg:right-24"
            style={{ animationDelay: "120ms" }}
          >
            <Image
              src={liveEvent.logo}
              alt=""
              width={562}
              height={702}
              className="h-24 w-auto rounded drop-shadow-[0_4px_22px_rgba(2,49,85,0.65)] sm:h-44 lg:h-64"
            />
          </div>
        )}

        {/* Floating "Featured Event" card removed on the homepage (Bryce 7/28:
            redundant — the hero itself is that event). Retained in live mode,
            where it carries the LIVE NOW label. */}
        {live && (
          <div className="pointer-events-none absolute bottom-6 right-4 z-[2] hidden flex-col items-end bg-ppa-navy-deep/70 px-3.5 py-2.5 backdrop-blur-sm md:flex lg:right-8">
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-ppa-sky">
              Live Now
            </span>
            <span className="mt-0.5 font-display text-sm uppercase leading-tight text-white">
              {ev.name}
            </span>
            <span className="mt-0.5 text-[10px] uppercase tracking-wide text-white/65">
              {formatDateRange(ev.startDate, ev.endDate, true)} · {ev.venue}
            </span>
          </div>
        )}

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-7 pt-16">
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.16em] motion-safe:animate-rise"
            style={{ animationDelay: "80ms" }}
          >
            {live ? (
              <>
                <span className="flex items-center gap-1.5 bg-ppa-live px-2 py-0.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" />
                  Live Now
                </span>
                <span className="text-white/70">
                  {ev.city}, {ev.state}
                </span>
                <span className="text-white/25">/</span>
                <span className="text-ppa-yellow">Matches in progress</span>
              </>
            ) : (
              <>
                <span className="bg-ppa-blue px-2 py-0.5">Next Event</span>
                {/* Dave Rogers 7/27: "I would like to click on Cary, NC and see
                    where that is" — goes to the event's Plan Your Trip guide. */}
                <Link
                  href={`${eventHref(next)}#travel`}
                  className="text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {next.city}, {next.state}
                </Link>
                <span className="text-white/25">/</span>
                <span className="text-ppa-yellow">
                  <Countdown
                    targetIso={next.startDate}
                    fallback={`${countdown} ${countdown === 1 ? "Day" : "Days"} Out`}
                  />
                </span>
              </>
            )}
          </div>

          <h1
            className="mt-3 max-w-[18ch] font-display text-[clamp(1.9rem,5.4vw,3.25rem)] uppercase leading-[0.98] motion-safe:animate-rise"
            style={{ animationDelay: "160ms" }}
          >
            {/* Hero headline shows the full event name (e.g. "Veolia Pickleball
                National Championships"); in live mode it's the live event's name.
                The short form stays on the scores-band chip below. */}
            {live ? ev.name : next.name}
          </h1>

          <div
            className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wide text-white/75 motion-safe:animate-rise"
            style={{ animationDelay: "240ms" }}
          >
            <span>{formatDateRange(ev.startDate, ev.endDate)}</span>
            <span className="text-white/25">|</span>
            <span>{ev.venue}</span>
            <span className="text-white/25">|</span>
            {/* Dave Rogers 7/27: "I would like to click on 2,000 rankings
                points and find out what that means." */}
            {live ? (
              <span className="text-ppa-yellow">▶ Live on PickleballTV</span>
            ) : (
              <Link
                href="/about/how-it-works"
                className="text-ppa-yellow underline-offset-4 transition-colors hover:underline"
              >
                {tierPoints(next).toLocaleString()} Ranking Points
              </Link>
            )}
          </div>

          <div
            className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap motion-safe:animate-rise"
            style={{ animationDelay: "320ms" }}
          >
            {live ? (
              <>
                <WatchLiveButton className="group flex h-11 items-center justify-center gap-1.5 bg-ppa-live px-6 text-xs font-bold uppercase tracking-[0.12em] transition hover:bg-ppa-live-deep active:scale-[0.98]">
                  ▶ Watch Live
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </WatchLiveButton>
                <Link
                  href="/watch"
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-ppa-navy active:scale-[0.98]"
                >
                  Scores & Brackets
                </Link>
                <Link
                  href="/events"
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-ppa-navy active:scale-[0.98]"
                >
                  Explore the Event
                </Link>
              </>
            ) : (
              <>
                {/* No Tixr listing yet -> the CTA becomes the event page, not a
                    ticket link. See lib/tixr-price-index.ts. */}
                <a
                  href={
                    next.ticketsOnSale
                      ? withUtm(next.ticketsUrl, {
                          campaign: next.eventCode ?? next.slug,
                          content: "home-hero-buy-tickets",
                        })
                      : eventHref(next)
                  }
                  target={next.ticketsOnSale ? "_blank" : undefined}
                  rel={next.ticketsOnSale ? "noopener noreferrer" : undefined}
                  className="group flex h-11 items-center justify-center gap-1.5 bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] transition hover:bg-ppa-blue-deep active:scale-[0.98]"
                >
                  {next.ticketsOnSale
                    ? `Buy Tickets — From $${next.ticketPriceFrom}`
                    : "Event Details"}
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </a>
                <a
                  href={withUtm(next.registerUrl, {
                    campaign: next.eventCode ?? next.slug,
                    content: "home-hero-register",
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-11 items-center justify-center gap-1.5 border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-ppa-navy active:scale-[0.98]"
                >
                  Register to Play
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    ↗
                  </span>
                </a>
                <Link
                  href={eventHref(next)}
                  className="group flex h-11 items-center justify-center gap-1.5 border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-ppa-navy active:scale-[0.98]"
                >
                  Explore the Event
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </Link>
                <Link
                  href="/watch"
                  className="hidden h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-ppa-navy active:scale-[0.98] sm:flex"
                >
                  ▶ How to Watch
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="relative h-1 bg-ppa-blue" />
      </section>
    </>
  );
}
