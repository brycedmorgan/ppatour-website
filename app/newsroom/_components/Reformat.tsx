"use client";

import { useState, useTransition } from "react";
import { Sparkles, Undo2, X } from "lucide-react";
import { reformatPostBody } from "../actions";

type Suggestion = { html: string; changes: string[]; removed: string[] };

/**
 * "Reformat" next to the Body label: asks for a cleaner structure (headings,
 * lists, clutter out) without changing the wording, then shows before/after.
 * Apply puts it in the editor (unsaved); Undo puts the old body back.
 */
export function Reformat({
  body,
  title,
  dek,
  author,
  ctaLabel,
  onApply,
}: {
  body: string;
  title: string;
  dek: string;
  author: string;
  ctaLabel: string;
  onApply: (html: string) => void;
}) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"after" | "before">("after");
  const [pending, start] = useTransition();

  function run() {
    setError(null);
    setSuggestion(null);
    start(async () => {
      const res = await reformatPostBody({ bodyHtml: body, title, dek, author, ctaLabel });
      if (!res.ok) return setError(res.error);
      setView("after");
      setSuggestion({ html: res.html, changes: res.changes, removed: res.removed });
    });
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {previous !== null && !suggestion && (
          <button
            type="button"
            onClick={() => {
              onApply(previous);
              setPrevious(null);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-ppa-navy/70 hover:text-ppa-navy"
          >
            <Undo2 className="size-3.5" aria-hidden /> Undo reformat
          </button>
        )}
        <button
          type="button"
          onClick={run}
          disabled={pending || !body.replace(/<[^>]*>/g, "").trim()}
          className="inline-flex items-center gap-1.5 border border-ppa-blue px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-ppa-blue hover:bg-ppa-blue hover:text-white disabled:opacity-50"
        >
          <Sparkles className="size-3.5" aria-hidden />
          {pending ? "Reformatting…" : "Reformat"}
        </button>
      </div>

      {(pending || error || suggestion) && (
        <div className="col-span-full mt-2 basis-full">
          {pending && (
            <p role="status" className="border border-ppa-line bg-white p-3 text-sm text-ppa-blue">
              Reading the post and tidying its structure. This can take up to a minute…
            </p>
          )}
          {error && (
            <p role="alert" className="border-l-4 border-red-700 bg-white p-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
          {suggestion && (
            <section aria-label="Reformat suggestion" className="border-2 border-ppa-blue bg-white">
              <div className="flex flex-wrap items-center gap-2 border-b border-ppa-line px-3 py-2">
                <Sparkles className="size-4 text-ppa-blue" aria-hidden />
                <p className="text-sm font-semibold">Suggested formatting. The wording is unchanged.</p>
                <div className="ml-auto flex" role="group" aria-label="Show">
                  {(["after", "before"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={view === v}
                      onClick={() => setView(v)}
                      className={`px-2.5 py-1 text-xs font-semibold ${view === v ? "bg-ppa-navy text-white" : "border border-ppa-line"}`}
                    >
                      {v === "after" ? "New" : "Current"}
                    </button>
                  ))}
                </div>
              </div>
              {suggestion.changes.length > 0 && (
                <ul className="list-disc space-y-0.5 border-b border-ppa-line px-3 py-2 pl-8 text-sm text-ppa-navy/80">
                  {suggestion.changes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              )}
              {suggestion.removed.length > 0 && (
                <div className="border-b border-ppa-line bg-ppa-paper px-3 py-2 text-sm">
                  <p className="font-semibold">Removed from the body:</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ppa-navy/75">
                    {suggestion.removed.map((r, i) => (
                      <li key={i} className="line-through decoration-red-700/60">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div
                className="nr-prose max-h-[28rem] overflow-y-auto p-4"
                // Our own HTML from the editor or the checked suggestion; the
                // public page sanitizes again on output.
                dangerouslySetInnerHTML={{ __html: view === "after" ? suggestion.html : body }}
              />
              <div className="flex gap-2 border-t border-ppa-line px-3 py-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrevious(body);
                    onApply(suggestion.html);
                    setSuggestion(null);
                  }}
                  className="bg-ppa-blue px-3 py-1.5 text-sm font-bold uppercase tracking-[0.08em] text-white hover:bg-ppa-blue-deep"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestion(null)}
                  className="inline-flex items-center gap-1 border border-ppa-line px-3 py-1.5 text-sm font-semibold hover:border-ppa-navy"
                >
                  <X className="size-4" aria-hidden /> Discard
                </button>
                <span className="ml-auto self-center text-xs text-ppa-navy/55">
                  Applying changes the editor only. Save to keep it.
                </span>
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
