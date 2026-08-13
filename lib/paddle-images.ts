/**
 * Transparent-background paddle photography for the "In the Bag" callout.
 *
 * The callout sits in the Quick Info rail on a light panel, so the paddle has to
 * be cut out — Pickleball Central's product shots are a paddle on a solid white
 * JPEG canvas, and dropped straight in they render as a white box on a white
 * card. `scripts/import-paddle-image.mjs` does the knockout and writes the PNG
 * into public/ppa/paddles/; this file is the map from a paddle name to that file.
 *
 * ⚠ THE MAP IS HAND-KEPT, AND THAT IS THE POINT. The Jackalope feed's `image`
 * field is a scraped og:image, which means it can change under us, can be a
 * lifestyle shot rather than a product cut-out, and is null for most of the
 * roster today. A curated asset is the one we can be sure looks right on the
 * card. The feed image is still used as the fallback wherever we have no
 * curated cut-out, so a pro Dillon pins a photo for is never worse off.
 *
 * Adding one is two commands:
 *   1. find the paddle on pickleballcentral.com
 *   2. node scripts/import-paddle-image.mjs --url <product url> --slug <slug>
 * then paste the printed entry below, keyed on the normalized paddle name.
 */

export type PaddleImage = {
  src: string;
  width: number;
  height: number;
  /** true = a curated transparent cut-out (renders on the light card without a
   *  plate). false = the feed's scraped photo, which may carry its own
   *  background and gets a white plate behind it so it never looks broken. */
  cutout: boolean;
};

/** Lowercase, strip everything but letters and numbers — so "Franklin C45 Hybrid",
 *  "franklin c45-hybrid" and "FRANKLIN C45 HYBRID 14MM" all collide sensibly. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

type Asset = Omit<PaddleImage, "cutout">;

/**
 * Keyed by ATHLETE SLUG, for paddles sold in signature colourways.
 *
 * ⚠ THIS EXISTS BECAUSE A MODEL NAME IS NOT ALWAYS ENOUGH TO PICK A PHOTO.
 * JOOLA sells the Perseus Pro V 16mm as a Ben Johns paddle, a Simone Jardim
 * paddle and a Rally Rocket, and ten pros on our roster play "Perseus Pro V
 * 16mm" with no colourway recorded anywhere. Filing one of those photos under
 * the model would publish Ben Johns' paddle on nine other players' profiles.
 * A signature paddle only goes on the player whose name is on it.
 */
const BY_SLUG: Record<string, Asset> = {
  "ben-johns": { src: "/ppa/paddles/joola-perseus-pro-v-ben-johns-16mm.png", width: 221, height: 480 },
  "anna-bright": { src: "/ppa/paddles/joola-scorpeus-pro-v-anna-bright-14mm.png", width: 242, height: 480 },
};

/**
 * Keyed by normalized paddle name, exactly as `resolveGear` displays it.
 *
 * ⚠ ONLY ADD A MODEL HERE WHEN THE NAME IDENTIFIES ONE PRODUCT. "Six Zero
 * Coral" is sold as Hybrid, Elongated, Widebody and three Pro cuts and the feed
 * records none of them, so it stays out — no photo beats the wrong photo, the
 * same rule the rest of this repo runs on.
 *
 * ⚠ NOT EVERY LISTING HAS A USABLE PHOTO EITHER. The CRBN TruFoam Barrage 4 (4
 * pros) leads with a lifestyle shot on an orange backdrop, so there is nothing
 * to knock out; the importer refuses it rather than write a coloured rectangle,
 * and those pros correctly render the callout with no image. Don't "fix" that
 * by hand-cropping — find a product shot or leave it.
 */
const CUTOUTS: Record<string, Asset> = {
  "franklin c45 hybrid": { src: "/ppa/paddles/franklin-c45-hybrid.png", width: 222, height: 480 },
  "selkirk project boomstik elongated": { src: "/ppa/paddles/selkirk-project-boomstik-elongated.png", width: 216, height: 480 },
  "luzz pro cannon": { src: "/ppa/paddles/luzz-pro-cannon.png", width: 215, height: 480 },
  "11six24 vapor power 2": { src: "/ppa/paddles/11six24-vapor-power-2.png", width: 242, height: 480 },
};

/**
 * The image for a paddle, or null when we have neither a cut-out nor a feed photo.
 *
 * Matching is exact-then-prefix on the normalized name: the masterlist writes
 * thickness into some paddle strings ("Franklin C45 Hybrid 14MM") while the
 * curated asset is the model, so a strict equality test would miss the pro the
 * asset was made for. Prefix only — never substring — so "C45" can't match a
 * different C45 model.
 */
export function paddleImageFor(
  paddle: string | null | undefined,
  feedImage?: string | null,
  slug?: string | null,
): PaddleImage | null {
  // A signature paddle wins: it is the more specific fact about this player.
  const signature = slug ? BY_SLUG[slug] : null;
  if (signature) return { ...signature, cutout: true };

  const key = norm(paddle ?? "");
  if (key) {
    const exact = CUTOUTS[key];
    if (exact) return { ...exact, cutout: true };
    for (const [k, v] of Object.entries(CUTOUTS)) {
      if (key.startsWith(k + " ")) return { ...v, cutout: true };
    }
  }
  const fallback = feedImage?.trim();
  // No intrinsic size for a scraped URL — the card renders it in a fixed box, so
  // width/height here are the box's aspect, not a claim about the file.
  if (fallback) return { src: fallback, width: 1, height: 1, cutout: false };
  return null;
}

/**
 * A stable slug for the paddle model, used as `utm_term` on the buy link so the
 * brand can count clicks per PADDLE rather than per player. Thickness and any
 * second model in the cell are dropped — the manufacturer cares about the model.
 */
export function paddleTerm(paddle: string): string {
  return norm(paddle.split(",")[0])
    .replace(/\b\d{1,2}\s?mm\b/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
