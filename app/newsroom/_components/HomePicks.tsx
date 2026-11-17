"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Pin, X } from "lucide-react";
import type { PbArticle, PbNewsPage } from "@/lib/pb-news";
import { browsePickleballNews, saveHomePicks } from "../actions";

function date(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Thumb({ a }: { a: PbArticle }) {
  return a.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={a.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
  ) : (
    <span className="block size-full bg-ppa-navy" />
  );
}

const FEED_ERRORS: Record<string, string> = {
  unconfigured: "The pickleball.com feed isn't connected here (no API token).",
  denied: "pickleball.com refused the request (API token not authorized here).",
  error: "pickleball.com didn't answer. Try again in a minute.",
};

export function HomePicks({
  initialPins,
  initialFeed,
  slots,
}: {
  initialPins: PbArticle[];
  initialFeed: PbNewsPage;
  slots: number;
}) {
  const [pins, setPins] = useState(initialPins);
  const [saved, setSaved] = useState(() => JSON.stringify(initialPins));
  const [feed, setFeed] = useState(initialFeed);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, startSave] = useTransition();
  const [loading, startLoad] = useTransition();
  const dirty = JSON.stringify(pins) !== saved;
  const pinned = new Set(pins.map((p) => p.url));

  const move = (i: number, by: number) =>
    setPins((p) => {
      const next = [...p];
      const [item] = next.splice(i, 1);
      next.splice(i + by, 0, item);
      return next;
    });

  function save() {
    setMessage(null);
    startSave(async () => {
      const res = await saveHomePicks(pins);
      if (!res.ok) return setMessage({ ok: false, text: res.error });
      setPins(res.pins);
      setSaved(JSON.stringify(res.pins));
      setMessage({ ok: true, text: "Saved. The home page shows these now." });
    });
  }

  const go = (page: number) => startLoad(async () => setFeed(await browsePickleballNews(page)));

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
      {/* ── The slots ─────────────────────────────── */}
      <section className="self-start lg:sticky lg:top-6">
        <h2 className="mb-3 font-display text-lg uppercase">On the home page</h2>
        <ol className="space-y-2">
          {Array.from({ length: slots }, (_, i) => {
            const a = pins[i];
            return (
              <li key={a?.url ?? `empty-${i}`} className="flex items-stretch gap-2 border border-ppa-line bg-white">
                <span className="flex w-8 shrink-0 items-center justify-center bg-ppa-navy font-display text-white">
                  {i + 1}
                </span>
                {a ? (
                  <>
                    <span className="my-2 aspect-square w-14 shrink-0 overflow-hidden">
                      <Thumb a={a} />
                    </span>
                    <span className="min-w-0 flex-1 py-2">
                      <span className="line-clamp-2 text-sm font-semibold leading-snug">{a.title}</span>
                      <span className="text-xs text-ppa-navy/55">{date(a.publishedAt)}</span>
                    </span>
                    <span className="flex flex-col justify-center pr-1">
                      <button type="button" aria-label={`Move “${a.title}” up`} disabled={i === 0} onClick={() => move(i, -1)} className="p-1 hover:text-ppa-blue disabled:opacity-25">
                        <ArrowUp className="size-4" aria-hidden />
                      </button>
                      <button type="button" aria-label={`Move “${a.title}” down`} disabled={i === pins.length - 1} onClick={() => move(i, 1)} className="p-1 hover:text-ppa-blue disabled:opacity-25">
                        <ArrowDown className="size-4" aria-hidden />
                      </button>
                    </span>
                    <button
                      type="button"
                      aria-label={`Unpin “${a.title}”`}
                      onClick={() => setPins((p) => p.filter((x) => x.url !== a.url))}
                      className="px-2 hover:bg-ppa-paper hover:text-red-700"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </>
                ) : (
                  <span className="flex-1 px-2 py-4 text-sm italic text-ppa-navy/50">
                    Newest article fills this slot
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="bg-ppa-blue px-4 py-2 text-sm font-bold uppercase tracking-[0.1em] text-white hover:bg-ppa-blue-deep disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {pins.length > 0 && (
            <button type="button" onClick={() => setPins([])} className="text-sm text-ppa-navy/65 hover:text-ppa-navy">
              Clear all pins
            </button>
          )}
        </div>
        {message && (
          <p role={message.ok ? "status" : "alert"} className={`mt-2 text-sm font-semibold ${message.ok ? "text-ppa-blue-deep" : "text-red-700"}`}>
            {message.text}
          </p>
        )}
      </section>

      {/* ── The pickleball.com feed ─────────────────────────────── */}
      <section aria-busy={loading}>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg uppercase">pickleball.com PPA news</h2>
          {feed.source === "live" && (
            <span className="text-xs text-ppa-navy/55">
              Page {feed.page} of {feed.totalPages} · {feed.total.toLocaleString()} articles
            </span>
          )}
        </div>
        {feed.source !== "live" ? (
          <p className="border border-ppa-line bg-white p-6 text-sm text-ppa-navy/70">
            {FEED_ERRORS[feed.source] ?? FEED_ERRORS.error}
          </p>
        ) : (
          <>
            <ul className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3 ${loading ? "opacity-50" : ""}`}>
              {feed.articles.map((a) => {
                const isPinned = pinned.has(a.url);
                const full = pins.length >= slots;
                return (
                  <li key={a.url} className="flex flex-col border border-ppa-line bg-white">
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="block aspect-[16/9] overflow-hidden" aria-label={`Open “${a.title}” on pickleball.com`}>
                      <Thumb a={a} />
                    </a>
                    <div className="flex flex-1 flex-col p-3">
                      <p className="line-clamp-3 text-sm font-semibold leading-snug">{a.title}</p>
                      <p className="mt-1 text-xs text-ppa-navy/55">{date(a.publishedAt)}</p>
                      <button
                        type="button"
                        disabled={isPinned || full}
                        onClick={() => setPins((p) => [...p, a])}
                        className={`mt-3 inline-flex items-center justify-center gap-1 self-start px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] ${
                          isPinned ? "bg-ppa-blue text-white" : "border border-ppa-navy hover:bg-ppa-paper disabled:opacity-40"
                        }`}
                      >
                        <Pin className="size-3.5" aria-hidden />
                        {isPinned ? "Pinned" : full ? "Slots full" : "Pin"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between">
              <button type="button" disabled={loading || feed.page <= 1} onClick={() => go(feed.page - 1)} className="border border-ppa-line bg-white px-3 py-1.5 text-sm font-semibold hover:border-ppa-blue disabled:opacity-40">
                ← Newer
              </button>
              <button type="button" disabled={loading || feed.page >= feed.totalPages} onClick={() => go(feed.page + 1)} className="border border-ppa-line bg-white px-3 py-1.5 text-sm font-semibold hover:border-ppa-blue disabled:opacity-40">
                Older →
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
