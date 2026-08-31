import type { Metadata } from "next";
import { HomeContent } from "@/components/home/HomeContent";
import { PromoModal } from "@/components/global/PromoModal";
import { homePromo } from "@/lib/site-promo";
import { SITE_URL } from "@/lib/site";

/**
 * ⚠ Homepage canonical must be pinned ABSOLUTELY.
 *
 * The root layout sets a self-referencing `alternates: { canonical: "./" }` for
 * every page. That relative "./" resolves correctly on every route EXCEPT the
 * index: on `/` Next resolved it to `https://www.ppatour.com/index/` — a URL
 * that also returns 200, so we were telling Google the canonical version of our
 * single most-trafficked page was a duplicate that nobody links to. Overriding
 * it here with the absolute site root is the one-line fix; every other page
 * keeps inheriting the layout default.
 */
export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

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
 * ⚠ AND THIS NUMBER IS NOW LOAD-BEARING, NOT JUST A CACHE KNOB. The homepage
 * derives its own live state from the calendar (HomeContent's `isLive`), so this
 * is the resolution of that flip: at first serve the client countdown can read
 * zero up to 60 seconds before the server-rendered shell swaps to LIVE NOW, and
 * the same lag applies when the final day ends and the page returns to
 * Next-Event mode. A longer window is a longer stretch of a stale homepage on the
 * two mornings of the season anyone is watching it.
 */

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
  /* One dismissible promo for the tour's featured on-site happening. Resolves
     to null between promos. Nothing renders server-side even when it is set —
     see PromoModal for why the expiry has to be read off the device clock
     rather than baked into this force-static page. */
  const promo = homePromo();
  return (
    <>
      <HomeContent />
      {promo && <PromoModal promo={promo} />}
    </>
  );
}
