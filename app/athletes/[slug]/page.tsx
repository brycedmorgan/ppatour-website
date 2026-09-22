import type { Metadata } from "next";
import { AthleteProfile, athleteMetadata, athleteStaticParams } from "./profile";

/*
 * The profile itself lives in ./profile.tsx so /europe/athletes/[slug] can
 * mount the same page inside the Europe chrome. Only the route segment config
 * stays here — Next reads it statically from the page file.
 */

type Params = { params: Promise<{ slug: string }> };

/**
 * ⚠ WITHOUT THIS, THE ~20 ATHLETES THAT DO NOT PRERENDER RE-RENDER ON EVERY
 * SINGLE REQUEST, AND THEY ARE THE MOST-VISITED PAGES ON THE SITE (9/5).
 * Measured on production: /athletes/ben-johns returned `X-Vercel-Cache: MISS`
 * with `Age: 0` on three consecutive requests, taking 18.8s, 17.4s and 30.0s —
 * nothing cached, nothing shared, a full render each time. Meanwhile
 * dj-young, joel-poland and tyson-mcguffin served as PRERENDER in ~0.3s.
 *
 * A render costs roughly sixteen upstream calls (ten board pages via
 * {@link getWprPlayerBySlug}/{@link getRankingBySlug}, six division boards),
 * so a handful of popular players generated essentially all of it: Vercel
 * attributed 6.1K of the 6.7K `partner_rankings` calls in one hour to this
 * route, at a 2.1% error rate — succeeding calls, pure volume.
 *
 * ⚠ THE SPLIT IS NOT RANDOM: the slow ones are the pros in the CURATED roster
 * (`lib/athletes.ts`), which render more — hero, gear, videos — and so are the
 * expensive pages to build. They are in `generateStaticParams` and still do not
 * come out of the build prerendered, which is worth a look at a build log on
 * its own. This does not fix that; it makes it stop mattering.
 *
 * ⚠ AND IT IS 24h ON PURPOSE, NOT MINUTES. The 8/22 note rejected adding
 * `revalidate` here, and the concern was real — 1,100+ pages, and the daily
 * cron exists so mass regeneration never walks into the partner API's rate
 * limit. A DAILY window is exactly the cadence that cron already runs at, and
 * matches the 24h Data Cache the ranking boards use, so it adds no regeneration
 * pressure that was not already there. What it removes is a page rendering
 * itself from scratch several times a minute.
 *
 * Live data does not go stale for a day: `revalidateTag(ATHLETES_CACHE_TAG)`
 * still drops these pages the moment Jackalope saves a player, and the cron
 * still refreshes them every morning.
 */
export const revalidate = 86400;

/**
 * ⚠ THIS IS WHAT KEEPS AN ATHLETE PAGE FROM COSTING ~16 UPSTREAM CALLS EVERY
 * TIME IT RENDERS (9/5). This route was the single biggest consumer of the
 * partner API — measured on Vercel: 6.1K of the 6.7K `partner_rankings` calls
 * in one hour came from `/athletes/[slug]`, and a cache MISS on this page took
 * 9.0s to render, which is what ten board pages plus six division boards cost
 * when none of them are cached.
 *
 * The cause is `params`. Next lists it as a Request-time API, and under the
 * DEFAULT `fetchCache: "auto"` Next "will not cache fetch requests that are
 * discovered AFTER Request-time APIs are used". Every data call on this page
 * happens after `await params`, so the `revalidate` + `tags` that
 * `lib/rankings-api.ts`, `lib/division-rankings.ts` and `lib/athlete-stats.ts`
 * all carefully pass were being ignored. The `generateStaticParams` exemption
 * covers PRERENDERING; it does not help a page rendered on demand, which is
 * every athlete not in the prerendered set and every page whose cached HTML has
 * since been evicted or revalidated.
 *
 * `default-cache` is documented for exactly this: it means "even fetch requests
 * after Request-time APIs are considered static", so each call's own options
 * apply again. It does NOT make the page static — rendering is unchanged.
 *
 * ⚠ AND IT IS DELIBERATELY NOT `export const revalidate`. That was considered
 * and rejected on 8/22 for a reason that still holds: there are 1,100+ pages
 * here and the daily cron exists so mass regeneration never walks into the
 * partner API's rate limit. The problem was never how OFTEN this page
 * re-renders, it was how much a single re-render cost.
 */
export const fetchCache = "default-cache";

/**
 * ⚠ `force-static` IS WHAT ACTUALLY MAKES THESE PAGES PRERENDER, AND WITHOUT IT
 * THE PRERENDERED SET IS NON-DETERMINISTIC. Measured 9/15 on three builds of
 * identical code: `generateStaticParams` asked for 219 paths and the build
 * emitted 140, then 204, then 169. Membership moved between runs — Ben Johns
 * prerendered in the first and not the second, Kate Fahey the reverse.
 *
 * THE CAUSE IS THE 429 RETRY IN lib/pb-fetch.ts. Its retries deliberately go
 * `cache: "no-store"` so a rate-limit blip can't land in the Data Cache — and a
 * single no-store fetch during render opts that page out of static generation.
 * `partner_rankings` rate-limits under exactly this load (219 athlete pages,
 * ~16 upstream calls each), so whether any given pro prerendered came down to
 * whether upstream throttled us while that page was building. The build log
 * says nothing: the code catches the error and renders fine.
 *
 * ⚠ AND THIS IS THE SAME BUG /rankings HAD ON 8/3, with the same fix and the
 * same 30-second symptom. See the note on `dynamic` in app/rankings/page.tsx.
 * A pro who loses the race renders on demand at 15–42s, which is what made the
 * Waters and Johns cards on /athletes read as broken links rather than slow
 * pages — a client-side navigation shows nothing at all while it waits.
 *
 * force-static pins the intent instead of hoping the build wins the race. This
 * page reads no cookies, headers or searchParams, so nothing is lost by it;
 * `permanentRedirect` for duplicate scrape slugs and the `redirect` fallback
 * are both fine under static generation, and `dynamicParams` stays default so a
 * slug that is not in `generateStaticParams` still renders on demand.
 */
export const dynamic = "force-static";

export async function generateStaticParams() {
  return athleteStaticParams();
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return athleteMetadata(slug);
}

export default async function AthletePage({ params }: Params) {
  const { slug } = await params;
  return <AthleteProfile slug={slug} />;
}
