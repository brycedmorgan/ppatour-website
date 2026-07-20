"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Bracket, BracketDivision } from "@/lib/bracket-types";
import { BracketView } from "@/components/live/BracketView";

/**
 * Bracket panel for the live-scores area: a division picker + the selected
 * division's bracket, polled every 15s from /api/brackets (same live cadence as
 * the score ticker). Divisions load once; the chosen bracket refreshes on its
 * own interval. Double-elim divisions also load a losers bracket and get a
 * Winners/Losers toggle.
 */
const POLL_MS = 15000;

export function BracketPanel({
  eventId,
  fullPage = false,
  expandHref,
  initialDivision,
}: {
  eventId: string;
  /** Fill the viewport (dedicated /brackets page). */
  fullPage?: boolean;
  /** When set (in-section use), show a link to open the full-page bracket. */
  expandHref?: string;
  /** Division to select on load (deep-link into a specific bracket). */
  initialDivision?: string;
}) {
  const [divisions, setDivisions] = useState<BracketDivision[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [losers, setLosers] = useState<Bracket | null>(null);
  const [stage, setStage] = useState<"winners" | "losers">("winners");
  const [loading, setLoading] = useState(true);

  // Division list — once.
  useEffect(() => {
    let active = true;
    fetch(`/api/brackets?event=${encodeURIComponent(eventId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return;
        const divs: BracketDivision[] = d.divisions ?? [];
        setDivisions(divs);
        setSelected((prev) => prev ?? initialDivision ?? divs[0]?.id ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [eventId, initialDivision]);

  // Selected bracket — fetch + poll. Reset to the winners view on switch.
  useEffect(() => {
    if (!selected) return;
    let active = true;
    setStage("winners");
    const load = () =>
      fetch(`/api/brackets?event=${encodeURIComponent(eventId)}&division=${selected}`, {
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!active || !d) return;
          setBracket(d.bracket);
          setLosers(d.losers ?? null);
          setLoading(false);
        })
        .catch(() => {});
    setLoading(true);
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [eventId, selected]);

  const shown = stage === "losers" && losers ? losers : bracket;

  const fullHref =
    expandHref && selected
      ? `${expandHref}${expandHref.includes("?") ? "&" : "?"}division=${selected}`
      : expandHref;

  return (
    <div>
      {/* Division picker + optional "open full page" link */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {divisions.map((d) => {
            const active = d.id === selected;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelected(d.id)}
                className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                  active
                    ? "bg-white text-ppa-navy"
                    : "border border-white/20 text-white/70 hover:border-white/50 hover:text-white"
                }`}
              >
                {d.name}
              </button>
            );
          })}
        </div>
        {fullHref && (
          <Link
            href={fullHref}
            className="group shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-yellow hover:text-white"
          >
            Full-Page Bracket{" "}
            <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">↗</span>
          </Link>
        )}
      </div>

      {/* Winners / Losers toggle — only for double-elim (losers bracket present) */}
      {losers && (
        <div className="mt-4 inline-flex rounded-full border border-white/15 p-0.5">
          {(["winners", "losers"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStage(s)}
              className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                stage === s ? "bg-ppa-yellow text-ppa-navy" : "text-white/60 hover:text-white"
              }`}
            >
              {s === "winners" ? "Winners" : "Losers"}
            </button>
          ))}
        </div>
      )}

      {/* Format caption (from BracketFormatID detection) */}
      {(() => {
        const sel = divisions.find((d) => d.id === selected);
        if (!sel) return null;
        const label =
          sel.type === "double-elim"
            ? "Double elimination"
            : sel.type === "round-robin"
              ? "Round robin"
              : "Single elimination";
        return (
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
            {label}
          </p>
        );
      })()}

      {/* Bracket */}
      <div className="mt-4">
        {loading || !shown ? (
          <div className="flex h-[220px] items-center justify-center rounded-lg border border-white/10 bg-ppa-navy-deep">
            <span
              aria-hidden
              className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-white"
            />
          </div>
        ) : (
          <BracketView bracket={shown} fullPage={fullPage} />
        )}
      </div>
    </div>
  );
}
