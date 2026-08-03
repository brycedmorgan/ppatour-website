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

export default function Home() {
  return <HomeContent />;
}
