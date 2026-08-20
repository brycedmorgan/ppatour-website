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
 * The National Championships launch film (Wesley, 8/4), self-hosted. Replaced
 * the Worlds hype cut, which was a stand-in for judging the treatment.
 * 1920x1080, 29.4s, landscape.
 *
 * ⚠ NOT SHIPPABLE AS-IS: 30 MB at ~8.5 Mbps, and it carries an audio track we
 * never play. That is roughly 15x what a hero background should weigh, on the
 * page whose LCP two previous sessions were spent protecting — and 2.4x the
 * Worlds cut it replaced. Fine for a decision page; it needs a compressed cut
 * before it goes near the real homepage. Target: 8-15s, no audio track, ~2 MB.
 * There is no ffmpeg on this machine, so that cut has to come from someone who
 * can re-encode.
 *
 * ⚠ IT ARRIVED moov-LAST and was re-laid-out to faststart here. Without that a
 * browser must download all 30 MB before the first frame appears — a blank hero
 * on anything but a fast connection. The atom was relocated and all 1,764 stco
 * chunk offsets rewritten (scratchpad/faststart.mjs): a pure relocation, byte
 * count unchanged, no re-encode. Verified decoding afterwards, because a
 * mis-patched offset table yields a structurally valid file that will not play.
 *
 * ⚠ THIS IS THE ON/OFF SWITCH FOR THE VIDEO HERO (Wesley, 8/4: "have the video
 * background be an option — if no video, the fallback is the #3 option"). Set
 * it to `null` and every `variant="video"` hero quietly becomes the still with
 * its zoom-out and parallax. Nothing else needs to change, and no surface can
 * end up with an empty background.
 */
const HERO_VIDEO: string | null =
  "/ppa/home/nc-pickleball-national-championships-video.mp4";

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
  clockOffsetMs = 0,
  priority = true,
}: {
  variant?: HeroVariant;
  /** Preview only: render both backgrounds and let the reviewer switch. */
  toggle?: boolean;
  next: Tournament;
  ev: Ev;
  countdown: number;
  live?: boolean;
  /** Preview only: milliseconds added to the countdown's clock. See Countdown. */
  clockOffsetMs?: number;
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

  /**
   * Hero height, and it is NOT global (Wesley, 8/4: "I only want this change on
   * the hero-preview page for now").
   *
   * The live homepage renders `photo` and keeps 50svh — the height Bryce
   * trimmed it to on 7/28 to buy room for the audience callouts below. Only the
   * treatments under review go taller, because a video and a big aerial both
   * need more room than a texture-behind-the-text photo did.
   *
   * ⚠ Tied to the VARIANT, not to a preview flag, so the height travels with
   * whichever treatment gets adopted — flipping `heroVariant` on the homepage
   * can't leave the new hero stuck at the old cramped height. If 58 turns out
   * to be wrong for the callouts, change it here, not per page.
   *
   * ⚠ Both class strings are written out in full because Tailwind scans source
   * text — an interpolated `min-h-[${n}svh]` would produce no CSS at all.
   *
   * 58 and not more: event-page heroes are 62svh and the homepage should not
   * out-shout the event it points at.
   */
  const heightClass = variant === "photo" ? "min-h-[50svh]" : "min-h-[58svh]";

  return (
    <>
      {/* ── Hero (event lead) ───────────────────────────────── */}
      {/* Height comes from `heightClass` above — 50svh live, 58svh for the
          treatments under review. Safe for the parallax either way: the drift
          and the cover constraint are both percentages of this element, so they
          scale with it and the px-per-px scroll rate is unchanged. Measured, not
          assumed — travel 90 → 104.4px, cover margin 9.0 → 10.4px. */}
      {/* ⚠ `hero-parallax-root` declares the NAMED view timeline the background
          image consumes, and it has to sit on this element. The section is
          `overflow-hidden`, which makes it its own scroll container — a bare
          `animation-timeline: view()` on the image would resolve against the
          section, pin at 100% and render static. See globals.css. */}
      <section
        data-hero-bg={toggle ? "video" : undefined}
        className={`relative isolate flex ${heightClass} flex-col justify-end overflow-hidden bg-ppa-navy text-white${
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

        {/* ⚠ NOTHING FLOATS OVER THIS HERO IN EITHER STATE, AND BOTH REMOVALS
            WERE ASKED FOR. Bryce, 7/28, took the event crest and the "Featured
            Event" card off the homepage hero — the mark "doesn't make a whole
            lot of sense there" and the card is redundant, since the hero IS that
            event. Both survived as live-mode exceptions until Wesley, 8/19:
            "the logo image in the top right shouldn't show anymore… make all
            other content match the current home page hero." The LIVE NOW badge
            in the eyebrow is what marks the state now. */}

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-7 pt-16">
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.16em] motion-safe:animate-rise"
            style={{ animationDelay: "80ms" }}
          >
            {/* ⚠ ONE ROW, NOT TWO BRANCHES. The live and next-event heroes used
                to be separate markup and had drifted: live lost the city link and
                said its own thing in the last slot. Only the badge and that last
                slot differ now, so they cannot drift again. */}
            {live ? (
              <span className="flex items-center gap-1.5 bg-ppa-live px-2 py-0.5">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                Live Now
              </span>
            ) : (
              <span className="bg-ppa-blue px-2 py-0.5">Next Event</span>
            )}
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
              {live ? (
                /* ⚠ THE ONE PLACE THE LIVE HERO STILL DEPARTS FROM THE HOMEPAGE,
                   and it has to. The countdown clamps at zero, so a literal match
                   would print "0D : 0H : 0M : 0S" beside a LIVE NOW badge for the
                   whole tournament. */
                "Matches in progress"
              ) : (
                <Countdown
                  targetIso={next.startDate}
                  offsetMs={clockOffsetMs}
                  fallback={`${countdown} ${countdown === 1 ? "Day" : "Days"} Out`}
                />
              )}
            </span>
          </div>

          <h1
            className="mt-3 max-w-[18ch] font-display text-[clamp(1.9rem,5.4vw,3.25rem)] uppercase leading-[0.98] motion-safe:animate-rise"
            style={{ animationDelay: "160ms" }}
          >
            {/* The full event name — "Veolia Pickleball National Championships",
                never the short form (Jeff Watson, 8/3). The short form stays on
                the scores-band chip below. */}
            {next.name}
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
                points and find out what that means." Shown in both states — the
                live hero used to swap it for a "▶ Live on PickleballTV" line, but
                Watch Live is already the hero's first button. */}
            <Link
              href="/about/how-it-works"
              className="text-ppa-yellow underline-offset-4 transition-colors hover:underline"
            >
              {tierPoints(next).toLocaleString()} Ranking Points
            </Link>
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
                {/* ⚠ The event's OWN scores section, not /watch. That page is
                    the broadcast hub — where to watch, the TV guide — and answers
                    a different question than "what is the score". The event page
                    grows a #results section while it is being played; see the
                    live block in app/events/[year]/[slug]/page.tsx. */}
                <Link
                  href={`${eventHref(next)}#results`}
                  className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-ppa-navy active:scale-[0.98]"
                >
                  Scores & Brackets
                </Link>
                {/* ⚠ The EVENT, not the calendar. This pointed at /events — the
                    full schedule — so the one button on a live homepage offering
                    to go deeper on the tournament being played sent people to a
                    list of every other stop instead. */}
                <Link
                  href={eventHref(next)}
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
