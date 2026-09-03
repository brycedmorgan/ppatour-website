/**
 * What the pros play, grouped by brand — for the Paddle Lab landing page.
 *
 * SOURCE: the event team's broadcast masterlist, via lib/data/athlete-paddles.json
 * (see lib/athlete-paddles.ts for why that file and nothing else). 96 pros carry
 * a paddle there. Counting them per brand is the whole computation; no ranking,
 * no weighting, and a pro who is not in the masterlist is not counted.
 *
 * The brand is read off the front of the paddle string against the lab's own
 * brand list, longest match first ("Six Zero" beats "Six"). A paddle whose
 * string resolves to exactly one lab record links to its lab page; otherwise
 * the model is named without a link (labPaddleForName refuses ambiguity).
 */
import raw from "@/lib/data/athlete-paddles.json";
import { brandList, labPaddleForName, type Paddle } from "@/lib/paddle-lab";

type MasterRow = { paddle: string; name: string };

export type ProPick = { slug: string; name: string; paddle: string; lab: Paddle | null };
export type BrandPros = {
  brand: string;
  /** True when the lab knows this brand, so the browse link is real. */
  inLab: boolean;
  pros: ProPick[];
  models: { label: string; lab: Paddle | null; count: number }[];
};

const tight = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

const LAB_BRANDS = brandList.map((b) => b.name).sort((a, b) => tight(b).length - tight(a).length);

function brandOf(paddle: string): { brand: string; inLab: boolean } {
  const t = tight(paddle);
  const hit = LAB_BRANDS.find((b) => t.startsWith(tight(b)));
  if (hit) return { brand: hit, inLab: true };
  return { brand: paddle.split(/\s+/)[0], inLab: false };
}

/** Model label without the brand prefix and thickness, for the brand card. */
function modelLabel(paddle: string, brand: string): string {
  const first = paddle.split(",")[0].trim();
  const stripped = first.replace(/\b\d{1,2}(?:\.\d)?\s?mm\b/i, "").trim();
  return tight(stripped).startsWith(tight(brand)) && stripped.length > brand.length
    ? stripped.slice(brand.length).replace(/^[\s-]+/, "") || stripped
    : stripped;
}

let cache: BrandPros[] | null = null;

export function prosByBrand(): BrandPros[] {
  if (cache) return cache;
  const rows = raw as Record<string, MasterRow>;
  const seen = new Set<string>();
  const byBrand = new Map<string, BrandPros>();

  for (const [slug, row] of Object.entries(rows)) {
    // Aliased pros are written under two slugs; count the person once.
    if (seen.has(row.name)) continue;
    seen.add(row.name);
    const { brand, inLab } = brandOf(row.paddle);
    const lab = labPaddleForName(row.paddle);
    const entry = byBrand.get(brand) ?? { brand, inLab, pros: [], models: [] };
    entry.pros.push({ slug, name: row.name, paddle: row.paddle, lab });
    const label = lab ? lab.model : modelLabel(row.paddle, brand);
    const key = tight(label);
    const m = entry.models.find((x) => tight(x.label) === key);
    if (m) m.count++;
    else entry.models.push({ label, lab, count: 1 });
    byBrand.set(brand, entry);
  }

  cache = Array.from(byBrand.values())
    .map((b) => ({
      ...b,
      pros: b.pros.sort((x, y) => x.name.localeCompare(y.name)),
      models: b.models.sort((x, y) => y.count - x.count || x.label.localeCompare(y.label)),
    }))
    .sort((a, b) => b.pros.length - a.pros.length || a.brand.localeCompare(b.brand));
  return cache;
}

export const prosWithPaddle = new Set(Object.values(raw as Record<string, MasterRow>).map((r) => r.name)).size;
