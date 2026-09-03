/**
 * Paddle Lab pieces that are safe to import from a client component.
 *
 * ⚠ NOTHING IN HERE MAY IMPORT lib/data/paddles.json. That file is the whole
 * 468-paddle grid; a client component that reaches it through lib/paddle-lab.ts
 * ships every measurement to every visitor's browser on every lab page. Client
 * code gets a PaddleSummary[] as a prop from a server page and nothing more.
 */

export const LAB_PATH = "/paddle-lab";
export const labHref = (slug: string) => `${LAB_PATH}/${slug}`;
export const browseHref = (params?: Record<string, string>) => {
  const qs = params ? new URLSearchParams(params).toString() : "";
  return `${LAB_PATH}/paddles${qs ? `?${qs}` : ""}`;
};
export const compareHref = (slugs: string[]) =>
  slugs.length ? `${LAB_PATH}/compare?p=${slugs.join(",")}` : `${LAB_PATH}/compare`;
export const MAX_COMPARE = 4;

export type Shape = "Elongated" | "Hybrid" | "Widebody" | "Other";
export type Tilt = "power" | "balanced" | "pop";
export type Certification =
  | "usap"
  | "upa-a"
  | "dual"
  | "provisional"
  | "quiet-only"
  | "none"
  | "delisted"
  | "unknown";
export type Skill = "beginner" | "intermediate" | "advanced";

export const SHAPES: Shape[] = ["Elongated", "Hybrid", "Widebody", "Other"];
export const TILTS: Tilt[] = ["power", "balanced", "pop"];
export const SKILLS: Skill[] = ["beginner", "intermediate", "advanced"];
export const SPIN_CATEGORIES = ["Elite", "Good", "Fair", "Poor"];

export const TILT_LABEL: Record<Tilt, string> = {
  power: "Power-leaning",
  balanced: "Balanced",
  pop: "Pop-leaning",
};

export const CERT_LABEL: Record<Certification, string> = {
  usap: "USAP certified",
  "upa-a": "UPA-A certified",
  dual: "USAP + UPA-A certified",
  provisional: "UPA-A provisional",
  "quiet-only": "USAP quiet-approved only",
  none: "Not certified",
  delisted: "Delisted",
  unknown: "Certification unknown",
};

export const SKILL_LABEL: Record<Skill, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function formatPrice(p: number | null): string | null {
  if (p == null) return null;
  return p % 1 === 0 ? `$${p}` : `$${p.toFixed(2)}`;
}

/** The compact record a client component receives. Enough to filter, sort and draw a card. */
export type PaddleSummary = {
  slug: string;
  name: string;
  brand: string;
  model: string;
  price: number | null;
  shape: Shape;
  thicknessMm: number | null;
  weightOz: number | null;
  tilt: Tilt | null;
  spinCategory: string | null;
  spinRpm: number | null;
  powerMph: number | null;
  popMph: number | null;
  swingWeight: number | null;
  twistWeight: number | null;
  certification: Certification;
  skill: Skill[];
  dateEntered: string | null;
  summary: string | null;
  /** A curated transparent cut-out, when we have one. Null renders the brand tile. */
  image: string | null;
  href: string;
  shopHref: string;
};

export function matchesQuery(p: { name: string; brand: string }, q: string): boolean {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  const hay = `${p.brand} ${p.name}`.toLowerCase();
  return query.split(/\s+/).every((t) => hay.includes(t));
}

/* Filter buckets. UI groupings, not measurements. */

export const PRICE_BANDS = [
  { key: "under-100", label: "Under $100", test: (p: number) => p < 100 },
  { key: "100-150", label: "$100 – $150", test: (p: number) => p >= 100 && p < 150 },
  { key: "150-200", label: "$150 – $200", test: (p: number) => p >= 150 && p < 200 },
  { key: "200-plus", label: "$200 and up", test: (p: number) => p >= 200 },
] as const;

export const WEIGHT_BANDS = [
  { key: "light", label: "Light (under 7.8 oz)", test: (w: number) => w < 7.8 },
  { key: "mid", label: "Mid (7.8 – 8.2 oz)", test: (w: number) => w >= 7.8 && w <= 8.2 },
  { key: "heavy", label: "Heavy (over 8.2 oz)", test: (w: number) => w > 8.2 },
] as const;

export const THICKNESS_BANDS = [
  { key: "14", label: "14 mm and thinner", test: (t: number) => t <= 14.5 },
  { key: "16", label: "16 mm", test: (t: number) => t > 14.5 && t <= 16.5 },
  { key: "thick", label: "Thicker than 16 mm", test: (t: number) => t > 16.5 },
] as const;
