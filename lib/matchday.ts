/**
 * MATCHDAY app store links.
 *
 * ⚠ WHY THIS FILE EXISTS: every MATCHDAY link on the site used to point at
 * `matchday.app`, which is now PARKED — it serves a ParkLogic ad router with no
 * pickleball content at all. It was live in four places (the Watch page CTA,
 * event pages, NationalsLive, and the site-wide footer) and a link crawl never
 * caught it, because the parked page returns HTTP 200. Reported by Dave Fleming,
 * 29 Jul: "MATCHDAY 'Get the App' goes to the wrong place."
 *
 * Both destinations below are verified against the official store APIs:
 *   · iOS      itunes lookup id6755119460 -> "MATCHDAY by Pickleball Inc."
 *              seller Christopher Cantino, bundleId com.cc.pbpulse.app
 *   · Android  play listing com.cc.pbpulse.app -> "MATCHDAY by Pickleball Inc."
 *
 * ⚠ DO NOT guess the Android package. `com.matchday.app` is the obvious guess,
 * returns 200 on Google Play, and is an unrelated app called "FMD" — using it
 * would have recreated the same wrong-destination bug. The real package was only
 * findable via the iOS bundleId.
 *
 * The app's own landing page is pblfg.com. Not linked: the domain means nothing
 * to a fan and it is a client-rendered SPA that can sit on a "Tap Retry" state.
 */
import { withUtm } from "@/lib/utm";

const APP_STORE = "https://apps.apple.com/us/app/matchday-by-pickleball-inc/id6755119460";
const PLAY_STORE = "https://play.google.com/store/apps/details?id=com.cc.pbpulse.app";

/** Store links, UTM-tagged per placement so app installs stay attributable. */
export function matchdayLinks(content: string): { ios: string; android: string } {
  return {
    ios: withUtm(APP_STORE, { campaign: "matchday", content: `${content}-ios` }),
    android: withUtm(PLAY_STORE, { campaign: "matchday", content: `${content}-android` }),
  };
}

/**
 * Single link for compact slots that only have room for one. Points at iOS —
 * both are correct, and this one is the platform the app shipped on first
 * (Nov 2025). Prefer `matchdayLinks()` and show both wherever there is room.
 */
export function matchdayPrimary(content: string): string {
  return withUtm(APP_STORE, { campaign: "matchday", content });
}
