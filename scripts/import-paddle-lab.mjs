/**
 * John Kew paddle database → `lib/data/paddles.json` (the Paddle Lab library).
 *
 *   node scripts/import-paddle-lab.mjs            # parse the committed snapshot, write JSON
 *   node scripts/import-paddle-lab.mjs --report   # parse + print, write nothing
 *   node scripts/import-paddle-lab.mjs --fetch    # refresh the snapshot from the sheet first
 *
 * SOURCE OF TRUTH IS `lib/data/paddle-lab-kew.csv`, a snapshot of the Google
 * Sheet that johnkewpickleball.com/paddle-database reads at runtime (the page
 * loads it with PapaParse; the published-CSV URL is SHEET_CSV below). We commit
 * the snapshot so a build never depends on Google, and so a diff shows exactly
 * which measurements changed between refreshes.
 *
 * ⚠ THIS SCRIPT IS THE ONLY THING THAT WRITES A NUMBER INTO THE LAB. Every
 * metric on the site is a cell in that sheet, copied by this parser. Nothing in
 * the app computes a rating, and no editor — human or model — types one in.
 * Editorial goes in `lib/data/paddle-lab-editorial.json` (prose, tags, a pinned
 * Pickleball Central URL) and is merged at read time by lib/paddle-lab.ts.
 *
 * ⚠ COLUMNS WE DELIBERATELY DO NOT COPY: `Link to Purchase`, `Discount Code`,
 * `Discount`, `Discounted Price`. Those are John's affiliate links and codes.
 * Our shop CTA is Pickleball Central, resolved by lib/pbc-links.ts.
 *
 * ⚠ LICENSING: the sheet is public and Hannah Johns says John is on board
 * (8/28), but the terms are not signed. Until they are, this powers a preview
 * only — see docs/PADDLE-LAB.md.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = join(ROOT, "lib/data/paddle-lab-kew.csv");
const OUT = join(ROOT, "lib/data/paddles.json");
const REPORT_ONLY = process.argv.includes("--report");
const FETCH = process.argv.includes("--fetch");

/** The published CSV the database page itself loads. */
const SHEET_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSxXXe0qvh94nPoU20S7OSp8yw9tHF4f4VpfNH_fneBhKSSOxvvrQ9lPGwgcNa_OS9OuWTZzaDyZWiZ/pub?gid=575894669&single=true&output=csv";

/* ---------------- csv ---------------- */

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/* ---------------- cell readers ---------------- */

const str = (v) => (v ?? "").trim() || null;

/** "2,219" → 2219; "$149.99" → 149.99; "" → null. Never guesses. */
function num(v) {
  const s = (v ?? "").replace(/[$,%\s]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** "J2K+" and "J2K" are different paddles, so "+" survives as "plus". */
function slugify(s) {
  return s
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The sheet spells certification eleven ways. Fold to a handful the filter can
 * offer, keeping the original string on the record for the detail page.
 */
function certification(raw) {
  const s = (raw ?? "").toLowerCase();
  if (!s) return "unknown";
  if (s.includes("dual")) return "dual";
  if (s.includes("delisted") || s.includes("sunset")) return "delisted";
  if (s.includes("provisional") || s.includes("interim")) return "provisional";
  if (s.includes("quiet")) return "quiet-only";
  if (s.includes("none")) return "none";
  if (s.includes("upa")) return "upa-a";
  if (s.includes("usap")) return "usap";
  return "unknown";
}

/** "Gen 3" / "Gen4" / "Gen-3" → "Gen-3". */
function build(raw) {
  const m = (raw ?? "").match(/gen\s*-?\s*(\d)/i);
  return m ? `Gen-${m[1]}` : str(raw);
}

/** "power-leaning" | "slightly power" | "balanced" | "slightly pop" | "pop-leaning" → coarse tilt. */
function tilt(raw) {
  const s = (raw ?? "").toLowerCase();
  if (!s) return null;
  if (s.includes("power")) return "power";
  if (s.includes("pop")) return "pop";
  if (s.includes("balanced")) return "balanced";
  return null;
}

function tier(raw) {
  const m = (raw ?? "").match(/(\d)/);
  return m ? Number(m[1]) : null;
}

/** "6/1/2025" → "2025-06-01"; blank → null. */
function isoDate(raw) {
  const m = (raw ?? "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

/* ---------------- main ---------------- */

async function main() {
  if (FETCH) {
    const res = await fetch(SHEET_CSV);
    if (!res.ok) throw new Error(`sheet fetch failed: ${res.status}`);
    const text = await res.text();
    if (!text.startsWith("Company,Paddle")) throw new Error("sheet header changed — refusing to overwrite the snapshot");
    writeFileSync(CSV, text);
    console.log(`snapshot refreshed: ${text.length} bytes`);
  }

  const rows = parseCsv(readFileSync(CSV, "utf8"));
  const header = rows[0];
  const col = (name) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`column missing from sheet: ${name}`);
    return i;
  };
  const C = {
    brand: col("Company"),
    model: col("Paddle"),
    thickness: col("Core Thickness (mm)"),
    condition: col("Condition"),
    date: col("Date Entered"),
    price: col("Retail Price"),
    cert: col("Certification Status"),
    warranty: col("Warranty"),
    shape: col("Shape"),
    build: col("Build"),
    process: col("Manufacturing Process"),
    texture: col("Surface Texture"),
    layup: col("Surface Layup"),
    core: col("Core Type"),
    deflection: col("Deflection (lbs)"),
    spinRpm: col("Spin RPM"),
    spinScore: col("Spin Scaled Z-Score"),
    spinCategory: col("Spin Category"),
    spinTier: col("Spin Durability Tier"),
    length: col("Length (in)"),
    width: col("Width (in)"),
    handle: col("Handle Length (in)"),
    weight: col("Static Weight (oz)"),
    swing: col("Swing Weight"),
    swingScore: col("Swing Scaled Z-Score"),
    twist: col("Twist Weight"),
    twistScore: col("Twist Scaled Z-Score"),
    balance: col("Balance Point (cm)"),
    balanceScore: col("Balance Scaled Z-Score"),
    handSpeed: col("Hand Speed Index (0-100)"),
    power: col("Serve Speed-MPH (Power)"),
    powerScore: col("Power Scaled Z-Score"),
    pop: col("Punch Volley Speed-MPH (Pop)"),
    popScore: col("Pop Scaled Z-Score"),
    firepower: col("Firepower (0-100)"),
    kewCor: col("KewCOR"),
    tilt: col("Tilt Band"),
  };

  const out = [];
  const seen = new Map();
  const skipped = [];

  for (const r of rows.slice(1)) {
    const brand = str(r[C.brand]);
    const model = str(r[C.model]);
    if (!brand || !model) continue;
    const thicknessMm = num(r[C.thickness]);

    let slug = slugify(`${brand} ${model}${thicknessMm ? ` ${thicknessMm}mm` : ""}`);
    if (seen.has(slug)) {
      // Same brand + model + thickness twice. The sheet has four of these; the
      // first row wins and the second is reported, never silently merged.
      skipped.push(`${brand} ${model} ${thicknessMm ?? ""}mm — duplicate of an earlier row`);
      continue;
    }
    seen.set(slug, true);

    const shapeRaw = str(r[C.shape]);
    const shape = shapeRaw
      ? ["Elongated", "Hybrid", "Widebody"].find((s) => s.toLowerCase() === shapeRaw.toLowerCase()) ?? "Other"
      : "Other";

    out.push({
      slug,
      brand,
      model,
      name: `${brand} ${model}`,
      thicknessMm,
      price: num(r[C.price]),
      condition: str(r[C.condition]),
      dateEntered: isoDate(r[C.date]),
      certification: certification(r[C.cert]),
      certificationRaw: str(r[C.cert]),
      warranty: str(r[C.warranty]),
      shape,
      build: build(r[C.build]),
      process: str(r[C.process]),
      surfaceTexture: str(r[C.texture]),
      surfaceLayup: str(r[C.layup]),
      coreType: str(r[C.core]),
      specs: {
        lengthIn: num(r[C.length]),
        widthIn: num(r[C.width]),
        handleLengthIn: num(r[C.handle]),
        staticWeightOz: num(r[C.weight]),
      },
      metrics: {
        spinRpm: num(r[C.spinRpm]),
        spinScore: num(r[C.spinScore]),
        spinCategory: str(r[C.spinCategory]),
        spinDurabilityTier: tier(r[C.spinTier]),
        swingWeight: num(r[C.swing]),
        swingScore: num(r[C.swingScore]),
        twistWeight: num(r[C.twist]),
        twistScore: num(r[C.twistScore]),
        balancePointCm: num(r[C.balance]),
        balanceScore: num(r[C.balanceScore]),
        handSpeedIndex: num(r[C.handSpeed]),
        serveSpeedMph: num(r[C.power]),
        powerScore: num(r[C.powerScore]),
        punchVolleyMph: num(r[C.pop]),
        popScore: num(r[C.popScore]),
        firepower: num(r[C.firepower]),
        kewCor: num(r[C.kewCor]),
        deflectionLbs: num(r[C.deflection]),
        tilt: tilt(r[C.tilt]),
        tiltRaw: str(r[C.tilt]),
      },
    });
  }

  out.sort((a, b) => a.name.localeCompare(b.name));

  const withPower = out.filter((p) => p.metrics.serveSpeedMph != null).length;
  const brands = new Set(out.map((p) => p.brand)).size;
  console.log(`${out.length} paddles, ${brands} brands; ${withPower} with power/pop data`);
  for (const s of skipped) console.log(`  skipped: ${s}`);

  if (REPORT_ONLY) return;
  writeFileSync(
    OUT,
    JSON.stringify({ source: "johnkew", snapshotBytes: readFileSync(CSV).length, paddles: out }, null, 2) + "\n",
  );
  console.log(`wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
