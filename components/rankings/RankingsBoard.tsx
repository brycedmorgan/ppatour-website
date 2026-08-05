"use client";

import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { BoardDivision } from "@/lib/rankings-api";
import {
  isFiltering,
  matchesPlayerName,
  playerRegion,
  REGION_OPTIONS,
  type RegionFilter,
} from "@/lib/ranking-filters";
import { RankingPager } from "./RankingPager";
import { RankingTable } from "./RankingTable";
import { RankingTableSkeleton } from "./RankingTableSkeleton";

/**
 * The World Pickleball Rankings board.
 *
 * Bryce 7/28: desktop had too much dead space left-to-right with one board at
 * a time, so from `lg` up BOTH boards render side by side (men's left, women's
 * right) and the gender toggle is hidden. Below `lg` the toggle stays and only
 * the active board renders. One render tree, CSS decides — no duplicate DOM.
 *
 * `filterable` adds the name search + region filter. It is OPT-IN because this
 * component also renders the top-10 modules on the homepage and /athletes,
 * where a search box over ten rows would be noise. Only the full boards on
 * /rankings pass it.
 *
 * `fullBoardsUrl` makes `divisions` a SEED rather than the whole board: the
 * rows given are rendered immediately and the complete boards are fetched from
 * that URL once the page has loaded, with a skeleton tail under each board
 * while they're in flight. See the note on {@link useFullBoards}.
 *
 * `pageSize` paginates each board (Wesley, 8/5 — 50 a page on /rankings).
 * ⚠ EACH BOARD PAGES INDEPENDENTLY, and that is forced by the data: the men's
 * board is ~1,324 rows and the women's ~751, so a shared page number would put
 * the women's board on an empty page 17 while the men's is still mid-field.
 * Both are on screen together above `lg`, so one shared pager could only ever be
 * right for one of them.
 */
export function RankingsBoard({
  divisions: seedDivisions,
  filterable = false,
  fullBoardsUrl,
  pageSize,
}: {
  divisions: BoardDivision[];
  filterable?: boolean;
  fullBoardsUrl?: string;
  pageSize?: number;
}) {
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionFilter>("all");
  const searchId = useId();
  const regionId = useId();

  const { divisions, loading, failed, retry } = useFullBoards(seedDivisions, fullBoardsUrl);
  const paging = usePagedBoards(pageSize);
  /** Rows the server sent, so the failure copy quotes what's actually shown. */
  const seedCount = Math.max(...seedDivisions.map((d) => d.entries.length), 0);

  /**
   * ⚠ `useDeferredValue`, not the raw query, is what the list reads.
   *
   * The unfiltered board is ~2,075 rows / 18,646 DOM nodes, so re-rendering it
   * synchronously on every keystroke drops frames in the input itself. Deferring
   * lets React keep the field responsive and interrupt the stale list render.
   * Keep this if you touch the filtering — the input must never wait on the board.
   */
  const deferredQuery = useDeferredValue(query);
  const filtering = filterable && isFiltering(deferredQuery, region);

  const shown = useMemo(() => {
    if (!filtering) return divisions;
    const q = deferredQuery.trim();
    return divisions.map((d) => ({
      ...d,
      entries: d.entries.filter(
        (e) =>
          matchesPlayerName(e.name, q) &&
          (region === "all" || playerRegion(e.countryCode) === region),
      ),
    }));
  }, [divisions, filtering, deferredQuery, region]);

  const totalMatches = shown.reduce((n, d) => n + d.entries.length, 0);
  /**
   * Is this a full board (so counts mean something) or a top-10 module?
   *
   * ⚠ While the full boards are still loading this must be false. The seed is
   * the first page of each board, which trips the >10 test — so without this the
   * count line would report the seed size as the size of the field, on a page
   * whose own copy promises every ranked pro. A number we know to be wrong is
   * worse than no number.
   */
  const isFullBoard = !loading && divisions.some((d) => d.entries.length > 10);
  /** The list is showing stale rows while React catches up on a big filter. */
  const pending = query !== deferredQuery;

  /**
   * ⚠ A new filter has to send every board back to page 1. Narrowing 1,324 rows
   * to three while sitting on page 12 would otherwise render an empty board for
   * a search that matched — the same class of bug as the /leaderboards page
   * clamp (8/3 pt. 6), one surface over.
   */
  const resetPages = paging.reset;
  useEffect(() => {
    resetPages();
  }, [deferredQuery, region, resetPages]);

  function reset() {
    setQuery("");
    setRegion("all");
  }

  return (
    <div>
      {filterable && (
        <div className="mb-6 border border-white/10 bg-ppa-navy-deep p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <label htmlFor={searchId} className="sr-only">
                Search players by name
              </label>
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any ranked player by name…"
                autoComplete="off"
                className="h-10 w-full border border-white/20 bg-ppa-navy pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-ppa-sky"
              />
            </div>

            <div className="shrink-0">
              <label htmlFor={regionId} className="sr-only">
                Filter by region
              </label>
              <select
                id={regionId}
                value={region}
                onChange={(e) => setRegion(e.target.value as RegionFilter)}
                className="h-10 w-full border border-white/20 bg-ppa-navy px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white outline-none focus:border-ppa-sky sm:w-auto"
              >
                {REGION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-ppa-navy text-white">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result count + reset. `aria-live` so a screen reader hears the
              board change — the rows themselves are far off-screen. */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p
              aria-live="polite"
              className={`text-[11px] font-bold uppercase tracking-[0.12em] transition-opacity ${
                pending ? "text-white/30" : "text-white/45"
              }`}
            >
              {/* ⚠ While the rest of the board is still arriving, say so — a
                  search really is only reaching the seed rows until it lands,
                  and silently reporting "2 players match" out of 50 would be a
                  wrong answer to a correct query. */}
              {loading
                ? filtering
                  ? `${totalMatches.toLocaleString()} so far — loading the full board…`
                  : "Loading the full board…"
                : failed
                  ? `Showing the top ${seedCount.toLocaleString()} — the full board didn’t load`
                  : filtering
                    ? `${totalMatches.toLocaleString()} ${totalMatches === 1 ? "player" : "players"} match`
                    : isFullBoard
                      ? `${divisions
                          .reduce((n, d) => n + d.entries.length, 0)
                          .toLocaleString()} ranked players`
                      : ""}
            </p>
            {failed && (
              <button
                type="button"
                onClick={retry}
                className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-sky underline-offset-4 hover:underline"
              >
                Retry
              </button>
            )}
            {filtering && (
              <button
                type="button"
                onClick={reset}
                className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-sky underline-offset-4 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Gender tabs — mobile/tablet only; desktop shows both boards. */}
      <div className="flex gap-1 lg:hidden">
        {shown.map((d, i) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
              i === active
                ? "bg-white text-ppa-navy"
                : "border border-white/20 text-white/60 hover:text-white"
            }`}
          >
            {d.short}
            {/* While filtering, the count is the whole point of the tab: only
                one board is visible on mobile, so without it a search that
                matches a woman looks like "no results" to someone sitting on
                the men's board. Suppressed mid-load for the same reason the
                headline count is — it would be counting the seed. */}
            {(filtering || (!loading && d.entries.length > 10)) && (
              <span className="ml-1.5 opacity-60">· {d.entries.length.toLocaleString()}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-8">
        {shown.map((d, i) => {
          const view = paging.view(d);
          return (
          <div
            key={d.key}
            /* The scroll target for a page change. `scroll-mt` clears the
               sticky site chrome — without it the first rows of the new page
               land underneath the header. */
            ref={paging.anchor(d.key)}
            className={`scroll-mt-28 ${i === active ? "block" : "hidden lg:block"}`}
          >
            {/* Column heading stands in for the toggle on desktop. */}
            <div className="mb-3 hidden items-baseline justify-between border-b border-white/10 pb-2 lg:flex">
              <h3 className="font-display text-lg uppercase leading-none text-white">
                {d.label}
              </h3>
              {/* Count only on the full boards — the homepage module shows a
                  top-10 slice, where "10 ranked" would read as the whole field.
                  While filtering it reads "3 of 1,324" so the board never
                  pretends the filtered set is the whole field. */}
              {loading ? (
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">
                  Loading…
                </span>
              ) : (
                divisions[i].entries.length > 10 && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                    {filtering
                      ? `${d.entries.length.toLocaleString()} of ${divisions[i].entries.length.toLocaleString()}`
                      : `${d.entries.length.toLocaleString()} ranked`}
                  </span>
                )
              )}
            </div>
            {/* ⚠ Page changes render behind a skeleton rather than swapping the
                rows in place. It is NOT a fake delay — it is a real
                `useTransition` pending state, so it appears exactly as long as
                committing 50 rows (50 next/image avatars among them) actually
                takes, which on a throttled phone is long enough to see and on a
                desktop is a frame. Timing it out on purpose would be theatre;
                this repo doesn't ship states that claim work isn't happening,
                and it shouldn't ship one claiming work that isn't. */}
            {paging.isChanging(d.key) ? (
              <RankingTableSkeleton
                rows={Math.max(view.entries.length, 1)}
                label={`Loading page ${paging.pageOf(d.key)} of the ${d.label.toLowerCase()}'s board`}
              />
            ) : view.entries.length > 0 ? (
              <RankingTable entries={view.entries} />
            ) : (
              !loading && (
                <NoMatches
                  label={d.label}
                  other={shown.find((o, oi) => oi !== i && o.entries.length > 0)}
                  onSwitch={() => setActive(shown.findIndex((o) => o.entries.length > 0))}
                />
              )
            )}
            {/* The rest of the board, still arriving. Rendered as a tail on the
                seed rows — same grid, no header, no top border — so the two
                read as one continuous table and the swap doesn't shift it. */}
            {loading && (
              <RankingTableSkeleton
                rows={6}
                header={view.entries.length === 0}
                continued={view.entries.length > 0}
                label={`Loading the rest of the ${d.label.toLowerCase()}'s board`}
              />
            )}

            {view.totalPages > 1 && (
              <>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">
                  Showing {view.from.toLocaleString()}–{view.to.toLocaleString()} of{" "}
                  {view.total.toLocaleString()}
                </p>
                <RankingPager
                  page={view.page}
                  totalPages={view.totalPages}
                  onSelect={(p) => paging.goTo(d.key, p)}
                  label={`${d.label} pages`}
                />
              </>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Empty state for one board while filtering. If the OTHER board has matches it
 * says so and offers the switch — on mobile only one board is on screen, so
 * "no players match" on its own would be a dead end for a correct search.
 */
function NoMatches({
  label,
  other,
  onSwitch,
}: {
  label: string;
  other: BoardDivision | undefined;
  onSwitch: () => void;
}) {
  return (
    <div className="border border-white/10 px-4 py-10 text-center">
      <p className="text-sm text-white/55">
        No players in {label} match.
      </p>
      {other && (
        <button
          type="button"
          onClick={onSwitch}
          className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-sky underline-offset-4 hover:underline lg:hidden"
        >
          {other.entries.length} {other.entries.length === 1 ? "match" : "matches"} in{" "}
          {other.label} →
        </button>
      )}
    </div>
  );
}

/**
 * Per-board pagination, held in component state.
 *
 * ⚠ IT PAGES THE ROWS WE ALREADY HAVE — there is no request behind a page
 * change. {@link useFullBoards} has the complete board in memory precisely so a
 * name search can reach No. 1,300 (the same argument getRankingPage makes on the
 * server for /leaderboards), and once it's there, paging is a slice. That is why
 * the pending state below is a render cost, not a network one.
 *
 * ⚠ NOT IN THE URL, unlike /leaderboards. This page is `force-static` and its
 * board arrives client-side, so a `?page=` here would be state the server can't
 * honour on first paint — it would render page 1 and then jump. /leaderboards is
 * the linkable, crawlable, works-without-JS view of the same boards and already
 * puts page, search and region in the query string; deep links belong there.
 */
function usePagedBoards(pageSize: number | undefined) {
  const [pages, setPages] = useState<Record<string, number>>({});
  const [changing, setChanging] = useState<string | null>(null);
  const [isPending, startPageTransition] = useTransition();
  /** Scroll targets, one per board. */
  const anchors = useRef<Record<string, HTMLDivElement | null>>({});
  const anchorCallbacks = useRef(new Map<string, (el: HTMLDivElement | null) => void>());

  const reset = useCallback(() => setPages({}), []);

  /** Stable ref callback per board — a fresh one each render would detach and
      re-attach the node on every keystroke in the search box. */
  const anchor = useCallback((key: string) => {
    let cb = anchorCallbacks.current.get(key);
    if (!cb) {
      cb = (el: HTMLDivElement | null) => {
        anchors.current[key] = el;
      };
      anchorCallbacks.current.set(key, cb);
    }
    return cb;
  }, []);

  const goTo = useCallback(
    (key: string, p: number) => {
      setChanging(key);
      // A transition, so React can interrupt the 50-row commit and the skeleton
      // below gets a real pending state to hang on.
      startPageTransition(() => setPages((prev) => ({ ...prev, [key]: p })));
      // Scroll NOW, not after the commit — the click should move the page
      // immediately, and the skeleton is what fills the gap.
      const el = anchors.current[key];
      if (el) {
        const reduce =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      }
    },
    [startPageTransition],
  );

  /** The slice of one board to render, plus what to say about it. */
  const view = (d: BoardDivision) => {
    const total = d.entries.length;
    if (!pageSize || total <= pageSize) {
      return { entries: d.entries, page: 1, totalPages: 1, from: total ? 1 : 0, to: total, total };
    }
    const totalPages = Math.ceil(total / pageSize);
    // ⚠ Clamp. The board shrinks under a filter, and page 12 of a 1-page result
    // would render empty for a search that matched.
    const page = Math.min(Math.max(pages[d.key] ?? 1, 1), totalPages);
    const from = (page - 1) * pageSize;
    return {
      entries: d.entries.slice(from, from + pageSize),
      page,
      totalPages,
      from: from + 1,
      to: Math.min(from + pageSize, total),
      total,
    };
  };

  return {
    view,
    anchor,
    goTo,
    reset,
    pageOf: (key: string) => pages[key] ?? 1,
    /**
     * ⚠ Gated on `isPending` as well as the key, deliberately. If a transition
     * commits inside one frame React may never surface a pending render, and
     * `changing` would then be left set — harmless only because the skeleton
     * needs both.
     */
    isChanging: (key: string) => isPending && changing === key,
  };
}

/**
 * Loads the COMPLETE boards after the page has painted, seeded by whatever rows
 * the server rendered.
 *
 * WHY THIS EXISTS. /rankings used to inline every ranked pro — ~2,000 rows —
 * into its HTML. That markup is the page: 2.04 MB and 18,646 DOM nodes even
 * after the 8/1 per-row diet, DOMContentLoaded 5.3s. Nothing about that is the
 * data's fault (it comes off a 24h cache) or the platform's (the HTML is a
 * CDN HIT) — it is simply too much document. The page now ships the top 25 of
 * each board and fetches the rest here, so the cost lands after first paint,
 * beside a skeleton, instead of in front of a blank tab.
 *
 * ⚠ THE SEED IS WHY THIS ISN'T A REGRESSION. Fetching the whole board from an
 * empty box would trade a slow page for an empty one — no rows for a crawler,
 * nothing for a visitor on a dead connection, and the top of the standings (the
 * part almost everyone came for) behind a round trip. Serving the top 25 in the
 * HTML keeps the page useful with JavaScript off, and /leaderboards renders the
 * complete board server-side for anything that needs it whole.
 *
 * ⚠ IT FAILS BACK TO THE SEED, NEVER TO NOTHING. A failed fetch keeps the 25
 * rendered rows and says the rest didn't load; it never blanks a board that was
 * already on screen. Same rule as everywhere else here — see RankingsResult.source.
 */
function useFullBoards(
  seed: BoardDivision[],
  url: string | undefined,
): {
  divisions: BoardDivision[];
  loading: boolean;
  failed: boolean;
  retry: () => void;
} {
  const [full, setFull] = useState<BoardDivision[] | null>(null);
  const [failed, setFailed] = useState(false);
  /** Bumped by Retry to re-run the effect. */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!url || full) return;
    const controller = new AbortController();
    let live = true;

    (async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { divisions?: BoardDivision[] };
        // An empty payload is a failure, not an answer: it would blank a board
        // that is currently showing 25 correct rows.
        if (!json.divisions?.some((d) => d.entries.length > 0)) throw new Error("empty");
        // ⚠ A transition, not a plain setState. Committing ~2,000 rows is tens
        // of milliseconds of work; as an urgent update React does it in one
        // uninterruptible pass and the page locks up right after load, which
        // would trade a slow load for a janky one. As a transition React can
        // yield to scrolling and typing while it renders.
        if (live) startTransition(() => setFull(json.divisions!));
      } catch {
        if (live) setFailed(true);
      }
    })();

    return () => {
      live = false;
      controller.abort();
    };
  }, [url, full, attempt]);

  const retry = useCallback(() => {
    setFailed(false);
    setAttempt((n) => n + 1);
  }, []);

  return {
    divisions: full ?? seed,
    loading: Boolean(url) && !full && !failed,
    failed,
    retry,
  };
}
