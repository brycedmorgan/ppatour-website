"use server";

/**
 * Newsroom dashboard server actions. EVERY action calls requireEditor() first:
 * server actions are public POST endpoints, and proxy.ts is only the first gate.
 */
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkCredentials, endSession, requireEditor, startSession } from "@/lib/newsroom/auth";
import { NEWSROOM_PATH } from "@/lib/newsroom/session";
import {
  SETTINGS,
  getPost,
  listPosts,
  putPost,
  putSetting,
  removePost,
  type DashboardPost,
} from "@/lib/newsroom/store";
import {
  HOME_PB_SLOTS,
  blankPost,
  importablePosts,
  publishProblems,
  slugProblem,
} from "@/lib/newsroom/posts";
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
  await startSession(editor);
  redirect(`${NEWSROOM_PATH}/`);
}

export async function logout() {
  await endSession();
  redirect(`${NEWSROOM_PATH}/login/`);
}

/* ─────────────────────────────── posts ─────────────────────────────── */

export async function createPost() {
  const { sub } = await requireEditor();
  const post = blankPost(randomUUID(), sub);
  await putPost(post);
  redirect(`${NEWSROOM_PATH}/posts/${post.id}/`);
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
  await requireEditor();
  await removePost(id);
  refreshSite();
  redirect(`${NEWSROOM_PATH}/posts/`);
}

/**
 * Copies every hand-written code post (lib/news-articles.ts,
 * lib/news-posts-authored.ts) that isn't in the dashboard yet. Idempotent: run
 * it twice and the second run copies nothing. The dashboard copy then wins over
 * the code copy (lib/news.ts), so the site shows the same post either way.
 */
export async function importCodePosts(): Promise<{ imported: number; error?: string }> {
  const { sub } = await requireEditor();
  const toImport = importablePosts(await listPosts(), sub, randomUUID);
  try {
    for (const p of toImport) await putPost(p);
  } catch (err) {
    return { imported: 0, error: (err as Error).message };
  }
  refreshSite();
  revalidatePath(NEWSROOM_PATH, "layout");
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
