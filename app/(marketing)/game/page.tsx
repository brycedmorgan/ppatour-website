import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";

/**
 * PPA Pickleball Tour 2025 — the official video game.
 *
 * Rebuilt from ppatour.com/ppa-pickleball-tour-video-game/, which Bryce wanted
 * kept rather than redirected away. That page described six features and then
 * stopped: it never named the game, never said what it costs or when it came
 * out, and its four store buttons were **bare images with no alt text and no
 * label** — so a screen reader, and Google, saw a page about a product with no
 * way to buy it. Every store link below is a real labelled button.
 *
 * Legacy URL 301s here (see next.config.ts). `/game` is short enough to say out
 * loud on a broadcast, which the old slug was not.
 *
 * ⚠ Screenshots are the real in-game art, rehosted from the WordPress media
 * library into public/ppa/game/. If the game ships a 2026 edition, the store
 * links, the title and these images all move together — they are the product,
 * not decoration.
 */
export const metadata: Metadata = {
  title: "PPA Pickleball Tour 2025 — The Official Video Game",
  description:
    "Play as Ben Johns, Anna Leigh Waters and 14 more PPA pros. Career mode, real venues, singles and doubles. Out now on Steam, PlayStation, Xbox and Nintendo Switch.",
  openGraph: {
    title: "PPA Pickleball Tour 2025 — The Official Video Game",
    description:
      "16 real PPA pros. Career mode. Real venues. Out now on Steam, PlayStation, Xbox and Switch.",
    images: ["/ppa/game/ppa-pickleball-tour-2025-video-game.webp"],
  },
};

/** Verified 2026-08-03: all four return 200. */
const STORES = [
  {
    name: "Steam",
    detail: "PC",
    href: "https://store.steampowered.com/app/2574120/PPA_Pickleball_Tour_2025/",
  },
  {
    name: "PlayStation",
    detail: "PS5",
    href: "https://store.playstation.com/en-us/concept/10009246",
  },
  {
    name: "Xbox",
    detail: "Series X|S",
    href: "https://www.xbox.com/en-us/games/store/ppa-pickleball-tour-2025/9nfjp2z9x13k",
  },
  {
    name: "Nintendo Switch",
    detail: "Switch",
    href: "https://www.nintendo.com/us/store/products/ppa-pickleball-tour-2025-switch/",
  },
];

/** Copy carried over from the WordPress page, tightened. Facts unchanged. */
const FEATURES = [
  {
    title: "Play With 16 PPA Pros",
    body: "Play as — or against — real PPA Tour pros including Ben Johns and Anna Leigh Waters, each with their own playing style and strategy.",
    image: "/ppa/game/play-with-the-pros-video-game.webp",
  },
  {
    title: "Level Up In Career Mode",
    body: "Start as a rookie and work your way up. Earn XP, level up your talents, train, compete, and climb the rankings to become the best in the world.",
    image: "/ppa/game/career-mode-video-game.webp",
  },
  {
    title: "Real Tour Venues",
    body: "Chase a Triple Crown across PPA Tour events set in San Clemente and Atlanta, the same stops the pros play on the real calendar.",
    image: "/ppa/game/venues-video-games.webp",
  },
  {
    title: "Create Your Own Player",
    body: "Design your player's look, style and abilities to match how you actually want to play.",
    image: "/ppa/game/create-a-character-video-game.webp",
  },
  {
    title: "Wear Your Favorite Brands",
    body: "Kit your player out with real pickleball brands — the latest paddles, shoes and apparel from the names you already play with.",
    image: "/ppa/game/wear-favorite-brands-video-game.webp",
  },
  {
    title: "Singles or Doubles",
    body: "Your choice. Team up with friends or AI partners and take the doubles court, or go it alone in singles.",
    image: "/ppa/game/divisions-video-game.webp",
  },
];

function StoreButtons({
  tone = "light",
  layout = "row",
}: {
  tone?: "light" | "dark";
  /** `grid` gives a deliberate 2x2 in the narrow hero column; a flex row
   *  wraps to an awkward 3+1 there. */
  layout?: "row" | "grid";
}) {
  const base =
    tone === "dark"
      ? "border-white/25 text-white hover:border-white hover:bg-white hover:text-ppa-navy"
      : "border-ppa-navy/20 text-ppa-navy hover:border-ppa-navy hover:bg-ppa-navy hover:text-white";
  return (
    <div
      className={
        layout === "grid"
          ? "grid max-w-md grid-cols-2 gap-3"
          : "flex flex-wrap gap-3"
      }
    >
      {STORES.map((s) => (
        <a
          key={s.name}
          href={`${s.href}${s.href.includes("?") ? "&" : "?"}utm_source=ppatour&utm_medium=website&utm_campaign=ppa-tour-2025-game&utm_content=game-${s.name.toLowerCase().replace(/\s+/g, "-")}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex flex-col border px-5 py-3 transition-colors ${layout === "row" ? "min-w-[9.5rem]" : ""} ${base}`}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-60">
            {s.detail}
          </span>
          <span className="mt-0.5 text-sm font-bold uppercase tracking-wide">
            {s.name} ↗
          </span>
        </a>
      ))}
    </div>
  );
}

export default function GamePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-ppa-navy text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-ppa-yellow" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
                The Official Video Game
              </p>
            </div>
            <h1 className="mt-3 font-display text-4xl uppercase leading-[1.02] sm:text-5xl">
              PPA Pickleball Tour 2025
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
              Sixteen real PPA Tour pros. A career mode that takes you from
              rookie to world No. 1. Real venues, real brands, singles and
              doubles. Out now on four platforms.
            </p>
            <div className="mt-7">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-yellow">
                Available Now
              </p>
              <StoreButtons tone="dark" layout="grid" />
            </div>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden border border-white/10">
            <Image
              src="/ppa/game/ppa-pickleball-tour-2025-video-game.webp"
              alt="PPA Pickleball Tour 2025 key art"
              fill
              priority
              sizes="(min-width: 1024px) 32rem, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-14">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              What&apos;s In It
            </p>
          </div>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Built Around the Real Tour
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="flex flex-col border border-ppa-line bg-white"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-ppa-navy-deep">
                  <Image
                    src={f.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg uppercase leading-tight text-ppa-navy">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                    {f.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Buy again at the bottom — the old page ended on a feature with no CTA */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14">
          <h2 className="font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Get the Game
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ppa-navy/65">
            PPA Pickleball Tour 2025 is out now on PC, PlayStation 5, Xbox
            Series X|S and Nintendo Switch.
          </p>
          <div className="mt-6">
            <StoreButtons />
          </div>
          <p className="mt-8 text-sm text-ppa-navy/60">
            Want the real thing?{" "}
            <Link
              href="/events"
              className="font-bold text-ppa-navy underline underline-offset-4 hover:text-ppa-blue"
            >
              Find a tour stop near you
            </Link>{" "}
            or{" "}
            <Link
              href="/athletes"
              className="font-bold text-ppa-navy underline underline-offset-4 hover:text-ppa-blue"
            >
              meet the pros in the game
            </Link>
            .
          </p>
        </div>
      </section>

      <LeadMagnetCapture variant="fan" />
    </>
  );
}
