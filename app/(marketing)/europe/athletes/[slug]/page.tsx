import type { Metadata } from "next";
import { AthleteProfile, athleteMetadata } from "@/app/athletes/[slug]/profile";
import { europeRoster } from "@/lib/europe-roster";

/**
 * A Europe pro's profile inside the Europe chrome (Payton Pemberton, 9/22:
 * "When you click on a player's profile, it brings us to the Carvana site").
 *
 * ⚠ THIS IS A MOUNT, NOT A SECOND PROFILE. Same component as /athletes/[slug],
 * same data, and its canonical points at /athletes/[slug] — so a search engine
 * still sees one page per athlete (the duplicate-profile rule in
 * lib/europe-roster.ts). The Europe layout above swaps the header and footer;
 * `region="europe"` swaps what the page links out to.
 *
 * Only the signed Europe roster prerenders. Any other slug still renders on
 * demand, so a link here never 404s.
 */

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 86400;
export const fetchCache = "default-cache";
// Same reason as /athletes/[slug]: pins prerendering against 429 retries.
export const dynamic = "force-static";

export function generateStaticParams() {
  return europeRoster.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return athleteMetadata(slug, "europe");
}

export default async function EuropeAthletePage({ params }: Params) {
  const { slug } = await params;
  return <AthleteProfile slug={slug} region="europe" />;
}
