import Image from "next/image";
import type { Tournament } from "@/lib/placeholder-data";

/**
 * The event's own mark, wherever it appears — hero, cards, the header's upcoming
 * list, the sticky tab bar. One component because there are SEVEN render sites
 * and they have to agree about shape: this repo's recurring bug is two surfaces
 * drawing the same thing from the same data and drifting (the event page vs
 * NationalsLive, the TV-schedule names, the parking copy).
 *
 * ⚠ TWO SHAPES, AND MIXING THEM IS THE WHOLE REASON THIS EXISTS. The hand-made
 * badge crests in `public/ppa/badges` are PORTRAIT (~0.545) on transparency; the
 * marks the API serves in `logo_url` are LANDSCAPE (600x315, 1.90) with a white
 * or black background baked in. Dropped into a slot sized for the other, a mark
 * either renders 42x22 and illegible or 335px wide and shoves the H1 off the
 * hero. `brand.iconWide` says which one this is; see the note on the field.
 *
 * ⚠ ALWAYS `fill` INSIDE A FIXED BOX, NEVER `w-auto` OFF A DECLARED RATIO.
 * The hero used `width={720} height={1320} className="h-28 w-auto"`, and when
 * those numbers disagreed with the real file the browser reserved space from the
 * declared ratio and RELAID OUT once the image loaded — the badge jumped ~50%
 * wider and shoved the H1 sideways (fixed 8/4, and the fix was to keep the
 * declared ratio matching the files). With a fixed box + object-contain no
 * declared ratio exists to be wrong, so a feed mark of any dimensions is safe.
 */

type Variant = "hero" | "card" | "cardLg" | "row" | "bar";

/** Fixed boxes per slot. Wide boxes are sized so a 1.90 feed mark and the ~1.18
 *  trimmed Finals mark both land legibly; portrait boxes are the crest sizes
 *  that shipped before this component existed, unchanged. */
const BOX: Record<Variant, { wide: string; tall: string }> = {
  hero: { wide: "h-[4.5rem] w-40 sm:h-28 sm:w-60", tall: "h-28 w-[62px] sm:h-44 sm:w-24" },
  cardLg: { wide: "h-14 w-[124px]", tall: "h-28 w-[60px]" },
  card: { wide: "h-12 w-[104px]", tall: "h-20 w-[42px]" },
  // Wider than tall by a lot: the feed marks are wordmarks ("PICKLEBALL WORLD
  // CHAMPIONSHIPS"), and at the crest's 36px width they set at ~9px and stop
  // being readable — the failure this component exists to prevent.
  row: { wide: "h-9 w-24", tall: "h-14 w-9" },
  bar: { wide: "h-7 w-14", tall: "h-7 w-4" },
};

/** `sizes` per slot — the widest the box ever gets, so the optimizer never ships
 *  a 3840 candidate for a 42px badge. */
const SIZES: Record<Variant, string> = {
  hero: "(min-width: 640px) 240px, 160px",
  cardLg: "124px",
  card: "104px",
  row: "96px",
  bar: "56px",
};

export function EventMark({
  brand,
  name,
  variant,
  priority,
  className = "",
}: {
  brand: Tournament["brand"];
  /** Event name — only for alt text; pass "" to render the mark decoratively. */
  name: string;
  variant: Variant;
  priority?: boolean;
  className?: string;
}) {
  if (!brand?.icon) return null;
  const wide = Boolean(brand.iconWide);

  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded ${
        BOX[variant][wide ? "wide" : "tall"]
      } ${
        // A feed mark carries its own opaque background, so it sits on a white
        // chip: over a photo card the alternative is a white rectangle with
        // ragged edges reading as a broken image. The transparent crests need
        // no chip and never had one.
        wide ? "bg-white p-1 shadow-sm ring-1 ring-black/5" : ""
      } ${className}`}
    >
      <Image
        src={brand.icon}
        alt={name ? `${name} logo` : ""}
        fill
        sizes={SIZES[variant]}
        priority={priority}
        className="object-contain"
      />
    </span>
  );
}
