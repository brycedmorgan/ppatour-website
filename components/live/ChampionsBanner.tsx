"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Champion, ScoresResult } from "@/lib/scores-api";
import { playerInitials, playerPhoto } from "@/lib/player-photos";

/**
 * Champions banner for the completed state — one card per division showing the
 * gold-medal winner(s) with their headshots, pulled from /api/scores. Renders
 * nothing until at least one champion is decided.
 */
function ChampAvatar({ name }: { name: string }) {
  const src = playerPhoto(name);
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={72}
        height={72}
        className="size-16 shrink-0 rounded-full object-cover object-top ring-2 ring-ppa-yellow"
      />
    );
  }
  return (
    <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-ppa-navy text-sm font-bold text-white ring-2 ring-ppa-yellow/60">
      {playerInitials(name)}
    </span>
  );
}

export function ChampionsBanner({ eventId }: { eventId: string }) {
  const [champions, setChampions] = useState<Champion[]>([]);

  useEffect(() => {
    let active = true;
    fetch(`/api/scores?event=${encodeURIComponent(eventId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ScoresResult | null) => {
        if (active && d) setChampions(d.champions ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [eventId]);

  if (!champions.length) return null;

  return (
    <section id="champions" className="scroll-mt-[120px] bg-ppa-navy-deep text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="flex items-center gap-2.5">
          <span className="text-ppa-yellow">🏆</span>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
            Champions
          </p>
        </div>
        <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] sm:text-3xl">
          Your 2026 Champions
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {champions.map((c) => (
            <div
              key={c.divisionId}
              className="flex items-center gap-4 border border-ppa-yellow/30 bg-ppa-navy p-4"
            >
              <div className="flex shrink-0 -space-x-4">
                {c.players.map((p) => (
                  <ChampAvatar key={p} name={p} />
                ))}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-yellow">
                  {c.division}
                </p>
                {c.players.map((p) => (
                  <p
                    key={p}
                    className="mt-0.5 font-display text-lg uppercase leading-tight text-white"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
