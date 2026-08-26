"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Bracket, BracketDivision } from "@/lib/bracket-types";
import { BracketView } from "@/components/live/BracketView";

/**
 * Bracket panel for the live-scores area: a division picker + the selected
 * division's bracket, polled every 15s from /api/brackets (same live cadence as
 * the score ticker). Divisions load once; the chosen bracket refreshes on its
 * own interval. Double-elim divisions load a losers bracket (Winners/Losers
 * toggle); group+knockout round-robin divisions load their pool play (Round
 * Robin/Bracket toggle).
 */
const POLL_MS = 15000;

export function BracketPanel({
  eventId,
  fullPage = false,
  expandHref,
  initialDivision,
  light = false,
}: {
  eventId: string;
  /** Fill the viewport (dedicated /brackets page). */
  fullPage?: boolean;
  /** When set (in-section use), show a link to open the full-page bracket. */
  expandHref?: string;
  /** Division to select on load (deep-link into a specific bracket). */
  initialDivision?: string;
  /** Style the controls for a light/white background. */
  light?: boolean;
}) {
  const [divisions, setDivisions] = useState<BracketDivision[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [losers, setLosers] = useState<Bracket | null>(null);
  const [pools, setPools] = useState<Bracket | null>(null);
  const [view, setView] = useState<"main" | "losers" | "pools">("main");
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
        const next = initialDivision ?? divs[0]?.id ?? null;
        setSelected((prev) => prev ?? next);
        // Nothing to select means the draw fetch below never runs — drop the
        // spinner here or the panel spins forever on an event with no draw.
        if (!next) setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      active = false;
    };
  }, [eventId, initialDivision]);

  // Selected bracket — fetch + poll. Reset to the winners view on switch.
  useEffect(() => {
    if (!selected) return;
    let active = true;
    let first = true;
    const load = () =>
      fetch(`/api/brackets?event=${encodeURIComponent(eventId)}&division=${selected}`, {
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!active) return;
          // A 404 or a parse failure has to clear the spinner too — otherwise a
          // bad division id in the URL spins forever instead of saying so.
          if (d) {
            setBracket(d.bracket);
            setLosers(d.losers ?? null);
            setPools(d.pools ?? null);
            // Default view per division (once, so polling doesn't reset a
            // manual toggle) — round-robin events open on their pool play.
            if (first) {
              setView(d.pools ? "pools" : "main");
              first = false;
            }
          }
          setLoading(false);
        })
        .catch(() => {
          if (active) setLoading(false);
        });
    setLoading(true);
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [eventId, selected]);

  const shown =
    view === "losers" && losers ? losers : view === "pools" && pools ? pools : bracket;

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
                    ? light
                      ? "bg-ppa-blue text-white"
                      : "bg-white text-ppa-navy"
                    : light
                      ? "border border-ppa-line text-ppa-navy/60 hover:border-ppa-blue/50 hover:text-ppa-navy"
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
            className={`group shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] ${
              light ? "text-ppa-blue hover:text-ppa-navy" : "text-ppa-yellow hover:text-white"
            }`}
          >
            Full-Page Bracket{" "}
            <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">↗</span>
          </Link>
        )}
      </div>

      {/* Stage toggle — Winners/Losers for double-elim, or Round Robin/Bracket
          for group+knockout round-robin events (Finals "Top 8 Ranked"). */}
      {(() => {
        const options: { v: "main" | "losers" | "pools"; label: string }[] = losers
          ? [{ v: "main", label: "Winners" }, { v: "losers", label: "Losers" }]
          : pools
            ? [{ v: "pools", label: "Round Robin" }, { v: "main", label: "Bracket" }]
            : [];
        if (!options.length) return null;
        return (
          <div className={`mt-4 inline-flex rounded-full border p-0.5 ${light ? "border-ppa-line" : "border-white/15"}`}>
            {options.map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setView(o.v)}
                className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                  view === o.v
                    ? light
                      ? "bg-ppa-blue text-white"
                      : "bg-ppa-yellow text-ppa-navy"
                    : light
                      ? "text-ppa-navy/55 hover:text-ppa-navy"
                      : "text-white/60 hover:text-white"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        );
      })()}

      {/* Format caption (from BracketFormatID detection) */}
      {(() => {
        const sel = divisions.find((d) => d.id === selected);
        if (!sel) return null;
        const label =
          view === "pools"
            ? "Round robin — pool play"
            : view === "losers"
              ? "Losers bracket"
              : sel.type === "double-elim"
                ? "Double elimination"
                : sel.type === "round-robin"
                  ? "Round robin"
                  : "Single elimination";
        return (
          <p className={`mt-3 text-[11px] font-bold uppercase tracking-[0.16em] ${light ? "text-ppa-navy/40" : "text-white/40"}`}>
            {label}
          </p>
        );
      })()}

      {/* Bracket. A draw with no rounds is a real state — an upstream hiccup
          builds one, and so does an event whose draw isn't posted. Say so
          instead of rendering an empty box; the 15s poll heals it either way. */}
      <div className="mt-4">
        {loading ? (
          <div className={`flex h-[220px] items-center justify-center rounded-lg border ${light ? "border-ppa-line bg-ppa-paper" : "border-white/10 bg-ppa-navy-deep"}`}>
            <span
              aria-hidden
              className={`size-6 animate-spin rounded-full border-2 ${light ? "border-ppa-line border-t-ppa-blue" : "border-white/20 border-t-white"}`}
            />
          </div>
        ) : shown?.rounds.length ? (
          <BracketView bracket={shown} fullPage={fullPage} light={light} />
        ) : (
          <div className={`flex h-[220px] flex-col items-center justify-center gap-2 rounded-lg border px-6 text-center ${light ? "border-ppa-line bg-ppa-paper" : "border-white/10 bg-ppa-navy-deep"}`}>
            <p className={`text-[13px] font-bold uppercase tracking-[0.14em] ${light ? "text-ppa-navy" : "text-white"}`}>
              No draw to show yet
            </p>
            <p className={`text-[13px] ${light ? "text-ppa-navy/55" : "text-white/55"}`}>
              This page checks again every few seconds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
