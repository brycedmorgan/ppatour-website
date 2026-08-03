import { HomeContent } from "@/components/home/HomeContent";

/**
 * ISR. Homepage. The live score rail and countdown are client-polled, so a 60s
 * shell is not stale in any way a visitor can see.
 *
 * Before this, every live-data page was rendered per request and served
 * `cache-control: private, no-store` with `x-vercel-cache: MISS` — nothing
 * reached the edge cache. /rankings was measured at a 34.8s TTFB on one pull
 * with zero traffic. Data was already cached (lib/pb-fetch tags its fetches);
 * what was uncached was the HTML.
 */
export const revalidate = 60;

/**
 * ⚠ Same story as /rankings: this built Static locally and **Dynamic in
 * production** (`ƒ /` in the Vercel build log). With `PB_API_TOKEN` present the
 * rankings fetch really runs, and a 429 retry inside `lib/pb-fetch` uses
 * `cache: "no-store"`, which opts the whole route out of static generation.
 * So whether the HOMEPAGE was CDN-cacheable depended on whether the partner
 * API throttled us mid-build.
 *
 * Nothing here reads cookies, headers or searchParams on the server — the
 * ticker, countdown and sticky buy bar are all client components that poll
 * their own CDN-cached endpoints — so pinning it costs nothing and the 60s
 * shell is not stale in any way a visitor can see.
 */
export const dynamic = "force-static";

export default function Home() {
  return <HomeContent />;
}
