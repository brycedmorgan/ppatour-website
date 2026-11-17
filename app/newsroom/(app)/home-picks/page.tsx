import { getSetting, SETTINGS } from "@/lib/newsroom/store";
import type { HomePbPicks } from "@/lib/newsroom/published";
import { HOME_PB_SLOTS } from "@/lib/newsroom/posts";
import { getPickleballNewsPage } from "@/lib/pb-news";
import { HomePicks } from "../../_components/HomePicks";

export const metadata = { title: "Home page" };

export default async function HomePicksPage() {
  const [picks, first] = await Promise.all([
    getSetting<HomePbPicks>(SETTINGS.homePbPicks),
    getPickleballNewsPage(1, 24),
  ]);
  return (
    <>
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-blue">Newsroom</p>
        <h1 className="font-display text-3xl uppercase leading-none">Home page</h1>
        <p className="mt-2 max-w-2xl text-sm text-ppa-navy/70">
          Choose which pickleball.com articles appear in the home page&apos;s pickleball.com
          section. Pin up to {HOME_PB_SLOTS} and put them in order. Any empty slot shows the newest
          article, so the section never goes empty.
        </p>
      </header>
      <HomePicks initialPins={picks?.pins ?? []} initialFeed={first} slots={HOME_PB_SLOTS} />
    </>
  );
}
