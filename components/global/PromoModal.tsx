"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ResolvedPromo } from "@/lib/site-promo";

/**
 * The one-per-visitor promo modal. Content and placement live in
 * `lib/site-promo.ts`; this file is only the behaviour.
 *
 * ⚠ IT OPENS OVER AN UNANSWERED COOKIE BANNER, AND THE BACKDROP IS CUT SHORT
 * SO THAT IS SAFE. The banner is `fixed bottom-0 z-40` and this backdrop is
 * `z-[80]`, so a full `inset-0` would lie across the Accept/Decline buttons
 * and leave a marketing popup obstructing a compliance control — which is a
 * dark pattern, not a z-index detail. Instead the backdrop stops at
 * `--cookie-banner-h`, the variable CookieBanner already publishes on
 * documentElement for the sticky buy bar. The banner stays uncovered,
 * undimmed and clickable while the modal is up, and CookieBanner itself is
 * untouched.
 *
 * This replaced an earlier gate that held the modal until consent had been
 * answered. That was safe but cost reach: a first-time visitor who ignores
 * the banner — and plenty do — never saw the promo at all.
 *
 * ⚠ EXPIRY IS DECIDED ON THE DEVICE, LIKE THE COUNTDOWNS. Both host pages are
 * ISR-cached (`revalidate = 60`, and the homepage is `force-static`), so a
 * server-side "is it over yet" would be baked into HTML that outlives the
 * answer. Nothing renders server-side at all — the component returns null
 * until it has mounted, read storage and checked the clock — so the cached
 * HTML carries no popup and there is no hydration mismatch to manage.
 */

/**
 * A beat after the page settles. Opening on first paint competes with the hero
 * for the LCP window and reads as an ad; a short pause reads as the site
 * telling you something.
 */
const DELAY_MS = 1200;

/**
 * ⚠ NO STORAGE MEANS NO POPUP — a deliberate, and the safer, failure.
 *
 * Private windows and locked-down browsers can throw on `localStorage`. We
 * could still show the modal there, but we could not honour a dismissal, so it
 * would return on every navigation with no way to make it stop. A promo nobody
 * sees beats a promo nobody can close.
 */
function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * ⚠ REVIEW OVERRIDE — `?promo=1` reopens a promo you have already dismissed,
 * and one whose `endsAt` has passed. Dismissal is permanent by design, which
 * makes the popup impossible to look at a second time without digging a key
 * out of localStorage; this is the way back in.
 *
 * ⚠ Read off `window.location.search`, NOT `useSearchParams`. That hook opts
 * a route out of static generation and needs a Suspense boundary — the layout
 * already wraps StickyBuyBar in one for exactly that reason — and the homepage
 * is `force-static`. This runs client-side after mount and costs the page
 * nothing.
 *
 * ⚠ Deliberately NOT gated on NODE_ENV. A Vercel preview builds as production,
 * so an env gate would kill the override on the deploys where review actually
 * happens. The blast radius is "someone who typed an undocumented query param
 * sees a promo again", which is not a risk worth a broken review tool.
 *
 */
function forcedOpen(): boolean {
  try {
    const v = new URLSearchParams(window.location.search).get("promo");
    return v === "1" || v === "true";
  } catch {
    return false;
  }
}

export function PromoModal({ promo }: { promo: ResolvedPromo }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Dismissal is keyed to the promo id, so retiring this one and shipping the
  // next does not find every visitor already opted out of it.
  const dismissKey = `ppa-promo-${promo.id}`;

  useEffect(() => {
    const s = storage();
    if (!forcedOpen()) {
      if (!s) return;
      if (s.getItem(dismissKey)) return;
      if (Date.now() >= Date.parse(promo.endsAt)) return;
    }

    const id = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(id);
  }, [dismissKey, promo.endsAt]);

  /** Remember the dismissal without closing — for clicks that navigate away. */
  const remember = useCallback(() => {
    try {
      storage()?.setItem(dismissKey, "1");
    } catch {
      /* quota or a locked-down browser: the modal still closes for this view */
    }
  }, [dismissKey]);

  const close = useCallback(() => {
    setOpen(false);
    remember();
  }, [remember]);

  useEffect(() => {
    if (!open) return;
    const restoreFocusTo = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      // Cleared, not set back to a value — that restores whatever globals.css
      // has on body rather than pinning an inline override.
      document.body.style.overflow = "";
      restoreFocusTo?.focus?.();
    };
  }, [open, close]);

  if (!open) return null;

  const headingId = `promo-${promo.id}-title`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      onClick={close}
      /* bottom-[--cookie-banner-h] — NOT inset-0. See the note at the top of
         this file: the dim layer deliberately stops short of the cookie
         banner so Accept/Decline stay uncovered and clickable underneath an
         open promo. Falls back to 0px, so with no banner on screen this is
         a full-viewport backdrop exactly as before. */
      className="fixed inset-x-0 top-0 bottom-[var(--cookie-banner-h,0px)] z-[80] flex items-center justify-center bg-ppa-navy-deep/80 p-4 backdrop-blur-sm motion-safe:animate-fade"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        /**
         * ⚠ WIDTH IS CAPPED BY THE VIEWPORT'S HEIGHT, and that is the whole
         * trick. The key art is SQUARE, so the panel stands roughly its own
         * width plus a 143px text block (measured, not guessed). Widening it
         * on a short laptop therefore pushes "Buy Tickets" below the fold, and
         * `overflow-y-auto` would hide the CTA behind a scroll nobody performs
         * in a popup. The 165 leaves headroom for a promo whose date line
         * wraps to two lines. One min() serves a 4K monitor (capped at 640)
         * and a 1440x720 laptop (~469) with no media query.
         */
        className="relative max-h-[90vh] w-[min(92vw,640px,calc(88vh-165px))] overflow-y-auto bg-white shadow-2xl"
      >
        {/* The art carries the words, so the accessible name is the article's
            own headline rather than a description of the picture. */}
        <h2 id={headingId} className="sr-only">
          {promo.alt}
        </h2>

        {/* ⚠ Deliberately NOT wrapped in a link. A popup where the whole panel
            navigates is how a mis-aimed tap at the close button sends someone
            to Tixr — the two buttons below are the way out. */}
        <Image
          src={promo.image}
          alt=""
          width={promo.imageWidth}
          height={promo.imageHeight}
          // 640px is the panel's widest; when the height cap bites it is
          // narrower and this over-fetches slightly, which is the safe way for
          // `sizes` to be wrong. Below sm the panel is the viewport less p-4.
          sizes="(min-width: 640px) 640px, calc(100vw - 2rem)"
          className="h-auto w-full"
        />

        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-ppa-navy-deep/70 text-lg leading-none text-white transition-colors hover:bg-ppa-navy-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          ✕
        </button>

        <div className="px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-blue">
            {promo.eyebrow}
          </p>
          <p className="mt-1 font-display text-lg uppercase leading-[1.15] text-ppa-navy sm:text-xl">
            {promo.headline}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {promo.ticketUrl && (
              <a
                href={promo.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={remember}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 bg-ppa-blue px-5 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-ppa-blue-deep active:scale-[0.98]"
              >
                {promo.ticketLabel}
              </a>
            )}
            <Link
              href={promo.href}
              onClick={remember}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 border border-ppa-line px-5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition hover:border-ppa-navy active:scale-[0.98]"
            >
              Full Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
