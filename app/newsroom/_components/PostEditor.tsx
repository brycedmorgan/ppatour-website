"use client";

import { useEffect, useId, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, ExternalLink, Trash2 } from "lucide-react";
import type { DashboardPost } from "@/lib/newsroom/store";
import { useBase } from "./BaseContext";
import { deletePost, savePost, type PostInput } from "../actions";
import { ImageField } from "./ImageField";
import { RichText } from "./RichText";

type Draft = PostInput;

function toDraft(p: DashboardPost): Draft {
  return {
    slug: p.slug, status: p.status, category: p.category, title: p.title, subtitle: p.subtitle,
    dek: p.dek, author: p.author, publishedAt: p.publishedAt, image: p.image,
    imageAlt: p.imageAlt, imagePosition: p.imagePosition, cardImage: p.cardImage,
    heroGraphic: p.heroGraphic, whyItMatters: p.whyItMatters, eventSlug: p.eventSlug,
    ctaUrl: p.ctaUrl, ctaLabel: p.ctaLabel, players: p.players, tags: p.tags,
    bodyHtml: p.bodyHtml, seoTitle: p.seoTitle, seoDescription: p.seoDescription,
  };
}

/** ISO → value for <input type="datetime-local">, in the browser's zone. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/, "");
}

const input =
  "mt-1 w-full border border-ppa-line bg-white px-3 py-2 text-sm focus:border-ppa-blue focus:outline-none";

function Field({
  label,
  help,
  count,
  max,
  children,
  id,
}: {
  label: string;
  help?: string;
  count?: number;
  max?: number;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        {count !== undefined && max !== undefined && (
          <span className={`text-xs ${count > max ? "font-bold text-red-700" : "text-ppa-navy/50"}`}>
            {count}/{max}
          </span>
        )}
      </div>
      {children}
      {help && <p className="mt-1 text-xs text-ppa-navy/55">{help}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border border-ppa-line bg-white p-4">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-blue">{title}</h2>
      {children}
    </section>
  );
}

export function PostEditor({
  post: initial,
  categories,
  events,
}: {
  post: DashboardPost;
  categories: string[];
  events: { slug: string; name: string }[];
}) {
  const base = useBase();
  const [post, setPost] = useState(initial);
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [saved, setSaved] = useState(() => JSON.stringify(toDraft(initial)));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const id = useId();
  const f = (name: string) => `${id}-${name}`;

  const dirty = JSON.stringify(draft) === saved ? false : true;
  const isLive = post.status === "published";
  // A brand-new post's URL follows its headline until someone edits the URL or
  // it has been published once (a live URL must not move by accident).
  const [slugTouched, setSlugTouched] = useState(
    () => !initial.slug.startsWith("untitled-") || initial.status === "published",
  );

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  function save(status: Draft["status"]) {
    setMessage(null);
    start(async () => {
      const res = await savePost(post.id, { ...draft, status });
      if (!res.ok) {
        setMessage({ ok: false, text: res.error });
        return;
      }
      const next = toDraft(res.post);
      setPost(res.post);
      setDraft(next);
      setSaved(JSON.stringify(next));
      setMessage({
        ok: true,
        text:
          status === "published"
            ? isLive
              ? "Updated. The live post is refreshed."
              : "Published. It's live on the site now."
            : isLive
              ? "Unpublished. The post is hidden from the site."
              : "Draft saved.",
      });
    });
  }

  // Ctrl/Cmd+S saves without changing the status; warn before leaving unsaved.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!pending) save(post.status);
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  });

  const liveUrl = `/${post.slug}/`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`${base}/posts/`}
          className="inline-flex items-center gap-1 text-sm text-ppa-navy/65 hover:text-ppa-navy"
        >
          <ArrowLeft className="size-4" aria-hidden /> Posts
        </Link>
        <span
          className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
            isLive ? "bg-ppa-blue text-white" : "bg-ppa-yellow text-ppa-navy"
          }`}
        >
          {isLive ? "Live" : "Draft"}
        </span>
        {dirty && <span className="text-xs font-semibold text-ppa-navy/60">Unsaved changes</span>}
        <span className="ml-auto text-xs text-ppa-navy/50">
          Last saved {new Date(post.updatedAt).toLocaleString("en-US")} by {post.updatedBy}
        </span>
      </div>

      {post.docImport && !isLive && (
        <section className="mt-4 border-l-4 border-ppa-yellow bg-white px-4 py-3 text-sm">
          <p className="font-semibold">
            Filled from “{post.docImport.name}”. Check every field against the doc before publishing.
          </p>
          {post.docImport.aiWritten.length > 0 && (
            <p className="mt-1">
              Written by AI, not copied from the doc:{" "}
              <strong>{post.docImport.aiWritten.map((f) => (f === "dek" ? "Summary (dek)" : f)).join(", ")}</strong>.
            </p>
          )}
          {post.docImport.notes.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-ppa-navy/80">
              {post.docImport.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`mt-4 border-l-4 bg-white px-4 py-3 text-sm font-semibold ${
            message.ok ? "border-ppa-blue" : "border-red-700 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ── The story ─────────────────────────────────────────── */}
        <div className="min-w-0 space-y-4">
          <div>
            <label htmlFor={f("title")} className="sr-only">
              Headline
            </label>
            <textarea
              id={f("title")}
              rows={3}
              value={draft.title}
              placeholder="Headline"
              onChange={(e) => {
                const title = e.target.value.replace(/\n/g, " ");
                set(slugTouched ? { title } : { title, slug: slugify(title) || draft.slug });
              }}
              className="field-sizing-content w-full resize-none border-0 border-b-2 border-ppa-line bg-transparent px-0 py-2 font-display text-3xl uppercase leading-tight focus:border-ppa-blue focus:outline-none"
            />
          </div>
          <Field id={f("subtitle")} label="Standfirst" help="Optional line under the headline (dates, venue). Not used in search results.">
            <input id={f("subtitle")} className={input} value={draft.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
          </Field>
          <Field
            id={f("dek")}
            label="Summary (dek)"
            help="Shown on cards and at the top of the post. Used for search results and shares when no SEO description is set."
            count={draft.dek.length}
            max={200}
          >
            <textarea id={f("dek")} rows={3} className={`${input} field-sizing-content`} value={draft.dek} onChange={(e) => set({ dek: e.target.value })} />
          </Field>
          <Field id={f("why")} label="Why It Matters" help="Optional callout above the body. Leave empty for none.">
            <textarea id={f("why")} rows={2} className={`${input} field-sizing-content`} value={draft.whyItMatters} onChange={(e) => set({ whyItMatters: e.target.value })} />
          </Field>
          <div>
            <p className="mb-1 text-sm font-semibold">Body</p>
            <RichText value={draft.bodyHtml} onChange={(bodyHtml) => set({ bodyHtml })} />
            <p className="mt-1 text-xs text-ppa-navy/55">
              Player names link to their profiles automatically on the site.
            </p>
          </div>
        </div>

        {/* ── Settings ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <Panel title="Publish">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => save("published")}
                className="flex-1 bg-ppa-blue px-3 py-2 text-sm font-bold uppercase tracking-[0.1em] text-white hover:bg-ppa-blue-deep disabled:opacity-60"
              >
                {pending ? "Saving…" : isLive ? "Update" : "Publish"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => save("draft")}
                className="flex-1 border border-ppa-navy px-3 py-2 text-sm font-bold uppercase tracking-[0.1em] hover:bg-ppa-paper disabled:opacity-60"
              >
                {isLive ? "Unpublish" : "Save draft"}
              </button>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <a
                href={`${base}/posts/${post.id}/preview/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-ppa-blue hover:underline"
              >
                <Eye className="size-4" aria-hidden /> Preview{dirty ? " (save first)" : ""}
              </a>
              {isLive && (
                <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-ppa-blue hover:underline">
                  <ExternalLink className="size-4" aria-hidden /> View live
                </a>
              )}
            </div>
            <Field id={f("date")} label="Publish date" help="Shown on the post and sets its place in the feed.">
              <input
                id={f("date")}
                type="datetime-local"
                className={input}
                value={toLocalInput(draft.publishedAt)}
                onChange={(e) => e.target.value && set({ publishedAt: new Date(e.target.value).toISOString() })}
              />
            </Field>
            <Field
              id={f("slug")}
              label="URL"
              help={isLive ? "Changing a live post's URL breaks links already shared." : "ppatour.com/<this>/"}
            >
              <input
                id={f("slug")}
                className={`${input} font-mono`}
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set({ slug: e.target.value.toLowerCase() });
                }}
              />
            </Field>
          </Panel>

          <Panel title="Details">
            <Field id={f("cat")} label="Category">
              <input id={f("cat")} list={f("cats")} className={input} value={draft.category} onChange={(e) => set({ category: e.target.value })} />
              <datalist id={f("cats")}>
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field id={f("author")} label="Byline" help="Leave empty for “PPA Tour”. Name a person only when they wrote it.">
              <input id={f("author")} className={input} value={draft.author} onChange={(e) => set({ author: e.target.value })} />
            </Field>
            <Field id={f("event")} label="Tour stop" help="Optional. Shows the post under Coverage on that event page.">
              <input id={f("event")} list={f("events")} className={`${input} font-mono`} value={draft.eventSlug} onChange={(e) => set({ eventSlug: e.target.value.trim() })} />
              <datalist id={f("events")}>
                {events.map((ev) => (
                  <option key={ev.slug} value={ev.slug}>
                    {ev.name}
                  </option>
                ))}
              </datalist>
            </Field>
            <Field id={f("tags")} label="Topics" help="Comma-separated. Shown under the post.">
              <input
                id={f("tags")}
                className={input}
                value={draft.tags.join(", ")}
                onChange={(e) => set({ tags: e.target.value.split(",").map((t) => t.trimStart()) })}
                onBlur={() => set({ tags: draft.tags.map((t) => t.trim()).filter(Boolean) })}
              />
            </Field>
          </Panel>

          <Panel title="Images">
            <ImageField
              label="Hero image"
              value={draft.image}
              onChange={(image) => set({ image })}
              position={draft.imagePosition}
            />
            <Field id={f("alt")} label="Hero image description" help="For screen readers. Describe the scene; skip names you aren't sure of.">
              <input id={f("alt")} className={input} value={draft.imageAlt} onChange={(e) => set({ imageAlt: e.target.value })} />
            </Field>
            <Field id={f("pos")} label="Hero focus" help="Where the crop centres, e.g. “50% 30%” to keep faces in a wide hero.">
              <input id={f("pos")} className={input} value={draft.imagePosition} placeholder="50% 50%" onChange={(e) => set({ imagePosition: e.target.value })} />
            </Field>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={draft.heroGraphic} onChange={(e) => set({ heroGraphic: e.target.checked })} />
              <span>
                <span className="font-semibold">Hero is a designed graphic</span>
                <span className="block text-xs text-ppa-navy/55">Shows it whole with the headline below, instead of over it.</span>
              </span>
            </label>
            <ImageField
              label="Card image (optional)"
              help="Used on the home page and news cards when the hero crops badly there."
              value={draft.cardImage}
              onChange={(cardImage) => set({ cardImage })}
            />
          </Panel>

          <Panel title="Button at the end">
            <Field id={f("cta")} label="Link" help="Leave empty to sell tickets to the next tour stop.">
              <input id={f("cta")} className={input} value={draft.ctaUrl} placeholder="https://…" onChange={(e) => set({ ctaUrl: e.target.value })} />
            </Field>
            <Field id={f("ctal")} label="Button text">
              <input id={f("ctal")} className={input} value={draft.ctaLabel} onChange={(e) => set({ ctaLabel: e.target.value })} />
            </Field>
          </Panel>

          <Panel title="Search & sharing">
            <Field id={f("seot")} label="SEO title" help="Leave empty to use the headline." count={draft.seoTitle.length} max={60}>
              <input id={f("seot")} className={input} value={draft.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} />
            </Field>
            <Field id={f("seod")} label="SEO description" help="Leave empty to use the summary." count={draft.seoDescription.length} max={160}>
              <textarea id={f("seod")} rows={3} className={input} value={draft.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} />
            </Field>
          </Panel>

          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Delete “${post.title || "Untitled post"}”? This can't be undone.`)) return;
              start(() => deletePost(post.id));
            }}
            className="inline-flex items-center gap-1 text-sm text-red-700 hover:underline"
          >
            <Trash2 className="size-4" aria-hidden /> Delete post
          </button>
          {post.importedFrom && (
            <p className="text-xs text-ppa-navy/50">
              Imported from the site&apos;s code. Deleting it here brings back the original
              version from code.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
