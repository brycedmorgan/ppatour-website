import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";
import { permanentRedirect, redirect } from "next/navigation";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { resolveAthleteSlugs } from "@/lib/athlete-slugs";
import { athletes, getAthlete } from "@/lib/athletes";
import {
  ageFromDob,
  getPublishedAthlete,
  publishedAthletes,
  turnedProYear,
} from "@/lib/published-athletes";
import {
  curatedSlugFor,
  getRankingBySlug,
  getWprPlayerBySlug,
  getWprRoster,
} from "@/lib/rankings-api";
import { getAthleteStats } from "@/lib/athlete-stats";
import { reconcileBio } from "@/lib/bio-live";
import { getDivisionRanks } from "@/lib/division-rankings";
import { getAthleteVideoData } from "@/lib/athlete-videos";
import { AthleteVideos } from "@/components/athletes/AthleteVideos";
import { FollowButton } from "@/components/app/FollowButton";
import { FollowChip } from "@/components/app/FollowChip";
import { resolveGear } from "@/lib/athlete-gear";
import { paddleImageFor } from "@/lib/paddle-images";
import { athleteHeroFor } from "@/lib/athlete-heroes";
import { playerOverrideFor } from "@/lib/player-overrides";
import { socialLinks } from "@/lib/social-links";
import { paddleFor } from "@/lib/athlete-paddles";
import { labPaddleForName } from "@/lib/paddle-lab";
import { LabStatsMini } from "@/components/paddle-lab/LabStatsMini";
import { paddleUpdateFor } from "@/lib/paddle-updates";
import { breadcrumbJsonLd } from "@/lib/breadcrumbs";

/**
 * Equipment is back ON, now that it has a source worth publishing (Wesley,
 * 8/5). It was switched off earlier the same day because the only paddle data
 * the site had was the 2024 profile scrape.
 *
 * ⚠ THE REAL GATE IS NOW THE DATA, NOT THIS FLAG. A pro shows a paddle only if
 * the event team's broadcast masterlist lists them — 88 of our 180 profiles
 * are not in it and correctly render no equipment anywhere on the page. See
 * `lib/athlete-paddles.ts`; in particular, do NOT reintroduce the old
 * `quickInfo.paddle` fallback, which is the stale data this replaced.
 *
 * The page now publishes a pro's paddle in ONE place — the "In the Bag" callout
 * under Quick Info (8/13). It used to also print a "Paddle" row inside Quick
 * Info itself, which is why this flag exists in two spots historically; see the
 * note in `quickFacts`. Flipping this to `false` still hides equipment
 * site-wide if that is ever wanted again, and it is also read by
 * `generateMetadata` so the paddle drops out of the search snippet with it.
 */
const SHOW_EQUIPMENT: boolean = true;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const roster = await getWprRoster().catch(() => []);
  // A scraped slug the board says duplicates another profile mints no page of
  // its own — it redirects to the canonical one instead (see the page body).
  const { toCanonical } = await resolveAthleteSlugs().catch(() => ({
    toCanonical: {} as Record<string, string>,
  }));
  const slugs = new Set(athletes.map((a) => a.slug));
  // Every published profile gets a page (keyed by its canonical slug, unless we
  // have a curated shorthand that collapses to the same person).
  for (const p of publishedAthletes) {
    const canonical = toCanonical[p.slug] ?? p.slug;
    slugs.add(curatedSlugFor(canonical) ?? canonical);
  }
  for (const p of roster) slugs.add(curatedSlugFor(p.slug) ?? p.slug);
  return [...slugs].map((slug) => ({ slug }));
}

function genderFromDivisions(divisions: string[]): "male" | "female" | undefined {
  if (divisions.some((d) => d.startsWith("Women"))) return "female";
  if (divisions.some((d) => d.startsWith("Men"))) return "male";
  return undefined;
}

/**
 * Merge the live WPR record (rank/points/gender/headshot) with the published
 * profile (bio, quick facts, divisions) and, for top pros, our curated data
 * (local headshot + tagline). Any one source alone is enough to render a page.
 */
async function loadAthlete(slug: string) {
  const curated = getAthlete(slug);
  /**
   * The scrape can key a profile under a duplicate slug the board doesn't use
   * (WordPress `-2` posts). When it does, the canonical page still reads that
   * record's bio and quick facts, so the surviving profile is the complete one
   * — bio AND live rank — rather than one of two half-pages.
   */
  const { publishedKeyFor } = await resolveAthleteSlugs();
  const published = getPublishedAthlete(slug) ?? getPublishedAthlete(publishedKeyFor[slug] ?? "");
  const api = await getWprPlayerBySlug(slug);
  if (!curated && !published && !api) return null;

  const name = curated?.name ?? published?.name ?? api!.name;
  const divisions = published?.divisions.length
    ? published.divisions
    : (curated?.divisions ?? []);
  const bio: string[] = published?.bio.length
    ? published.bio
    : [
        curated?.bio ??
          `${name} is a professional pickleball player ranked among the world's best in the Carvana PPA Tour's World Pickleball Rankings.`,
      ];

  return {
    slug,
    name,
    headshot: curated?.headshot ?? api?.headshot ?? "",
    country: published?.country || curated?.country || api?.country || "",
    countryCode: api?.countryCode || published?.countryCode || "",
    // NEVER fall back to curated.bestRank here. That field is a hand-maintained
    // career-best from May and is stale for 31 of our 40 curated pros (Andre
    // Mercado reads #10, he's live #108) — falling back to it renders a
    // career-best under a "World Rank" label, which is Connor's 7/29 "rankings
    // different on different pages". No live rank → show a dash.
    rank: api?.rank ?? 0,
    points: api?.points ?? 0,
    gender: api?.gender ?? genderFromDivisions(divisions),
    divisions,
    tagline:
      curated?.tagline ??
      published?.headline ??
      "Professional pickleball player on the Carvana PPA Tour.",
    bio,
    quickInfo: published?.quickInfo ?? null,
    turnedPro: published ? turnedProYear(published) : null,
    age: published ? ageFromDob(published.quickInfo.dob) : null,
    sourceUrl: published?.sourceUrl ?? null,
  };
}

/**
 * Search/social description for a pro, from sourced facts only.
 *
 * The bio's opening sentence is real content from the athlete feed, so it is
 * preferred. 165 of 180 profiles have one; the rest fall back to a line built
 * from divisions and country. Deliberately not the tagline — see the hero.
 */
function athleteDescription(a: {
  name: string;
  bio: string[];
  divisions: string[];
  country: string;
}): string {
  const opening = a.bio
    .join(" ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    // Skip the "Name: Professional Pickleball Player on the PPA Tour" header
    // some feed bios lead with — it is a title, not a sentence.
    .find((s) => s.length > 40 && !/^[^.]{0,40}:\s/.test(s));
  if (opening) return opening.length > 300 ? `${opening.slice(0, 297)}…` : opening;

  const divisions = a.divisions.length ? ` Competes in ${a.divisions.join(", ")}.` : "";
  const country = a.country ? ` ${a.country}.` : "";
  return `${a.name} is a professional pickleball player on the Carvana PPA Tour.${divisions}${country}`.trim();
}

/**
 * The <title>. This is the single biggest lever on an athlete page, and until
 * 8/20 it was `%s · Carvana PPA Tour` — "Ben Johns · Carvana PPA Tour", 28
 * characters that say nothing a searcher typed. Wikipedia outranks us on our
 * own athletes' names, and a title with no descriptive modifiers is one reason:
 * it gives Google nothing to match beyond the name itself, which Wikipedia also
 * has and has more authority behind.
 *
 * So the title now states what the page is AND what the person is, using facts
 * we already hold and already render:
 *
 *   Ben Johns — World No. 1 Men's Pickleball Player · Carvana PPA Tour
 *   Kate Fahey — No. 8 Ranked Women's Pickleball Player · Carvana PPA Tour
 *   Zane Navratil — Pro Pickleball Player, Ranking & Stats · Carvana PPA Tour
 *
 * ⚠ FACTS ONLY, and the rank is the LIVE board rank — the same number the hero
 * chip prints. It must never come from `curated.bestRank` (a stale hand-kept
 * career best; see `loadAthlete`), or the title claims a ranking the page below
 * it contradicts.
 *
 * ⚠ Length is deliberate. Google renders roughly 600px / ~60 characters, and
 * the brand suffix is the part designed to be cut — the name and the descriptor
 * both land inside the visible width. Do not add more keywords here; a longer
 * title is not a better one, and a stuffed one gets rewritten by Google
 * outright.
 *
 * Top 10 gets the number because "No. 3 ranked" is a claim worth making in a
 * SERP. Below that the rank moves too often to be worth churning the title over,
 * so those pages sell the page's contents instead.
 */
function athleteTitle(a: {
  name: string;
  rank: number;
  gender?: "male" | "female";
}): string {
  const board = a.gender === "female" ? "Women's " : a.gender === "male" ? "Men's " : "";
  const descriptor =
    a.rank === 1
      ? `World No. 1 ${board}Pickleball Player`
      : a.rank > 1 && a.rank <= 10
        ? `No. ${a.rank} Ranked ${board}Pickleball Player`
        : a.rank > 10
          ? "Pro Pickleball Player, Ranking & Stats"
          : "Pro Pickleball Player Profile";
  return `${a.name} — ${descriptor} · Carvana PPA Tour`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = await loadAthlete(slug);
  if (!a) return { title: "Athlete" };
  /**
   * Built from facts rather than the tagline. The taglines were pulled from the
   * page as "odd and incorrect" (see the hero), and a meta description is just
   * as public — it is what Google and every social card show. Prefers the real
   * sourced bio, falls back to divisions and country.
   */
  let description = athleteDescription(a);
  /**
   * Append the paddle when we know it and it fits.
   *
   * "What paddle does <pro> use" is a real search, and the meta description is
   * the snippet Google shows against it — the fact belongs in the snippet, not
   * only in the page body. Same source as the In the Bag callout, so the two
   * cannot disagree. Skipped when the bio sentence is already long, rather than
   * truncating a sourced sentence to make room for it.
   */
  if (SHOW_EQUIPMENT) {
    const override = await playerOverrideFor(a.name);
    const known = override?.paddle ?? paddleFor(slug)?.paddle ?? null;
    // Same pending-update layer the page body uses, or the snippet would name
    // the old paddle under a page that names the new one.
    const paddle = paddleUpdateFor(slug, known)?.paddle ?? known;
    const line = paddle ? ` Plays the ${paddle}.` : "";
    if (line && description.length + line.length <= 300) description += line;
  }
  const images = a.headshot ? [a.headshot] : [];
  /**
   * `absolute` — this title carries its own brand suffix, so it must NOT also
   * get the root layout's `%s · Carvana PPA Tour` template appended.
   */
  const title = athleteTitle(a);
  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      images,
    },
    twitter: { card: "summary_large_image", images },
  };
}

export default async function AthletePage({ params }: Params) {
  const { slug } = await params;
  /**
   * A duplicate profile URL never renders — it forwards to the canonical one,
   * so one athlete is one page and inbound links to the duplicate keep working.
   * The four known WordPress duplicates are 301'd in next.config (they were
   * live URLs); this catches any the next scrape introduces.
   */
  const { toCanonical } = await resolveAthleteSlugs();
  if (toCanonical[slug]) permanentRedirect(`/athletes/${toCanonical[slug]}`);

  const a = await loadAthlete(slug);
  /**
   * Unknown slug → the roster index, not a 404. `loadAthlete` only returns null
   * when the curated roster, the published profiles, AND the live WPR feed all
   * have nothing, so this is a genuinely unpublished player.
   *
   * Why redirect: the old WordPress site had 218 athlete entries against the 180
   * published here, and the migrated blog archive links players we don't carry
   * (Sam Querrey, Quang Duong…). Inbound traffic from Google's index of the old
   * site and from old bookmarks lands on those URLs, and the roster is a more
   * useful destination than a dead end.
   */
  if (!a) redirect("/athletes");

  // Live stats from the player API (career podium finishes, bio facts) +
  // per-division World Pickleball rankings. Null/empty when the API is
  // unavailable — the stats section simply hides.
  const stats = await getAthleteStats(slug);

  /**
   * Bio passthrough — reconcile the scraped prose against the live medals feed
   * before it renders. The stat rail immediately above the bio is live, so
   * without this the two disagree on the same screen: Ben Johns read "188
   * Career Titles" over "123+ PPA Tour titles … As of 2024". Substitution only;
   * see lib/bio-live.ts for why streaks and partner counts are left alone.
   */
  const bioParagraphs = reconcileBio(a.bio, stats).paragraphs;
  const divRanks = await getDivisionRanks(
    slug,
    a.gender === "male" || a.gender === "female" ? a.gender : null,
  );
  const videoData = await getAthleteVideoData(slug, a.name);

  const boardLabel =
    a.gender === "female" ? "Women's" : a.gender === "male" ? "Men's" : null;
  /**
   * The "More Pros" links (8/20 rewrite).
   *
   * This used to be `athletes.slice(0, 4)` — the SAME four curated pros on all
   * 179 profiles. As internal linking that is close to worthless: 179 pages
   * pointing at four, no page reachable from any other, and nothing that tells
   * a crawler these people are related. It is also the surface Google uses to
   * work out that /athletes/* is a connected roster rather than 179 orphans.
   *
   * Now it is the pros ranked immediately either side of this one on their own
   * board — a contextual, unique set per page, and a genuine "next/previous"
   * signal. Falls back to the top of the board for an unranked pro, and to the
   * old curated four if the live board is unavailable, so the section never
   * renders empty.
   */
  const boardRoster = await getWprRoster().catch(() => []);
  const others = ((): { slug: string; name: string; headshot: string }[] => {
    const board = boardRoster
      .filter((p) => p.gender === a.gender && p.rank > 0 && p.headshot)
      .sort((x, y) => x.rank - y.rank);
    const i = board.findIndex((p) => p.slug === a.slug);
    /**
     * Two above and two below — a five-wide window that SLIDES to the board
     * edges, so the world No. 1 gets four links (Nos. 2–5) rather than the two
     * that sit above her. Take five, drop this player, keep four.
     */
    const start = Math.max(0, Math.min(i - 2, board.length - 5));
    const picks =
      i < 0
        ? board.slice(0, 4)
        : board.slice(start, start + 5).filter((p) => p.slug !== a.slug).slice(0, 4);
    if (picks.length) {
      return picks.map((p) => ({
        slug: curatedSlugFor(p.slug) ?? p.slug,
        name: p.name,
        headshot: p.headshot!,
      }));
    }
    return athletes.filter((x) => x.slug !== a.slug).slice(0, 4);
  })();
  // Live WPR rank for the "More Pros" cards. One cached board fetch serves every
  // slug — see the note on `bestRank` in lib/athletes.ts for why we can't use it.
  const liveRanks = await getRankingBySlug();
  /**
   * Single source for "does this player have video" — read by the hero CTA and
   * by the Highlights section itself, so the button can never point at a section
   * that isn't rendered.
   */
  const highlights = videoData && videoData.videos.length > 0 ? videoData : null;
  const flag = a.countryCode
    ? `https://cdn.pickleball.com/circle-flags/${a.countryCode}.svg`
    : null;

  // Structured quick facts from the published profile (skip empty values).
  const qi = a.quickInfo;
  const ageVal = stats?.age ?? a.age;
  /**
   * ⚠ Read once, here, and used by BOTH equipment surfaces — the Quick Info row
   * just below and the "In the Bag" section further down. They drifted onto
   * different sources once before; a pro must never show a paddle in one and
   * not the other.
   */
  const paddleRecord = SHOW_EQUIPMENT ? paddleFor(a.slug) : null;
  /**
   * Jackalope (Pro Player Central → Paddles) is the LIVE source of truth for what's in
   * the bag — a paddle edited there shows here on the next athlete-cache refresh (see the ⚠
   * on FRESHNESS in lib/player-overrides.ts; it is daily, not minutes). It WINS over
   * the static broadcast masterlist (`paddleRecord`), which stays as the fallback for a
   * pro the feed doesn't cover or when the feed is unreachable. Also carries the paddle
   * photo and the pinned "Buy This Paddle" URL. One fetch, used by both equipment surfaces.
   */
  /**
   * ⚠ Fetched unconditionally, then narrowed — `heroImage` is NOT equipment and must not
   * disappear if `SHOW_EQUIPMENT` is ever switched off again (it was, on 8/5 pt. 20).
   * The fetch is memoized + ISR-cached, so reading it here costs nothing extra.
   */
  const override = await playerOverrideFor(a.name);
  const liveOverride = SHOW_EQUIPMENT ? override : null;
  /**
   * The pro's own accounts, for the visible link row under the bio. Same array
   * that feeds `sameAs` in the structured data below — one source, so the page
   * a fan reads and the page a search engine reads can't list different
   * accounts. Empty for every pro but Ben Johns today; Dillon and Liv fill
   * these in Pro Player Central.
   */
  const socials = socialLinks(override?.socials);
  /** The full-bleed action shot behind the hero. Null → the plain navy band. */
  const hero = athleteHeroFor(a.slug, override?.heroImage);
  const knownPaddle = liveOverride?.paddle ?? paddleRecord?.paddle ?? null;
  /**
   * A paddle change the event team sent to the website before it reached
   * Jackalope. Wins over both sources, but only while the paddle it was written
   * to replace is still the one above — see lib/paddle-updates.ts. Null is the
   * normal case for every pro.
   */
  const paddleUpdate = SHOW_EQUIPMENT ? paddleUpdateFor(a.slug, knownPaddle) : null;
  const effPaddle = paddleUpdate?.paddle ?? knownPaddle;
  const effSearchTerm =
    paddleUpdate?.searchTerm ?? liveOverride?.searchTerm ?? paddleRecord?.searchTerm ?? null;
  /**
   * The paddle photo for the callout. Prefers a curated transparent cut-out
   * (public/ppa/paddles) so the paddle sits ON the card rather than inside a
   * white box; falls back to the feed's scraped product photo, which gets a
   * white plate behind it because it may carry its own background.
   */
  const paddleImage = paddleImageFor(
    effPaddle,
    // ⚠ The feed's photo belongs to the paddle the feed names. Under a pending
    // update that is the OLD paddle, so it is dropped rather than shown beside
    // the new one — the curated cut-out map is keyed on the paddle name and
    // simply misses, which is the correct "no photo" outcome.
    paddleUpdate ? null : liveOverride?.image,
    a.slug,
  );
  const quickFacts: { label: string; value: string }[] = [
    { label: "Resides", value: stats?.hometown ?? qi?.resides ?? "" },
    { label: "Age", value: ageVal != null ? String(ageVal) : "" },
    { label: "Height", value: stats?.height ?? qi?.height ?? "" },
    { label: "Plays", value: stats?.handed ? `${stats.handed}-handed` : qi?.plays ?? "" },
    { label: "Turned Pro", value: stats?.turnedPro ?? a.turnedPro ?? "" },
    /**
     * ⚠ NO "Paddle" ROW HERE ANY MORE (8/13). It used to sit at the foot of this
     * list, which was fine while the "In the Bag" callout was a full-width band
     * much further down the page. The callout now renders directly beneath this
     * table, so the row printed the identical string about 100px above a block
     * that says it bigger, with the paddle photo and the buy link. One of the
     * two had to go and the callout is strictly more.
     *
     * The gate is unchanged: both surfaces key off `effPaddle`, so a pro neither
     * paddle source lists still shows no equipment anywhere.
     */
  ].filter((f) => f.value);

  // `divRanks` still tells us which boards the athlete sits on, which is what
  // decides whether the By-the-Numbers section renders at all. The three
  // per-discipline cards it used to feed are gone (Connor, 7/29).
  const hasAnyDivRank = Boolean(divRanks.singles || divRanks.doubles || divRanks.mixed);
  const medalRows = stats?.medals
    ? ([
        ["Singles", stats.medals.singles],
        ["Doubles", stats.medals.doubles],
        ["Mixed", stats.medals.mixed],
      ] as const).filter(([, m]) => m.gold + m.silver + m.semifinals > 0)
    : [];

  /**
   * Player's paddle → official-partner gear link (Connor's "link to gear").
   *
   * ⚠ Source is the event team's broadcast masterlist, NOT `quickInfo.paddle`.
   * Null for any pro the masterlist doesn't list, which hides both surfaces.
   */
  // Per-player override from Jackalope: an exact PBC product URL (pinned by Dillon/Liv)
  // wins over search, and the slug makes every PBC click attributable to this pro in GA4.
  const gear = resolveGear(effPaddle, effSearchTerm, {
    slug: a.slug,
    // The manufacturer on its own, so an unpinned paddle can fall back to that
    // brand's page on Pickleball Central rather than a generic one.
    brand: paddleUpdate?.brand ?? liveOverride?.brand ?? null,
    // A pending update can pin its own buy URL — MEHAU is not sold on PBC, so a
    // PBC search would be a buy button that finds nothing. It also has to drop
    // the feed's pinned URL, which points at the superseded paddle.
    pbcUrl: paddleUpdate ? paddleUpdate.buyUrl ?? null : liveOverride?.pbcUrl ?? null,
  });
  /**
   * ⚠ ONE STRING, RENDERED IN THE CALLOUT AND QUOTED BY THE FAQPage JSON-LD.
   * Structured data has to match what a person reads on the page — two
   * separately-worded sentences is how that quietly stops being true. It states
   * only what the paddle sources say: who, and which paddle. No specs, no claim
   * about a contract beyond the partner badge the roster already earns.
   */
  const gearAnswer = gear ? `${a.name} plays the ${gear.paddle}.` : null;
  /**
   * The Paddle Lab page for this paddle, when the name resolves to exactly one
   * lab record (lib/paddle-lab.ts → labPaddleForName refuses ambiguity). Adds a
   * "See the lab data" line under the buy button; absent otherwise.
   */
  const labPaddle = gear ? labPaddleForName(gear.paddle) : null;
  /**
   * The picture in the card: curated cut-out or the feed photo as before, and
   * now Pickleball Central's product shot from the lab when neither exists.
   * The lab photo is keyed to the exact product the matcher placed, so it
   * cannot show a signature colourway on the wrong pro.
   */
  const bagImage =
    paddleImage ?? (labPaddle?.photo ? { src: labPaddle.photo, width: 1, height: 1, cutout: false } : null);
  /** Who makes it, for the Product node. Feed field first, partner match second. */
  const paddleBrand = paddleUpdate?.brand ?? liveOverride?.brand ?? gear?.brand ?? null;
  /** Stable @id for the paddle's Product node, so Person.owns can point at it. */
  const paddleNodeId = `${SITE_URL}/athletes/${a.slug}#paddle`;
  /** Structured data wants an absolute image URL; a curated cut-out is a /public path. */
  const paddleImageAbs = paddleImage
    ? paddleImage.src.startsWith("/")
      ? `${SITE_URL}${paddleImage.src}`
      : paddleImage.src
    : null;

  // Broadcast-style stat strip under the hero — the marquee numbers up front so
  // rank + hardware read instantly (only render what we actually have).
  const goldTotal = stats?.medals?.total.gold ?? null;
  const heroStats: { label: string; value: string }[] = [
    {
      label: boardLabel ? `${boardLabel} World Rank` : "World Rank",
      value: a.rank ? `No. ${a.rank}` : "—",
    },
    { label: "WPR Points", value: a.points > 0 ? a.points.toLocaleString() : "—" },
    // DUPR removed from the strip — Connor 7/29: "let's also not show DUPR".
    // It's a third-party rating; the tour's own number is the WPR.
    ...(goldTotal != null && goldTotal > 0
      ? [{ label: "Career Titles", value: String(goldTotal) }]
      : []),
  ];

  const gender = genderFromDivisions(a.divisions ?? []);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: a.name,
            jobTitle: "Professional Pickleball Player",
            nationality: a.country,
            ...(gender ? { gender } : {}),
            // Absolute URL — Google prefers a fully-qualified image in structured
            // data; a curated headshot is a /public path, a live one is already
            // absolute.
            image: a.headshot.startsWith("/")
              ? `${SITE_URL}${a.headshot}`
              : a.headshot,
            url: `${SITE_URL}/athletes/${a.slug}`,
            // Reconciled, not raw — this is structured data Google reads, so it
            // must not publish a title count the page itself contradicts.
            description: bioParagraphs.join(" "),
            /**
             * Entity attributes (8/20). Google reconciles a person across the web
             * on facts like these, and we were publishing a Person node with a
             * name, a country and a job title — thinner than the Wikipedia entry
             * that outranks us on our own athletes' names.
             *
             * ⚠ EVERY FIELD BELOW IS A FACT THE PAGE ITSELF ALREADY RENDERS, from
             * the same variables. `birthDate` is the published profile's DOB (the
             * value the Age row is computed from), `height`/`homeLocation` are the
             * Quick Info rows, `alternateName` is the feed's nickname. Nothing is
             * inferred, and anything we don't hold is simply omitted.
             */
            ...(stats?.nickname ? { alternateName: stats.nickname } : {}),
            ...(qi?.dob ? { birthDate: qi.dob } : {}),
            ...(stats?.height || qi?.height
              ? { height: stats?.height ?? qi?.height }
              : {}),
            ...(stats?.hometown || qi?.resides
              ? {
                  homeLocation: {
                    "@type": "Place",
                    name: stats?.hometown ?? qi?.resides,
                  },
                }
              : {}),
            knowsAbout: "Pickleball",
            /**
             * `sameAs` — the pro's own accounts, from Pro Player Central. This is the
             * single strongest entity signal on the page: it is how Google ties
             * ppatour.com/athletes/ben-johns to the Ben Johns it already knows from
             * everywhere else, instead of treating our page as an unrelated document
             * about a name that Wikipedia covers better.
             *
             * ⚠ PASTED LINKS ONLY, validated twice (Jackalope on write, `lib/player-
             * overrides.ts` on read). Never construct one from a handle — `sameAs` is a
             * machine-readable assertion that this person owns that account.
             */
            ...(override?.socials?.length ? { sameAs: override.socials } : {}),
            // Reference the site-wide org node (app/layout.tsx) by @id instead of
            // redefining it, so the two never disagree.
            memberOf: { "@id": `${SITE_URL}/#organization` },
            /**
             * The paddle, as a Product this person owns. `owns` is schema.org's
             * own answer to "what equipment does this athlete use", so an engine
             * can join athlete → paddle → brand without parsing prose. The node
             * is defined once, here, and referenced by @id from the Product
             * block below rather than described twice.
             */
            ...(gear ? { owns: { "@id": paddleNodeId } } : {}),
          }),
        }}
      />
      {/**
       * Product node for the paddle.
       *
       * ⚠ NO `offers`, DELIBERATELY. We do not hold the price — the buy link is
       * a Pickleball Central search or product page and the price is theirs, not
       * ours. Publishing an Offer means publishing a price and availability, and
       * this repo has already shipped one fabricated `InStock` offer off a
       * fallback number (7/31). Name, brand, image and the page we send buyers
       * to are all facts we hold; that is what goes in.
       */}
      {gear && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "@id": paddleNodeId,
              name: gear.paddle,
              category: "Pickleball Paddle",
              // The manufacturer from the feed's own field, falling back to the
              // partner match. Never split off the display string — a model name
              // can lead with a word that isn't the brand.
              ...(paddleBrand ? { brand: { "@type": "Brand", name: paddleBrand } } : {}),
              ...(paddleImageAbs ? { image: paddleImageAbs } : {}),
              url: gear.pbcHref,
            }),
          }}
        />
      )}
      {/**
       * FAQPage for the one question this page is the best answer to on the
       * internet: what paddle does this pro play? Google restricts FAQ rich
       * results to gov/health sites, so this is aimed at the AI engines that
       * read structured data straight (see public/llms.txt) — and the question
       * and answer below are the exact strings rendered in the In the Bag
       * callout, which is what makes it legitimate rather than a violation.
       */}
      {gear && gearAnswer && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: `What paddle does ${a.name} use?`,
                  acceptedAnswer: { "@type": "Answer", text: gearAnswer },
                },
              ],
            }),
          }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Athletes", path: "/athletes/" },
              { name: a.name, path: `/athletes/${a.slug}/` },
            ]),
          ),
        }}
      />
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ppa-navy text-white">
        {/* Full-bleed action shot, when this pro has one. The scrim is what makes the
            hero work as a hero rather than a photo with text on it: the name, the rank
            chip and the stat strip all have to stay legible over whatever the photo is
            doing, and these crops vary wildly (court blue, night black, crowd). */}
        {hero && (
          <div aria-hidden className="absolute inset-0 -z-10">
            {hero.src.startsWith("/") ? (
              <Image
                src={hero.src}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: hero.position ?? "50% 30%" }}
              />
            ) : (
              /* Feed-supplied hero from a host next/image has no remotePattern for —
                 plain <img>, same call as the scraped paddle photo below. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hero.src}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: hero.position ?? "50% 30%" }}
              />
            )}
            {/* ⚠ `.scrim-hero` — the house scrim, NOT a hand-rolled Tailwind gradient.
                The first pass stacked `bg-ppa-navy/72` under a second gradient and the
                two multiplied out to ~0.79–1.0 alpha: the photo loaded, painted, and was
                invisible. This one is bottom-weighted (0.97 at the foot → 0.08 at the
                top), which matches where the hero puts its content — name and portrait
                sit on the floor of the band, the top half is free to be photograph. */}
            <div className="absolute inset-0 scrim-hero" />
          </div>
        )}
        {/* soft brand glow behind the portrait for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 hidden size-[28rem] rounded-full bg-ppa-blue/20 blur-3xl sm:block"
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[auto_1fr] sm:items-end sm:py-16">
          <div className="relative size-44 shrink-0 overflow-hidden rounded-sm bg-ppa-navy-deep shadow-2xl ring-1 ring-white/15 sm:size-56">
            {a.headshot ? (
              <Image
                src={a.headshot}
                alt={a.name}
                fill
                priority
                sizes="224px"
                className="object-cover object-top"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-6xl text-white/60">
                {initials(a.name)}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-ppa-blue" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.16em]">
              <span className="bg-ppa-blue px-2.5 py-1 text-white">
                World No. {a.rank || "—"}
              </span>
              {a.country && (
                <span className="flex items-center gap-1.5 text-white/70">
                  {flag && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={flag}
                      alt=""
                      className="size-4 rounded-full ring-1 ring-white/30"
                    />
                  )}
                  {a.country}
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-[clamp(2.25rem,6.5vw,4.25rem)] uppercase leading-[0.92]">
              {a.name}
            </h1>
            {/* App only — see the component for why the website has no follow
                button. */}
            <FollowButton slug={a.slug} name={a.name} />
            {/* The yellow tagline line is gone — Hannah Johns (item 8) and Dave
                Fleming, 29 Jul: "odd and incorrect", both asked to pull them.
                They were subjective editorial claims ("the tour's most complete
                all-court player") applied to only 40 of 180 pros, with everyone
                else getting a generic boilerplate line, because the intended
                `published.headline` fallback is empty for all 180. Uneven and
                unverifiable is worse than absent on a player's own page.

                `tagline` is still on the curated records, so restoring this is
                one element — but it should not come back until the copy is
                sourced and covers the whole roster.

                Division chips were removed just below here earlier — Connor
                7/29. Divisions still drive gender inference and the rankings
                board lookup, they're just not printed. */}
          </div>
          {hero?.credit && (
            <span className="pointer-events-none absolute bottom-2 right-4 text-[10px] uppercase tracking-[0.14em] text-white/40">
              {hero.credit}
            </span>
          )}
        </div>

        {/* Broadcast-style stat strip — marquee numbers up front */}
        <div className="relative border-t border-white/10 bg-ppa-navy-deep">
          <dl
            className={`mx-auto grid w-full max-w-6xl grid-cols-2 divide-x divide-white/10 ${
              heroStats.length >= 4
                ? "sm:grid-cols-4"
                : heroStats.length === 3
                  ? "sm:grid-cols-3"
                  : "sm:grid-cols-2"
            }`}
          >
            {heroStats.map((s) => (
              <div key={s.label} className="px-4 py-5 sm:px-6 sm:py-6">
                <dd className="font-display text-3xl leading-none text-white sm:text-4xl">
                  {s.value}
                </dd>
                <dt className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative h-1 bg-ppa-blue" />
      </section>

      {/* Bio + WPR standing */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Profile
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                About {a.name}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                {bioParagraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                {/**
                 * Was an unconditional "Watch {First} Live" → /watch, which
                 * claimed the player was live whenever anyone opened the page —
                 * Dave Fleming, 29 Jul: it "is always on, even when he isn't
                 * playing". His alternative was better than a fix: point it at a
                 * great match instead, merged with the Highlights section.
                 *
                 * So when this player has video, the CTA is "See {First} in
                 * Action" and jumps to their own Highlights below. When they
                 * don't, it drops to the honest where-to-watch label rather than
                 * asserting a live match we have no way to confirm here.
                 */}
                {highlights ? (
                  <Link
                    href="#highlights"
                    className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
                  >
                    ▶ See {a.name.split(" ")[0]} in Action
                  </Link>
                ) : (
                  <Link
                    href="/watch"
                    className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
                  >
                    ▶ Where to Watch
                  </Link>
                )}
                {/* "Official PPA Profile ↗" removed — Dave Fleming and Dillon
                    Segur both asked what it meant. It pointed at the OLD ppatour
                    site, so once this IS ppatour.com the label is nonsense and
                    the destination is a downgrade. `sourceUrl` is kept on the
                    record as provenance for the imported bio, just not linked. */}
              </div>

              {/* Follow — the pro's own accounts (Connor, 9/1). Named links
                  rather than icons: the roster spans Instagram, X, TikTok,
                  YouTube, Facebook and LinkedIn, and a wordmark set we don't
                  hold is worse than the platform's name typed out. Collapses
                  entirely when Pro Player Central holds nothing for a pro, so
                  no page shows an empty "Follow" heading. */}
              {socials.length > 0 && (
                <div className="mt-6 border-t border-ppa-line pt-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-navy/45">
                    Follow {a.name.split(" ")[0]}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {socials.map((s) => (
                      <a
                        key={s.href}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer me"
                        className="inline-flex h-9 items-center border border-ppa-line bg-white px-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
                      >
                        {s.label} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Quick Info
              </p>
              {quickFacts.length > 0 ? (
                <dl className="mt-3 divide-y divide-ppa-line border border-ppa-line bg-white">
                  {quickFacts.map((f) => (
                    <div key={f.label} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                        {f.label}
                      </dt>
                      <dd className="text-right text-sm font-medium text-ppa-navy">
                        {f.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm text-ppa-navy/50">
                  Full profile details coming soon.
                </p>
              )}
              <Link
                href="/rankings"
                className="mt-4 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
              >
                Full World Rankings →
              </Link>

              {/**
               * In the Bag — the athlete's paddle + the buy link.
               *
               * ⚠ IT LIVES HERE, DIRECTLY UNDER QUICK INFO, NOT IN ITS OWN
               * FULL-WIDTH SECTION (Bryce, 8/13). The paddle is a quick fact
               * about the player, and it was previously a whole navy band sitting
               * between the career stats and the highlights — a long way from the
               * "Paddle" row in Quick Info that states the same thing.
               *
               * The heading is written as the question people actually search
               * ("what paddle does X use") and the line under it answers it in a
               * sentence. That copy is what the FAQPage JSON-LD at the top of
               * this page quotes, so the two must stay in step — structured data
               * has to match visible text or it is a violation, not an
               * optimisation.
               *
               * Absent entirely for a pro the paddle sources don't list, which is
               * most of the roster.
               */}
              {SHOW_EQUIPMENT && gear && (
                <div className="mt-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                    In the Bag
                  </p>
                  <div className="mt-3 border border-ppa-navy/10 bg-ppa-navy text-white">
                    <div className="flex items-center gap-4 p-4">
                      {bagImage && (
                        <div className="flex h-32 w-20 shrink-0 items-center justify-center">
                          {bagImage.cutout ? (
                            <Image
                              src={bagImage.src}
                              alt={`${gear.paddle} pickleball paddle`}
                              width={bagImage.width}
                              height={bagImage.height}
                              sizes="80px"
                              className="h-full w-auto object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
                            />
                          ) : (
                            /* Scraped product photo from an external BigCommerce
                               host — plain <img> (variable host, no next/image
                               domain config) and on a white plate, since it may
                               ship its own background. */
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={bagImage.src}
                              alt={`${gear.paddle} pickleball paddle`}
                              loading="lazy"
                              className="h-full w-full rounded-md bg-white object-contain p-1.5"
                            />
                          )}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="font-display text-base uppercase leading-tight sm:text-lg">
                          What paddle does {a.name} use?
                        </h2>
                        <p className="mt-1.5 text-sm leading-snug text-white/80">
                          {gearAnswer}
                        </p>
                        {gear.brand && (
                          <p className="mt-2 text-[11px] font-medium text-ppa-sky">
                            Official Partner of the PPA Tour
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Conner Ogden 7/27: link the pro's paddle so a fan can buy the
                        same one. Connor 7/29: that link is ALWAYS Pickleball Central
                        for now — never the manufacturer. The partner brand is still
                        named above; only the destination changed.
                        The href carries utm_term=<paddle model> so the brand can
                        count what ppatour.com sells them per paddle — see
                        lib/paddle-images.ts → paddleTerm. */}
                    <a
                      href={gear.pbcHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-12 items-center justify-center bg-ppa-blue px-5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
                    >
                      Buy This Paddle ↗
                    </a>
                    {/* Bryce 9/3: the paddle's headline measurements live on the
                        player's page too, not just a link. Tested paddle → five
                        stats + a link; shop-only paddle → the link alone. */}
                    {labPaddle && labPaddle.tested ? (
                      <LabStatsMini paddle={labPaddle} />
                    ) : labPaddle ? (
                      <Link
                        href={labPaddle.href}
                        className="flex h-10 items-center justify-center border-t border-white/10 text-[11px] font-bold uppercase tracking-[0.14em] text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        See it in the Paddle Lab →
                      </Link>
                    ) : null}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* By the Numbers — podium finishes at PPA-tagged events (live player API).
          ⚠ THE EYEBROW SAYS "PPA TOUR", NOT "CAREER", AND THAT IS DELIBERATE.
          `player_medals` is queried with `partners=ppa,upa`, and the PPA partner
          tag is MISSING on most pre-2024 events upstream — measured 9/1 by
          probing the endpoint from a preview build. Ben Johns' gold by year,
          PPA filter vs unfiltered: 2020 3/13 · 2021 6/36 · 2022 13/37 ·
          2023 24/41 · 2024 31/32 · 2025 27/27. He has been PPA-exclusive
          throughout, so the gap is tagging, not other tours. The database also
          holds nothing before 2020 at any setting.
          Dropping `partners` is NOT the fix — unfiltered sweeps in APP, the US
          Open and USA Pickleball and would print those as PPA titles on all 179
          profiles. `scope_title=Pro` is inert (identical results with and
          without it), and `app`/`usap`/`mlp` are not recognised partner keys, so
          there is no third setting. Until pickleball.com backfills the tag, the
          honest move is to stop calling an undercount a career total. */}
      {(stats?.hasStats || hasAnyDivRank) && (
        <section className="bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
              PPA Tour
            </p>
            <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
              By the Numbers
            </h2>

            {/* Division Rankings block removed — Connor 7/29: "let's only show
                WPR, not individual disciplines."
                Worth knowing WHY it looked broken to him: WPR is a weighted
                average of the three boards, not a sum —
                  WPR = 0.5·doubles + 0.35·mixed + 0.15·singles
                (Ben Johns: 0.5·21,800 + 0.35·23,300 + 0.15·1,600 = 19,295 ✓).
                So the per-discipline point totals are LARGER than the combined
                WPR, which reads as an error even though the math is right.
                `getDivisionRanks` is still called — it's what tells us which
                board an athlete sits on — we just don't print the three cards. */}

            {stats?.medals && (
              <div className="mt-6">
                <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
                  {(
                    [
                      ["Titles", stats.medals.total.gold, "bg-ppa-yellow"],
                      ["Finals", stats.medals.total.silver, "bg-ppa-blue"],
                      // Semifinal APPEARANCES that ended there — third AND
                      // fourth place. Not `.bronze`, which is third place only;
                      // see the ⚠ on MedalSet.semifinals.
                      ["Semifinals", stats.medals.total.semifinals, "bg-ppa-line"],
                    ] as const
                  ).map(([label, count, bar]) => (
                    <div key={label} className="overflow-hidden rounded-md border border-ppa-line bg-ppa-paper">
                      <div className={`h-1.5 ${bar}`} />
                      <div className="px-4 py-4">
                        <p className="font-display text-4xl leading-none text-ppa-navy">
                          {count}
                        </p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                          {label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Says what the three numbers count. A pro reading his own page
                    was comparing them against his whole career and finding them
                    short — Tyson McGuffin via Connor, 9/1. */}
                <p className="mt-3 max-w-xl text-[11px] leading-relaxed text-ppa-navy/45">
                  Podium finishes at PPA Tour events, from the tour&rsquo;s results
                  database. Results from other tours aren&rsquo;t counted.
                </p>

                {medalRows.length > 0 && (
                  <div className="mt-4 overflow-hidden rounded-md border border-ppa-line">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-ppa-navy text-white">
                          <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-[0.14em]">Division</th>
                          {["Titles", "Finals", "Semifinals"].map((h) => (
                            <th key={h} className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-[0.14em]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {medalRows.map(([div, m]) => (
                          <tr key={div} className="border-t border-ppa-line">
                            <td className="px-4 py-2 font-semibold text-ppa-navy">{div}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-ppa-navy">{m.gold}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-ppa-navy/70">{m.silver}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-ppa-navy/70">{m.semifinals}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* DUPR section removed — Connor 7/29: "let's also not show DUPR."
                Third-party rating; the tour's own number is the WPR. */}
          </div>
        </section>
      )}

      {/* Highlights — player video clips from the API */}
      {highlights && (
        <section id="highlights" className="scroll-mt-24 bg-ppa-paper">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
              Watch
            </p>
            <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
              {a.name}&apos;s Highlights
            </h2>
            <div className="mt-6">
              <AthleteVideos
                slug={a.slug}
                tournaments={highlights.tournaments}
                initialUuid={highlights.tournamentUuid}
                initialVideos={highlights.videos}
              />
            </div>
          </div>
        </section>
      )}

      {/* More pros */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
            More Pros
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
            Follow the Field
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/athletes/${o.slug}`}
                className="group flex flex-col overflow-hidden border border-white/10 bg-ppa-navy"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={o.headshot}
                    alt={o.name}
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <FollowChip
                    slug={o.slug}
                    name={o.name}
                    className="absolute bottom-2 right-2"
                  />
                </div>
                <div className="p-3 text-white">
                  <p className="font-display text-sm uppercase leading-tight transition-colors group-hover:text-ppa-sky">
                    {o.name}
                  </p>
                  {liveRanks[o.slug] && (
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-sky">
                      No. {liveRanks[o.slug].rank}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Email */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="fan" />
        </div>
      </section>
    </>
  );
}
