/**
 * Imports the partner brand-kit art Wesley downloaded (Platinum / Gold / Tour
 * Sponsors zips) into public/ppa/sponsors/.
 *
 * Per file: trim the dead margin so every mark optically fills its card box,
 * and cap the long edge at 900px (cards display at 170–200px, so that's ~4x for
 * retina and still small on disk).
 *
 * FORMAT IS CHOSEN PER FILE, not fixed. These are flat-colour wordmarks, and a
 * quantized PNG frequently beats webp on exactly that kind of art — encoding
 * everything as webp made Ensure 71 KB against a 24 KB PNG source, i.e. the
 * "optimizer" tripled it. So we encode both and keep whichever is genuinely
 * smaller, which is why the shipped extensions are mixed.
 *
 * Prints the FINAL dimensions, which are what logoWidth/logoHeight must carry:
 * next/image needs the intrinsic size of the file we actually ship, not the
 * source art.
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = "C:/Users/Wesley Ahlfeld/Downloads";
const OUT = "c:/Users/Wesley Ahlfeld/dev-work/ppatour-website/public/ppa/sponsors";
const MAX = 900;

// [folder, filename, output slug, what the artwork actually says]
const JOBS = [
  // --- refreshed marks for partners we already had
  ["Platinum Partner Logos/Platinum Partner Logos", "Carvana-LOGO-Primary-Horizontal-Blue-RGB-1-1024x224.png", "carvana", "Carvana"],
  ["Platinum Partner Logos/Platinum Partner Logos", "RGB_VEOLIA_HD-1536x627.png", "veolia", "Veolia"],
  ["Platinum Partner Logos/Platinum Partner Logos", "JOOLA_Lockup_Horizontal_Outline_Black_RGB-1536x485.png", "joola", "JOOLA"],
  ["Platinum Partner Logos/Platinum Partner Logos", "Hum_Logo_R_Green_4C-2-preferred-when-possible-1536x668.png", "humana", "Humana"],
  ["Platinum Partner Logos/Platinum Partner Logos", "Digital-Large-Transparent-Bknd-72ppi-US-ENS-Max-Protein-Logo-CMYK.png", "ensure", "Ensure Max Protein"],
  ["Platinum Partner Logos/Platinum Partner Logos", "Proton_Logov7-pdf.jpg", "proton", "Proton"],

  // --- the marks that were missing (9 of the 10; Selkirk was not supplied)
  ["Gold Partner Logos", "rate-dark@200x-100-1536x625.jpg", "rate", "Rate"],
  ["Gold Partner Logos", "LOGO-AZ-1.png", "astrazeneca", "AstraZeneca (the Fasenra record uses this)"],
  ["Gold Partner Logos", "HALine-Logo_Vertical-copy-1536x972.png", "holland-america", "Holland America Line (vertical lockup)"],
  ["Gold Partner Logos", "joma-black-1536x381.png", "joma", "Joma"],
  ["Gold Partner Logos", "Park-Place-Technologies_Stacked_Color-final-1-1536x887.png", "park-place", "Park Place Technologies (stacked)"],
  ["Gold Partner Logos", "ATSports-Logo_Color.jpg", "at-sports", "AT Sports (the Acrytech record uses this)"],
  ["Platinum Partner Logos/Platinum Partner Logos", "Storm-Primary-blk-Horizontal-1536x698.png", "reign-storm", "Reign Storm"],
  ["Tour Sponsors", "lt-pro48-rev.png", "lt-pro48", "LT PRO48"],
  ["Tour Sponsors", "tixr_logo.png", "tixr", "Tixr"],

  // --- partners that were not on the roster at all
  ["Platinum Partner Logos/Platinum Partner Logos", "zimmer-biomet-logo-sponsor.webp", "zimmer-biomet", "Zimmer Biomet"],
  ["Platinum Partner Logos/Platinum Partner Logos", "partners_logos.png", "life-time", "Life Time"],
  ["Tour Sponsors", "BC-Logo__BC-LL-Primary-1.png", "black-clover", "Black Clover"],
  ["Tour Sponsors", "3-scaled.png", "o2-sports-insurance", "O2 Sports Insurance"],
  ["Tour Sponsors", "MIN_Sparkle.png", "mineragua", "Mineragua"],
  ["Tour Sponsors", "Engine-Logo.png", "engine", "Engine"],
  ["Tour Sponsors", "dupr-sponsor-logo.png", "dupr", "DUPR"],
  ["Tour Sponsors", "logo-playsight-scaled.png", "playsight", "PlaySight"],
  ["Tour Sponsors", "Logo-PickleballCentral-Primary-Horizontal-Preferred_Logo-PickleballCentral-Primary-Horizontal-Preferred-scaled-e1767821399640.png", "pickleball-central", "Pickleball Central"],
  // PickleballTV. Excluded on the first pass as our own streaming property —
  // wrong: ppatour.com/sponsors lists it as a Gold sponsor (Official Broadcast
  // Partner), so it belongs on the wall like any other.
  ["Tour Sponsors", "03_PBTV_logo_Color_rgb1.png", "pbtv", "PickleballTV"],
];

/**
 * Marks that never came in a zip — pulled straight from the live site's media
 * library, which is where marketing publishes them (Wesley supplied the URLs
 * 8/3). Same pipeline as the zip files: trim, cap, pick the smallest encoding.
 */
const REMOTE_JOBS = [
  ["https://ppatour.com/wp-content/uploads/2024/07/JC_primary_positive.png", "just-courts", "Just Courts Design + Build"],
  ["https://ppatour.com/wp-content/uploads/2025/01/pt-logo-primary.png", "pickleball-tournaments", "Pickleball Tournaments"],
  ["https://ppatour.com/wp-content/uploads/2024/06/Hertz_logo.png", "hertz", "Hertz"],
  ["https://ppatour.com/wp-content/uploads/2025/06/Picklebalm_Logo_Color_SPOT_PMS2129_PMS375.png", "picklebalm", "Picklebalm"],
];

mkdirSync(OUT, { recursive: true });

/** Local zip files and remote URLs, normalised to {get(), slug, label}. */
const ALL = [
  ...JOBS.map(([dir, file, slug, label]) => ({
    slug,
    label,
    get: async () => join(SRC, dir, file),
  })),
  ...REMOTE_JOBS.map(([url, slug, label]) => ({
    slug,
    label,
    get: async () => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${r.status} fetching ${url}`);
      return Buffer.from(await r.arrayBuffer());
    },
  })),
];

const results = [];
for (const job of ALL) {
  const { slug, label } = job;
  try {
    const src = await job.get();
    const before = await sharp(src).metadata();
    // Trim the uniform margin (transparent OR flat white) so marks sit
    // consistently. Guarded: if trim eats more than 92% of either axis the
    // threshold caught real art, so fall back to untrimmed.
    let pipeline = sharp(src).trim({ threshold: 12 });
    let trimmed;
    try {
      trimmed = await pipeline.toBuffer({ resolveWithObject: true });
      const shrank =
        trimmed.info.width < before.width * 0.08 ||
        trimmed.info.height < before.height * 0.08;
      if (shrank) throw new Error("trim too aggressive");
    } catch {
      trimmed = await sharp(src).toBuffer({ resolveWithObject: true });
    }

    const sized = sharp(trimmed.data).resize({
      width: MAX,
      height: MAX,
      fit: "inside",
      withoutEnlargement: true,
    });

    /**
     * Encode several ways and ship the smallest. Not premature: a single fixed
     * encoder was WORSE than the source art on some of these marks (all-webp
     * tripled Ensure; palette-PNG at 256 colours still beat its own 24 KB
     * original by going the wrong way). The spread across these candidates is
     * 3-9x on the same image, so the choice is worth making per file.
     *
     * Lossless webp is in the list because these are flat graphics with hard
     * edges — the case where lossless routinely undercuts lossy at quality 90.
     */
    const candidates = await Promise.all([
      sized.clone().webp({ quality: 90, effort: 6 }).toBuffer({ resolveWithObject: true }).then((b) => ({ ext: "webp", ...b })),
      sized.clone().webp({ lossless: true, effort: 6 }).toBuffer({ resolveWithObject: true }).then((b) => ({ ext: "webp", ...b })),
      sized.clone().png({ palette: true, colors: 256, compressionLevel: 9, effort: 10 }).toBuffer({ resolveWithObject: true }).then((b) => ({ ext: "png", ...b })),
      sized.clone().png({ palette: true, colors: 64, compressionLevel: 9, effort: 10 }).toBuffer({ resolveWithObject: true }).then((b) => ({ ext: "png", ...b })),
      sized.clone().png({ palette: true, colors: 16, compressionLevel: 9, effort: 10 }).toBuffer({ resolveWithObject: true }).then((b) => ({ ext: "png", ...b })),
    ]);
    candidates.sort((a, b) => a.data.length - b.data.length);
    const win = candidates[0];
    const runnerUp = candidates.find((c) => c.ext !== win.ext) ?? candidates[1];

    const dest = join(OUT, `${slug}.${win.ext}`);
    writeFileSync(dest, win.data);

    results.push({
      slug: `${slug}.${win.ext}`,
      label,
      source: `${before.width}x${before.height} ${before.format}`,
      shipped: `${win.info.width}x${win.info.height}`,
      kb: (win.data.length / 1024).toFixed(1),
      alt: `best ${runnerUp.ext} ${(runnerUp.data.length / 1024).toFixed(1)}KB`,
      ext: win.ext,
      width: win.info.width,
      height: win.info.height,
      bare: slug,
    });
  } catch (e) {
    results.push({ slug, label, source: "ERROR", shipped: e.message, kb: "-" });
  }
}

const w = Math.max(...results.map((r) => r.slug.length));
console.log("shipped file".padEnd(w), "source".padEnd(18), "dims".padEnd(11), "size".padStart(8), "  runner-up        what the art says");
for (const r of results) {
  console.log(
    r.slug.padEnd(w),
    r.source.padEnd(18),
    r.shipped.padEnd(11),
    (r.kb + "KB").padStart(8),
    " " + String(r.alt ?? "").padEnd(16),
    " " + r.label,
  );
}
console.log("\n--- paste-ready for lib/home-content.ts ---");
for (const r of results) {
  if (r.source === "ERROR") continue;
  console.log(`${r.bare}: logo: "/ppa/sponsors/${r.bare}.${r.ext}", logoWidth: ${r.width}, logoHeight: ${r.height},`);
}
