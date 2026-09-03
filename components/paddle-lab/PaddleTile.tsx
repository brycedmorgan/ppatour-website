import Image from "next/image";

/**
 * The picture slot on a card, a paddle page and the compare header.
 *
 * We hold curated cut-outs for a handful of models (lib/paddle-images.ts) and
 * nothing for the other 460, so the default state is a branded tile: navy
 * ground, brand name set in the display face. A labelled placeholder beats a
 * broken frame, and it is the same call the shop grid makes with "Photo Coming".
 * Product photography lands when Pickleball Central's feed does — see
 * docs/PADDLE-LAB.md.
 */
export function PaddleTile({
  name,
  brand,
  image,
  size = "card",
}: {
  name: string;
  brand: string;
  image: string | null;
  size?: "card" | "hero" | "mini";
}) {
  const box =
    size === "hero" ? "aspect-[4/5] w-full" : size === "mini" ? "h-16 w-16" : "aspect-[4/5] w-full";
  const type = size === "mini" ? "text-[9px]" : size === "hero" ? "text-2xl sm:text-3xl" : "text-sm";

  if (image) {
    return (
      <div className={`relative flex ${box} items-center justify-center overflow-hidden bg-ppa-paper`}>
        <Image
          src={image}
          alt={`${name} pickleball paddle`}
          width={240}
          height={480}
          sizes={size === "hero" ? "(min-width:1024px) 40vw, 90vw" : size === "mini" ? "64px" : "(min-width:1024px) 25vw, 50vw"}
          className="h-[86%] w-auto object-contain drop-shadow-[0_10px_20px_rgba(12,43,68,0.25)]"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={`relative flex ${box} items-center justify-center overflow-hidden bg-ppa-navy`}
    >
      <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(77,193,239,0.25),transparent_60%)]" />
      <span
        className={`relative max-w-[80%] text-center font-display uppercase leading-tight tracking-[0.06em] text-white/85 ${type}`}
      >
        {brand}
      </span>
    </div>
  );
}
