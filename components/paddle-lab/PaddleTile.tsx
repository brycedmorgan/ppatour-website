import Image from "next/image";

/**
 * The picture slot on a card, a paddle page and the compare header.
 *
 * Three states, best first:
 *   1. a curated transparent cut-out (lib/paddle-images.ts) — floats on paper
 *   2. Pickleball Central's product photo (lib/data/paddle-pbc.json) — a paddle
 *      on white, so it sits on a white plate; 800×800 off their BigCommerce CDN
 *   3. the branded navy tile with the brand name — for the paddles the PBC
 *      matcher could not place with confidence (scripts/import-pbc-paddles.mjs)
 * A labelled tile beats a wrong photo, which is why the matcher refuses ties.
 */
export function PaddleTile({
  name,
  brand,
  image,
  photo,
  size = "card",
}: {
  name: string;
  brand: string;
  /** Curated cut-out src. */
  image: string | null;
  /** PBC product photo src. */
  photo?: string | null;
  size?: "card" | "hero" | "mini";
}) {
  const box = size === "mini" ? "h-16 w-16" : "aspect-[4/5] w-full";
  const type = size === "mini" ? "text-[9px]" : size === "hero" ? "text-2xl sm:text-3xl" : "text-sm";
  const sizes =
    size === "hero" ? "(min-width:1024px) 40vw, 90vw" : size === "mini" ? "64px" : "(min-width:1024px) 25vw, 50vw";
  const alt = `${name} pickleball paddle`;

  if (image) {
    return (
      <div className={`relative flex ${box} items-center justify-center overflow-hidden bg-ppa-paper`}>
        <Image
          src={image}
          alt={alt}
          width={240}
          height={480}
          sizes={sizes}
          className="h-[86%] w-auto object-contain drop-shadow-[0_10px_20px_rgba(12,43,68,0.25)]"
        />
      </div>
    );
  }

  if (photo) {
    return (
      <div className={`relative ${box} overflow-hidden bg-white`}>
        <Image src={photo} alt={alt} fill sizes={sizes} className="object-contain p-2" />
      </div>
    );
  }

  return (
    <div aria-hidden className={`relative flex ${box} items-center justify-center overflow-hidden bg-ppa-navy`}>
      <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(77,193,239,0.25),transparent_60%)]" />
      <span
        className={`relative max-w-[80%] text-center font-display uppercase leading-tight tracking-[0.06em] text-white/85 ${type}`}
      >
        {brand}
      </span>
    </div>
  );
}
