"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { BoardDivision, BoardEntry } from "@/lib/rankings-api";
import { matchesPlayerName } from "@/lib/ranking-filters";
import { FollowChip } from "@/components/app/FollowChip";
import { useFollows } from "@/components/app/follows";

/**
 * The app's Rankings tab (Bryce, 10/9). Same look as Scores — navy header, one
 * pill toggle, white list — instead of the website's /rankings, which is a long
 * marketing page (explainers, weighting chart, lead capture) around the board.
 *
 * The pros you follow are pinned above the board, so "where is my player"
 * is answered without scrolling 100 rows. Following is by our profile slug,
 * the same key as the profile's Follow button, so it only shows on players
 * with a local profile (see `profileSlug` in components/rankings/RankingTable).
 *
 * ⚠ No up/down movement arrows: the WPR feed carries this week's rank only,
 * with no previous rank to compare against. Add them when it does; do not
 * diff against a stored snapshot, which would show stale moves after any
 * week the snapshot missed.
 */
function profileSlug(e: BoardEntry): string {
  return e.profileUrl.replace(/\/$/, "").split("/").pop() || e.slug;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

const fmtPoints = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

function Row({ e }: { e: BoardEntry }) {
  return (
    <li>
      <Link
        href={e.profileUrl}
        target={e.hasLocalProfile ? undefined : "_blank"}
        rel={e.hasLocalProfile ? undefined : "noopener noreferrer"}
        className="flex items-center gap-3 py-2.5 active:bg-ppa-paper"
      >
        <span
          className={`w-8 shrink-0 text-center font-display text-[17px] font-bold tabular-nums ${
            e.rank <= 5 ? "text-ppa-navy" : "text-ppa-navy/45"
          }`}
        >
          {e.isTied ? `T${e.rank}` : e.rank}
        </span>
        <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-ppa-paper">
          {e.headshot ? (
            <Image src={e.headshot} alt="" width={40} height={40} className="size-10 object-cover object-top" />
          ) : (
            <span className="flex size-10 items-center justify-center text-[12px] font-bold text-ppa-navy/50">
              {initials(e.name)}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-bold text-ppa-navy">{e.name}</span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ppa-navy/45">
            {e.countryCode ? `${e.countryCode.toUpperCase()} · ` : ""}
            {fmtPoints(e.points)} pts
          </span>
        </span>
        {e.hasLocalProfile && <FollowChip slug={profileSlug(e)} name={e.name} className="size-7 shrink-0" />}
      </Link>
    </li>
  );
}

export function AppRankings({ divisions, asOf }: { divisions: BoardDivision[]; asOf: string }) {
  const [key, setKey] = useState(divisions[0]?.key ?? "men");
  const [q, setQ] = useState("");
  const { follows } = useFollows();

  const board = divisions.find((d) => d.key === key) ?? divisions[0];
  const entries = useMemo(
    () => (board ? board.entries.filter((e) => matchesPlayerName(e.name, q)) : []),
    [board, q],
  );
  const mine = useMemo(() => {
    const slugs = new Set(follows.map((f) => f.slug));
    return (board?.entries ?? []).filter((e) => e.hasLocalProfile && slugs.has(profileSlug(e)));
  }, [board, follows]);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white pb-10">
      <header className="bg-ppa-navy px-4 pb-4 pt-5 text-white">
        <p className="text-[11px] font-semibold text-white/60">World Pickleball Rankings · {asOf}</p>
        <h1 className="mt-1 font-display text-[24px] font-bold uppercase leading-tight">Rankings</h1>
      </header>

      <div className="sticky top-0 z-10 border-b border-ppa-line bg-white/95 px-4 pb-2.5 pt-3 backdrop-blur">
        <div className="grid grid-cols-2 rounded-full bg-ppa-paper p-0.5">
          {divisions.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setKey(d.key)}
              className={`rounded-full py-2 text-[12px] font-bold uppercase tracking-[0.12em] ${
                d.key === key ? "bg-ppa-navy text-white" : "text-ppa-navy/55"
              }`}
            >
              {d.short}
            </button>
          ))}
        </div>
        <label className="mt-2.5 flex items-center gap-2 rounded-full border border-ppa-line px-3.5 py-2">
          <Search className="size-4 shrink-0 text-ppa-navy/40" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
            placeholder="Find a player"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-ppa-navy outline-none placeholder:text-ppa-navy/40"
          />
        </label>
      </div>

      <div className="px-4">
        {mine.length > 0 && !q && (
          <section className="mt-5">
            <h2 className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">Your players</h2>
            <ul className="divide-y divide-ppa-line rounded-xl bg-ppa-paper px-3">
              {mine.map((e) => (
                <Row key={`mine-${e.slug}`} e={e} />
              ))}
            </ul>
          </section>
        )}

        <section className="mt-5">
          {!q && (
            <h2 className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">
              Top {board?.entries.length ?? 0}
            </h2>
          )}
          {entries.length > 0 ? (
            <ul className="divide-y divide-ppa-line">
              {entries.map((e) => (
                <Row key={`${e.rank}-${e.slug}`} e={e} />
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-[14px] text-ppa-navy/60">
              {board?.entries.length ? `No one in the top ${board.entries.length} matches “${q}”.` : "Rankings are unavailable right now."}
            </p>
          )}
        </section>

        <Link
          href="/rankings/"
          className="mt-6 block rounded-xl border border-ppa-line py-3 text-center text-[12px] font-bold uppercase tracking-[0.12em] text-ppa-blue"
        >
          Full rankings and how points work →
        </Link>
      </div>
    </div>
  );
}
