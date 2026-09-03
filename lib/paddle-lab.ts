/**
 * The Paddle Lab library — every paddle the lab can show, with its test data,
 * its shop record, its editorial layer and the two links a page needs.
 *
 * THE LIST IS THE UNION OF TWO CATALOGUES (Bryce, 9/3: "why did we not pull in
 * paddles from PBC and link to them to purchase?"):
 *
 *   John Kew's tested paddles   lib/data/paddles.json (468) — the measurements
 *   Pickleball Central's shop   lib/data/pbc-paddle-catalog.json (487) — photo,
 *                               live price, the buy button
 *
 * Where scripts/import-pbc-paddles.mjs matched a PBC product to a Kew paddle,
 * they are ONE record (lib/data/paddle-pbc.json). Every other PBC paddle is
 * its own record with `tested: false`: it has a page, a photo and a buy
 * button, and says "Not yet tested" where the bars would be. A fan who
 * searches for a paddle we sell always finds it.
 *
 * Three files feed this, and they are deliberately different kinds of thing:
 *
 *   lib/data/paddles.json               THE GRID. Written only by
 *                                       scripts/import-paddle-lab.mjs. Never hand-edited.
 *   lib/data/pbc-paddle-catalog.json    THE SHOP. Written only by the PBC crawler.
 *   lib/data/paddle-lab-editorial.json  THE PROSE. Hannah's team writes it.
 *
 * ⚠ NOTHING HERE COMPUTES A RATING. Scores are Kew's own scaled z-scores.
 * ⚠ SERVER ONLY. Client components import lib/paddle-lab-shared.ts.
 */
import raw from "@/lib/data/paddles.json";
import catalogRaw from "@/lib/data/pbc-paddle-catalog.json";
import editorialRaw from "@/lib/data/paddle-lab-editorial.json";
import pbcRaw from "@/lib/data/paddle-pbc.json";
import { pbcDestination } from "@/lib/pbc-links";
import { paddleImageFor, type PaddleImage } from "@/lib/paddle-images";
import { withUtm } from "@/lib/utm";
import {
  labHref,
  type Certification,
  type PaddleSummary,
  type Shape,
  type Skill,
  type Tilt,
} from "@/lib/paddle-lab-shared";

export * from "@/lib/paddle-lab-shared";

export type PaddleSpecs = {
  lengthIn: number | null;
  widthIn: number | null;
  handleLengthIn: number | null;
  staticWeightOz: number | null;
};

export type PaddleMetrics = {
  spinRpm: number | null;
  spinScore: number | null;
  spinCategory: string | null;
  spinDurabilityTier: number | null;
  swingWeight: number | null;
  swingScore: number | null;
  twistWeight: number | null;
  twistScore: number | null;
  balancePointCm: number | null;
  balanceScore: number | null;
  handSpeedIndex: number | null;
  serveSpeedMph: number | null;
  powerScore: number | null;
  punchVolleyMph: number | null;
  popScore: number | null;
  firepower: number | null;
  kewCor: number | null;
  deflectionLbs: number | null;
  tilt: Tilt | null;
  tiltRaw: string | null;
};

/** One row of the grid, exactly as the importer wrote it. */
export type PaddleRow = {
  slug: string;
  brand: string;
  model: string;
  name: string;
  thicknessMm: number | null;
  price: number | null;
  condition: string | null;
  dateEntered: string | null;
  certification: Certification;
  certificationRaw: string | null;
  warranty: string | null;
  shape: Shape;
  build: string | null;
  process: string | null;
  surfaceTexture: string | null;
  surfaceLayup: string | null;
  coreType: string | null;
  specs: PaddleSpecs;
  metrics: PaddleMetrics;
};

/** What an editor may add to a paddle. Every field is optional. */
export type Editorial = {
  skill?: Skill[];
  /** One or two sentences, shown on the card and at the top of the page. */
  summary?: string;
  /** The longer read, paragraphs separated by blank lines. */
  review?: string;
  pros?: string[];
  cons?: string[];
  /** Exact Pickleball Central product URL. Beats the crawled product and the brand-page fallback. */
  pbcUrl?: string;
  /** Put it in the landing-page carousel. */
  trending?: boolean;
  /** Reviewer credit, e.g. "Hannah Johns". */
  reviewedBy?: string;
  reviewedOn?: string;
};

/** A Pickleball Central product as the crawler saw it. */
export type PbcProduct = {
  url: string;
  title: string;
  image: string | null;
  price: number | null;
  availability: string | null;
  sku: string | null;
};

export type Paddle = PaddleRow & {
  editorial: Editorial;
  href: string;
  shopHref: string;
  image: PaddleImage | null;
  pbc: PbcProduct | null;
  /** PBC product photo when there is no curated cut-out. */
  photo: string | null;
  /** Live PBC price when we hold one, else John's recorded list price. */
  displayPrice: number | null;
  /** True when displayPrice came from Pickleball Central. */
  livePrice: boolean;
  /** False for a shop-only paddle John Kew has not measured. */
  tested: boolean;
  soldOut: boolean;
};

const EDITORIAL = editorialRaw as Record<string, Editorial>;
const PBC = pbcRaw as Record<string, PbcProduct>;
const CATALOG = (catalogRaw as { products: (PbcProduct & { brand: string | null })[] }).products;

const EMPTY_METRICS: PaddleMetrics = {
  spinRpm: null,
  spinScore: null,
  spinCategory: null,
  spinDurabilityTier: null,
  swingWeight: null,
  swingScore: null,
  twistWeight: null,
  twistScore: null,
  balancePointCm: null,
  balanceScore: null,
  handSpeedIndex: null,
  serveSpeedMph: null,
  powerScore: null,
  punchVolleyMph: null,
  popScore: null,
  firepower: null,
  kewCor: null,
  deflectionLbs: null,
  tilt: null,
  tiltRaw: null,
};

const tight = (s: string) => s.toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9]+/g, "");

/** Pinned editorial URL beats the crawled product page beats the brand-page ladder. */
function shopHrefFor(row: PaddleRow, ed: Editorial, pbc: PbcProduct | null): string {
  return withUtm(pbcDestination(row.name, row.brand, null, ed.pbcUrl ?? pbc?.url), {
    campaign: "paddle-lab",
    content: "shop-cta",
    term: row.slug,
  });
}

function assemble(row: PaddleRow, pbc: PbcProduct | null, tested: boolean): Paddle {
  const editorial = EDITORIAL[row.slug] ?? {};
  const image = paddleImageFor(row.name);
  return {
    ...row,
    editorial,
    href: labHref(row.slug),
    shopHref: shopHrefFor(row, editorial, pbc),
    image,
    pbc,
    photo: image?.cutout ? null : (pbc?.image ?? null),
    displayPrice: pbc?.price ?? row.price,
    livePrice: pbc?.price != null,
    tested,
    soldOut: pbc?.availability === "oos",
  };
}

/* ---- Kew's tested paddles, with their PBC match when there is one ---- */

const tested: Paddle[] = (raw.paddles as PaddleRow[]).map((row) => assemble(row, PBC[row.slug] ?? null, true));

/* ---- Every other paddle Pickleball Central sells ---- */

/** Titles the matcher also skips: variants of a product, not products. */
const NOT_A_PRODUCT = /\b(used|bundle|demo|set of|cover)\b/i;

const matchedUrls = new Set(Object.values(PBC).map((p) => p.url));
const kewBrands = Array.from(new Set(tested.map((p) => p.brand))).sort((a, b) => tight(b).length - tight(a).length);
const takenSlugs = new Set(tested.map((p) => p.slug));

/**
 * Brand + model out of a PBC title. The brand is read against Kew's brand
 * list first so "Six Zero" and "SixZero" land in one bucket, then PBC's own
 * JSON-LD brand, then the first word. The model is what is left after the
 * brand, the thickness and the words "Pickleball Paddle".
 */
function splitTitle(title: string, jsonLdBrand: string | null): { brand: string; model: string; thicknessMm: number | null } {
  const mm = title.match(/\b(\d{1,2}(?:\.\d)?)\s?mm\b/i);
  const thicknessMm = mm ? Number(mm[1]) : null;
  const t = tight(title);
  let brand = kewBrands.find((b) => t.startsWith(tight(b))) ?? null;
  if (!brand && jsonLdBrand && t.startsWith(tight(jsonLdBrand))) brand = jsonLdBrand;
  if (!brand) brand = title.split(/\s+/)[0];
  let model = title
    .replace(/\b\d{1,2}(?:\.\d)?\s?mm\b/gi, " ")
    .replace(/\bpickleball\b/gi, " ")
    .replace(/\bpaddles?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Drop the brand prefix however PBC spelled it: compare on the tight form.
  const words = model.split(" ");
  let cut = 0;
  let acc = "";
  for (let i = 0; i < words.length; i++) {
    acc += tight(words[i]);
    if (acc === tight(brand)) {
      cut = i + 1;
      break;
    }
    if (!tight(brand).startsWith(acc)) break;
  }
  model = words.slice(cut).join(" ").trim() || model;
  return { brand, model, thicknessMm };
}

const shopOnly: Paddle[] = CATALOG.filter((p) => !matchedUrls.has(p.url) && !NOT_A_PRODUCT.test(p.title)).map((p) => {
  const { brand, model, thicknessMm } = splitTitle(p.title, p.brand);
  let slug = new URL(p.url).pathname.replace(/\/+$/, "").split("/").pop()!.replace(/-pickleball-paddle$/, "");
  if (takenSlugs.has(slug)) slug = `${slug}-pbc`;
  takenSlugs.add(slug);
  const row: PaddleRow = {
    slug,
    brand,
    model,
    name: `${brand} ${model}`,
    thicknessMm,
    price: p.price,
    condition: null,
    dateEntered: null,
    certification: "unknown",
    certificationRaw: null,
    warranty: null,
    shape: "Unknown",
    build: null,
    process: null,
    surfaceTexture: null,
    surfaceLayup: null,
    coreType: null,
    specs: { lengthIn: null, widthIn: null, handleLengthIn: null, staticWeightOz: null },
    metrics: EMPTY_METRICS,
  };
  const pbc: PbcProduct = { url: p.url, title: p.title, image: p.image, price: p.price, availability: p.availability, sku: p.sku };
  return assemble(row, pbc, false);
});

export const paddles: Paddle[] = [...tested, ...shopOnly].sort((a, b) => a.name.localeCompare(b.name));

const BY_SLUG = new Map(paddles.map((p) => [p.slug, p]));
export function paddleBySlug(slug: string): Paddle | null {
  return BY_SLUG.get(slug) ?? null;
}

export const paddleCount = paddles.length;
export const testedCount = tested.length;
export const shopOnlyCount = shopOnly.length;
export const photoCount = paddles.filter((p) => p.image?.cutout || p.photo).length;
export const buyableCount = paddles.filter((p) => p.pbc || p.editorial.pbcUrl).length;

export const brandList: { name: string; count: number }[] = Array.from(
  paddles.reduce((m, p) => m.set(p.brand, (m.get(p.brand) ?? 0) + 1), new Map<string, number>()),
)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** Brands with at least one tested paddle — the hero's "brands measured" number. */
export const testedBrandCount = new Set(tested.map((p) => p.brand)).size;

/** The lab's data credit line. The snapshot is the committed CSV, not a live read. */
export const DATA_SOURCE = {
  name: "John Kew Pickleball",
  url: "https://www.johnkewpickleball.com/paddle-database",
};

/* ---------------- metric definitions ---------------- */

export type MetricGroup = "performance" | "handling" | "physical";

export type MetricDef = {
  key: string;
  label: string;
  /** Column header in the compare table. */
  short: string;
  unit?: string;
  group: MetricGroup;
  /** Whether it makes sense to flag the highest value in a comparison. */
  highlightMax: boolean;
  /** One line, plain English, for tooltips. */
  hint: string;
  /** A paragraph for the How We Test glossary. */
  explain: string;
  value: (p: PaddleRow) => number | string | null;
  /** Kew's 0–100 scaled z-score, when he publishes one for this metric. */
  score?: (p: PaddleRow) => number | null;
  decimals?: number;
};

export const METRICS: MetricDef[] = [
  {
    key: "power",
    label: "Power",
    short: "Power",
    unit: "mph",
    group: "performance",
    highlightMax: true,
    hint: "Ball speed off a full swing. Higher means more pace on drives and serves.",
    explain:
      "Power is the speed of the ball leaving the paddle on a standardized full swing, in miles per hour. Two paddles swung the same way send the ball out at different speeds; this number captures that. It is the metric behind “this paddle hits hard.”",
    value: (p) => p.metrics.serveSpeedMph,
    score: (p) => p.metrics.powerScore,
    decimals: 1,
  },
  {
    key: "pop",
    label: "Pop",
    short: "Pop",
    unit: "mph",
    group: "performance",
    highlightMax: true,
    hint: "Ball speed off a short punch volley. Higher means more speed from a compact stroke.",
    explain:
      "Pop is the ball speed from a short, compact punch volley, the kind you hit at the kitchen line. It isolates how lively the face is without a full swing. A paddle can have high power and modest pop, or the reverse, which is why we show both.",
    value: (p) => p.metrics.punchVolleyMph,
    score: (p) => p.metrics.popScore,
    decimals: 1,
  },
  {
    key: "firepower",
    label: "Firepower",
    short: "Firepower",
    unit: "/100",
    group: "performance",
    highlightMax: true,
    hint: "John Kew's combined power-and-pop index, 0 to 100.",
    explain:
      "Firepower is a single 0–100 index that folds power and pop into one number. It is a convenience for quick sorting. When two paddles are close, look at power and pop separately.",
    value: (p) => p.metrics.firepower,
    decimals: 1,
  },
  {
    key: "spin",
    label: "Spin",
    short: "Spin",
    unit: "rpm",
    group: "performance",
    highlightMax: true,
    hint: "Ball rotation off the face, in revolutions per minute. Higher means more grip on the ball.",
    explain:
      "Spin is how many revolutions per minute the ball leaves the paddle with in a controlled spin test. A rougher, grippier face produces more. Spin category (Elite, Good, Fair, Poor) is the same number in buckets.",
    value: (p) => p.metrics.spinRpm,
    score: (p) => p.metrics.spinScore,
    decimals: 0,
  },
  {
    key: "spinDurability",
    label: "Spin Durability",
    short: "Spin Dur.",
    group: "performance",
    highlightMax: false,
    hint: "John Kew's tier for how the face texture holds up with wear. See How We Test.",
    explain:
      "Spin Durability is a tier for how well the surface keeps producing spin as it wears. Face textures fade at different rates, and some paddles lose a lot of spin within weeks. The tiers are John Kew's classification. We show the tier as published and do not re-rank it.",
    value: (p) => (p.metrics.spinDurabilityTier ? `Tier ${p.metrics.spinDurabilityTier}` : null),
  },
  {
    key: "kewCor",
    label: "KewCOR",
    short: "KewCOR",
    group: "performance",
    highlightMax: false,
    hint: "How much energy the face gives back to the ball, measured by John Kew. Higher is livelier.",
    explain:
      "KewCOR is John Kew's measurement of the face's coefficient of restitution: how much of the ball's energy comes back off the paddle. Higher is a livelier, more trampoline-like face. It is related to, but not the same as, the PBCOR limit the governing bodies test against for certification.",
    value: (p) => p.metrics.kewCor,
    decimals: 3,
  },
  {
    key: "swingWeight",
    label: "Swing Weight",
    short: "Swing Wt",
    group: "handling",
    highlightMax: false,
    hint: "How heavy the paddle feels when you swing it. Higher is more plow-through; lower is quicker.",
    explain:
      "Swing weight is how heavy the paddle feels in motion, which depends on where the mass sits, not just how much there is. A higher swing weight gives more stability and plow-through on drives; a lower one is faster to get around at the kitchen line. Neither end is better, which is why we never highlight a winner on it.",
    value: (p) => p.metrics.swingWeight,
    score: (p) => p.metrics.swingScore,
    decimals: 1,
  },
  {
    key: "twistWeight",
    label: "Twist Weight",
    short: "Twist Wt",
    group: "handling",
    highlightMax: true,
    hint: "Resistance to twisting on off-center hits. Higher means a more forgiving sweet spot.",
    explain:
      "Twist weight is how much the paddle resists rotating in your hand when you hit off-center. A higher twist weight means a bigger effective sweet spot and more forgiveness; a low one punishes mis-hits with a wobbly, dead response.",
    value: (p) => p.metrics.twistWeight,
    score: (p) => p.metrics.twistScore,
    decimals: 2,
  },
  {
    key: "balancePoint",
    label: "Balance Point",
    short: "Balance",
    unit: "cm",
    group: "handling",
    highlightMax: false,
    hint: "Distance from the butt of the handle to the balance point. Higher is more head-heavy.",
    explain:
      "Balance point is measured in centimetres from the end of the handle to where the paddle balances. A higher number is a more head-heavy paddle, which usually swings heavier for the same static weight. Lead tape or a heavier grip moves it.",
    value: (p) => p.metrics.balancePointCm,
    score: (p) => p.metrics.balanceScore,
    decimals: 1,
  },
  {
    key: "handSpeed",
    label: "Hand Speed",
    short: "Hand Speed",
    unit: "/100",
    group: "handling",
    highlightMax: true,
    hint: "John Kew's 0–100 index of how quick the paddle is to manoeuvre. Higher is quicker.",
    explain:
      "Hand Speed is a 0–100 index John Kew derives from the handling measurements to describe how quickly the paddle gets around in a fast exchange. It is the flip side of plow-through. Pick your side.",
    value: (p) => p.metrics.handSpeedIndex,
    decimals: 0,
  },
  {
    key: "deflection",
    label: "Face Stiffness",
    short: "Stiffness",
    unit: "lbs",
    group: "handling",
    highlightMax: false,
    hint: "Force needed to deflect the face in a stiffness test. Higher is a stiffer face.",
    explain:
      "Face stiffness is the force, in pounds, needed to deflect the paddle face by a set amount. A stiffer face feels crisper; a softer one feels plusher. Shown where John Kew has measured it.",
    value: (p) => p.metrics.deflectionLbs,
    decimals: 1,
  },
  {
    key: "staticWeight",
    label: "Static Weight",
    short: "Weight",
    unit: "oz",
    group: "physical",
    highlightMax: false,
    hint: "The paddle on a scale, in ounces.",
    explain:
      "Static weight is the paddle on a scale. It is the number on the box, and it says less about feel than swing weight does.",
    value: (p) => p.specs.staticWeightOz,
    decimals: 1,
  },
  {
    key: "thickness",
    label: "Core Thickness",
    short: "Core",
    unit: "mm",
    group: "physical",
    highlightMax: false,
    hint: "Core thickness in millimetres. Thicker is usually softer; thinner is livelier.",
    explain:
      "Core thickness in millimetres. 16 mm is the common “control” build and 14 mm the livelier one, though construction matters more than the number alone.",
    value: (p) => p.thicknessMm,
    decimals: 1,
  },
  {
    key: "length",
    label: "Length",
    short: "Length",
    unit: "in",
    group: "physical",
    highlightMax: false,
    hint: "Total length in inches.",
    explain: "Total paddle length in inches. Length plus width may not exceed 24 inches under the rules.",
    value: (p) => p.specs.lengthIn,
    decimals: 2,
  },
  {
    key: "width",
    label: "Width",
    short: "Width",
    unit: "in",
    group: "physical",
    highlightMax: false,
    hint: "Face width in inches.",
    explain: "Face width in inches. Widebody shapes trade length for width; elongated shapes do the reverse.",
    value: (p) => p.specs.widthIn,
    decimals: 2,
  },
  {
    key: "handle",
    label: "Handle Length",
    short: "Handle",
    unit: "in",
    group: "physical",
    highlightMax: false,
    hint: "Handle length in inches. Two-handed backhands want more.",
    explain: "Handle length in inches. Players with a two-handed backhand tend to want 5.5 inches or more.",
    value: (p) => p.specs.handleLengthIn,
    decimals: 2,
  },
];

export const METRIC_BY_KEY = new Map(METRICS.map((m) => [m.key, m]));

export function formatMetric(def: MetricDef, v: number | string | null): string {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  const n = def.decimals != null ? v.toFixed(def.decimals) : String(v);
  return def.unit && def.unit !== "/100" ? `${n} ${def.unit}` : n;
}

/* ---------------- lists the landing page needs ---------------- */

/** Newest entries by John's "Date Entered", for the 182 paddles that carry one. */
export function newestTested(n: number): Paddle[] {
  return tested
    .filter((p) => p.dateEntered)
    .sort((a, b) => (b.dateEntered! > a.dateEntered! ? 1 : b.dateEntered! < a.dateEntered! ? -1 : 0))
    .slice(0, n);
}

/** Editors' trending picks; falls back to newest tested so the rail never empties. */
export function trendingPaddles(n: number): { list: Paddle[]; curated: boolean } {
  const curated = paddles.filter((p) => p.editorial.trending);
  if (curated.length) return { list: curated.slice(0, n), curated: true };
  return { list: newestTested(n), curated: false };
}

export function withSkill(skill: Skill): Paddle[] {
  return paddles.filter((p) => p.editorial.skill?.includes(skill));
}

export const reviewedCount = paddles.filter((p) => p.editorial.review || p.editorial.summary).length;

/**
 * Paddles a reader might weigh against this one: same shape, same tilt when
 * known, nearest in price. For a shop-only paddle with no shape, same brand,
 * nearest in price. A selection rule for a "see also" rail — not a
 * recommendation, and no score is involved.
 */
export function similarPaddles(p: Paddle, n = 3): Paddle[] {
  const price = p.displayPrice ?? 0;
  const pool = p.tested
    ? paddles.filter((q) => q.slug !== p.slug && q.shape === p.shape && (!p.metrics.tilt || q.metrics.tilt === p.metrics.tilt))
    : paddles.filter((q) => q.slug !== p.slug && q.brand === p.brand);
  return pool
    .sort((a, b) => Math.abs((a.displayPrice ?? 0) - price) - Math.abs((b.displayPrice ?? 0) - price))
    .slice(0, n);
}

/* ---------------- the compact record client components receive ---------------- */

export function summarize(p: Paddle): PaddleSummary {
  return {
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    model: p.model,
    price: p.displayPrice,
    shape: p.shape,
    thicknessMm: p.thicknessMm,
    weightOz: p.specs.staticWeightOz,
    tilt: p.metrics.tilt,
    spinCategory: p.metrics.spinCategory,
    spinRpm: p.metrics.spinRpm,
    powerMph: p.metrics.serveSpeedMph,
    popMph: p.metrics.punchVolleyMph,
    swingWeight: p.metrics.swingWeight,
    twistWeight: p.metrics.twistWeight,
    certification: p.certification,
    skill: p.editorial.skill ?? [],
    dateEntered: p.dateEntered,
    summary: p.editorial.summary ?? null,
    image: p.image?.cutout ? p.image.src : null,
    photo: p.photo,
    tested: p.tested,
    soldOut: p.soldOut,
    href: p.href,
    shopHref: p.shopHref,
  };
}

export const summaries: PaddleSummary[] = paddles.map(summarize);

/** slug → display name, for the compare tray (which only knows slugs). */
export const nameBySlug: Record<string, string> = Object.fromEntries(paddles.map((p) => [p.slug, p.name]));

/* ---------------- athlete profile tie-in ---------------- */

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/\b(\d{1,2}(?:\.\d)?)\s?mm\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const BY_NORM = new Map<string, Paddle[]>();
for (const p of paddles) {
  const k = norm(p.name);
  BY_NORM.set(k, [...(BY_NORM.get(k) ?? []), p]);
}

/**
 * The lab record for the paddle string on a pro's profile, or null.
 *
 * The broadcast masterlist writes "Franklin C45 Hybrid 14MM" while John writes
 * "Franklin" + "C45 Hybrid" + 14; so match on brand+model with the thickness
 * stripped, then use the thickness to pick between builds. A tested record
 * wins over a shop-only one with the same name. Refuses when the name matches
 * more than one record and the thickness cannot settle it, because linking a
 * pro to the wrong build is worse than no link.
 */
export function labPaddleForName(paddle: string | null | undefined): Paddle | null {
  if (!paddle) return null;
  const first = paddle.split(",")[0];
  const mm = first.match(/\b(\d{1,2}(?:\.\d)?)\s?mm\b/i);
  let candidates = BY_NORM.get(norm(first)) ?? [];
  if (candidates.some((c) => c.tested)) candidates = candidates.filter((c) => c.tested);
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1 && mm) {
    const want = Number(mm[1]);
    const byMm = candidates.filter((c) => c.thicknessMm === want);
    if (byMm.length === 1) return byMm[0];
  }
  return null;
}
