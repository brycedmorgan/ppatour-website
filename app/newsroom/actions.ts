"use server";

/**
 * Newsroom dashboard server actions. EVERY action calls requireEditor() first:
 * server actions are public POST endpoints, and proxy.ts is only the first gate.
 */
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkCredentials, endSession, requireEditor, startPending } from "@/lib/newsroom/auth";
import { hasFactor } from "@/lib/newsroom/mfa";
import { newsroomBase } from "@/lib/newsroom/session";
import {
  SETTINGS,
  getMfa,
  getPost,
  listPosts,
  putPost,
  putSetting,
  removePost,
  type DashboardPost,
} from "@/lib/newsroom/store";
import { del } from "@vercel/blob";
import {
  HOME_PB_SLOTS,
  blankPost,
  categoryOptions,
  eventOptions,
  importablePosts,
  publishProblems,
  slugProblem,
  slugify,
} from "@/lib/newsroom/posts";
import { ReformatError, reformatBody } from "@/lib/newsroom/reformat";
import { importSkipped } from "@/lib/newsroom/sync";
import {
  DocImportError,
  docxToBlocks,
  fetchGoogleDocAsDocx,
  fillFromBlocks,
} from "@/lib/newsroom/doc-import";
import type { HomePbPicks } from "@/lib/newsroom/published";
import { getPickleballNewsPage, type PbArticle } from "@/lib/pb-news";

/**
 * News reaches nearly every page (home lead + rails, /news, article rails,
 * event Coverage, search, sitemaps), so a change refreshes the whole site
 * lazily — the same call the daily rankings refresh makes.
 */
function refreshSite() {
  revalidatePath("/", "layout");
}

/* ─────────────────────────────── auth ─────────────────────────────── */

export async function login(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  let editor: string | null = null;
  try {
    editor = await checkCredentials(email, password);
  } catch (err) {
    return { error: (err as Error).message };
  }
  if (!editor) {
    await new Promise((r) => setTimeout(r, 1000)); // slow down guessing
    return { error: "Incorrect email or password." };
  }
  // The password is only step one. First sign-in sets up a passkey or an
  // authenticator app; every sign-in after that asks for it.
  await startPending(editor);
  const m = await getMfa(editor);
  redirect(`${newsroomBase()}/${hasFactor(m) ? "verify" : "setup"}/`);
}

export async function logout() {
  await endSession();
  redirect(`${newsroomBase()}/login/`);
}

/* ─────────────────────────────── posts ─────────────────────────────── */

export async function createPost() {
  const { sub } = await requireEditor();
  const post = blankPost(randomUUID(), sub);
  await putPost(post);
  redirect(`${newsroomBase()}/posts/${post.id}/`);
}

/**
 * "Reformat": a suggested restructure of the body (headings, lists, clutter
 * removed) that never changes the writer's wording (lib/newsroom/reformat.ts).
 * Returns the suggestion; nothing is saved until the editor applies and saves.
 */
export async function reformatPostBody(input: {
  bodyHtml: string;
  title: string;
  dek: string;
  author: string;
  ctaLabel: string;
}): Promise<{ ok: true; html: string; changes: string[]; removed: string[] } | { ok: false; error: string }> {
  await requireEditor();
  try {
    const res = await reformatBody({
      bodyHtml: String(input.bodyHtml ?? "").slice(0, 400_000),
      title: String(input.title ?? "").slice(0, 300),
      dek: String(input.dek ?? "").slice(0, 600),
      author: String(input.author ?? "").slice(0, 120),
      ctaLabel: String(input.ctaLabel ?? "").slice(0, 80),
    });
    return { ok: true, ...res };
  } catch (err) {
    if (err instanceof ReformatError) return { ok: false, error: err.message };
    console.error("[newsroom] reformat failed:", err);
    return { ok: false, error: "Couldn't reformat this post. Try again in a minute." };
  }
}

/** A Word file the editor uploaded for import: only our own Blob store, only that folder. */
function isOwnDocUpload(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".public.blob.vercel-storage.com") &&
      u.pathname.startsWith("/newsroom/doc-uploads/")
    );
  } catch {
    return false;
  }
}

/**
 * "Start from a Google Doc": a Google Docs link, or a .docx the browser has
 * already uploaded to Blob. Reads it, fills a DRAFT (lib/newsroom/doc-import.ts)
 * and opens it in the editor. Never publishes.
 */
export async function createPostFromDoc(input: {
  url?: string;
  upload?: { blobUrl: string; name: string };
}): Promise<{ error: string } | undefined> {
  const { sub } = await requireEditor();
  let docx: { buffer: Buffer; name: string };
  try {
    if (input.upload) {
      if (!isOwnDocUpload(input.upload.blobUrl)) return { error: "Unexpected upload address." };
      const res = await fetch(input.upload.blobUrl, { cache: "no-store" });
      if (!res.ok) return { error: "Couldn't read the uploaded file. Try uploading it again." };
      docx = {
        buffer: Buffer.from(await res.arrayBuffer()),
        name: String(input.upload.name || "Word document").replace(/\.docx$/i, "").slice(0, 200),
      };
      // The doc was only needed to read it; images inside are kept separately.
      await del(input.upload.blobUrl).catch(() => {});
    } else if (input.url) {
      docx = await fetchGoogleDocAsDocx(String(input.url));
    } else {
      return { error: "Paste a Google Docs link or choose a Word file." };
    }

    const blocks = await docxToBlocks(docx.buffer);
    const fill = await fillFromBlocks(blocks, {
      categories: await categoryOptions(),
      events: eventOptions(),
    });

    const id = randomUUID();
    const base = blankPost(id, sub);
    const others = await listPosts();
    // The headline makes the URL; if it's taken, keep the safe "untitled" one.
    const wanted = slugify(fill.title);
    const slug = wanted && !slugProblem(wanted, { ...base, slug: wanted }, others) ? wanted : base.slug;

    await putPost({
      ...base,
      slug,
      title: fill.title,
      subtitle: fill.subtitle,
      dek: fill.dek,
      author: fill.author,
      category: fill.category,
      whyItMatters: fill.whyItMatters,
      eventSlug: fill.eventSlug,
      tags: fill.tags,
      ctaUrl: fill.ctaUrl,
      ctaLabel: fill.ctaLabel,
      image: fill.image,
      imageAlt: fill.imageAlt,
      bodyHtml: fill.bodyHtml,
      docImport: {
        name: docx.name,
        method: fill.method,
        notes: fill.notes,
        aiWritten: fill.aiWritten,
        at: new Date().toISOString(),
      },
    });
    redirect(`${newsroomBase()}/posts/${id}/`);
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    if (err instanceof DocImportError) return { error: err.message };
    console.error("[newsroom] doc import failed:", err);
    return { error: "Couldn't read that document. If it's a Word file, try saving it again as .docx." };
  }
}

/** The fields the editor sends. Everything else is server-owned. */
export type PostInput = Omit<
  DashboardPost,
  "id" | "importedFrom" | "createdAt" | "updatedAt" | "updatedBy"
>;

const str = (v: unknown, max = 5000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const strList = (v: unknown) =>
  Array.isArray(v) ? [...new Set(v.map((x) => str(x, 120)).filter(Boolean))].slice(0, 60) : [];

/** A link the site may send a reader to: an https URL or a path on this site. */
function safeUrl(v: unknown): string {
  const s = str(v, 2000);
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.toString() : "";
  } catch {
    return "";
  }
}

export async function savePost(
  id: string,
  input: PostInput,
): Promise<{ ok: true; post: DashboardPost } | { ok: false; error: string }> {
  const { sub } = await requireEditor();
  const existing = await getPost(id);
  if (!existing) return { ok: false, error: "This post no longer exists." };

  const publishedAt = new Date(str(input.publishedAt, 40));
  const next: DashboardPost = {
    ...existing,
    slug: str(input.slug, 90).toLowerCase(),
    status: input.status === "published" ? "published" : "draft",
    category: str(input.category, 60),
    title: str(input.title, 300),
    subtitle: str(input.subtitle, 400),
    dek: str(input.dek, 600),
    author: str(input.author, 120),
    publishedAt: Number.isNaN(publishedAt.getTime()) ? existing.publishedAt : publishedAt.toISOString(),
    image: safeUrl(input.image),
    imageAlt: str(input.imageAlt, 300),
    imagePosition: str(input.imagePosition, 40).replace(/[^\w\s%.-]/g, ""),
    cardImage: safeUrl(input.cardImage),
    heroGraphic: Boolean(input.heroGraphic),
    whyItMatters: str(input.whyItMatters, 1000),
    eventSlug: str(input.eventSlug, 120),
    ctaUrl: safeUrl(input.ctaUrl),
    ctaLabel: str(input.ctaLabel, 80),
    players: strList(input.players),
    tags: strList(input.tags),
    // Stored as written; sanitized on output by renderPostHtml (allowlist).
    bodyHtml: typeof input.bodyHtml === "string" ? input.bodyHtml.slice(0, 400_000) : "",
    seoTitle: str(input.seoTitle, 120),
    seoDescription: str(input.seoDescription, 320),
    updatedAt: new Date().toISOString(),
    updatedBy: sub,
  };

  const others = await listPosts();
  const slugError = slugProblem(next.slug, next, others);
  if (slugError) return { ok: false, error: slugError };
  if (next.status === "published") {
    const missing = publishProblems(next);
    if (missing.length) return { ok: false, error: `To publish, add ${missing.join(", ")}.` };
  }

  try {
    await putPost(next);
  } catch (err) {
    return { ok: false, error: `Couldn't save: ${(err as Error).message}` };
  }
  refreshSite();
  return { ok: true, post: next };
}

export async function deletePost(id: string) {
  const { sub } = await requireEditor();
  const post = await getPost(id);
  // A deleted IMPORT hands its URL back to the code copy; keep the auto-sync
  // (lib/newsroom/sync.ts) from copying it straight back in.
  if (post?.importedFrom) {
    const skip = await importSkipped();
    if (!skip.has(post.importedFrom.slug)) {
      await putSetting(SETTINGS.importSkipped, { slugs: [...skip, post.importedFrom.slug] }, sub);
    }
  }
  await removePost(id);
  refreshSite();
  redirect(`${newsroomBase()}/posts/`);
}

/**
 * Copies every hand-written code post (lib/news-articles.ts,
 * lib/news-posts-authored.ts) that isn't in the dashboard yet. Idempotent: run
 * it twice and the second run copies nothing. The dashboard copy then wins over
 * the code copy (lib/news.ts), so the site shows the same post either way.
 */
export async function importCodePosts(): Promise<{ imported: number; error?: string }> {
  const { sub } = await requireEditor();
  const toImport = importablePosts(await listPosts(), sub, randomUUID, await importSkipped());
  try {
    for (const p of toImport) await putPost(p);
  } catch (err) {
    return { imported: 0, error: (err as Error).message };
  }
  refreshSite();
  return { imported: toImport.length };
}

/* ───────────────────────── home page picks ───────────────────────── */

/** One page of pickleball.com's PPA feed, newest first, for the picker. */
export async function browsePickleballNews(page: number) {
  await requireEditor();
  return getPickleballNewsPage(Math.max(1, Math.floor(page) || 1), 24);
}

function cleanPick(a: PbArticle): PbArticle | null {
  const url = safeUrl(a?.url);
  // Only pickleball.com articles: the section is labelled as theirs.
  if (!/^https:\/\/(www\.)?pickleball\.com\//.test(url)) return null;
  const image = safeUrl(a.imageUrl);
  return {
    url,
    title: str(a.title, 300),
    excerpt: str(a.excerpt, 600),
    imageUrl: image || null,
    imageAlt: str(a.imageAlt, 300),
    author: str(a.author, 120) || null,
    publishedAt: str(a.publishedAt, 40),
    category: str(a.category, 60),
  };
}

export async function saveHomePicks(
  pins: PbArticle[],
): Promise<{ ok: true; pins: PbArticle[] } | { ok: false; error: string }> {
  const { sub } = await requireEditor();
  if (!Array.isArray(pins)) return { ok: false, error: "Invalid picks." };
  const clean = pins
    .map(cleanPick)
    .filter((a): a is PbArticle => a !== null && Boolean(a.title))
    .slice(0, HOME_PB_SLOTS);
  const value: HomePbPicks = { pins: clean };
  try {
    await putSetting(SETTINGS.homePbPicks, value, sub);
  } catch (err) {
    return { ok: false, error: `Couldn't save: ${(err as Error).message}` };
  }
  revalidatePath("/");
  return { ok: true, pins: clean };
}
