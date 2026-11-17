/**
 * Newsroom storage: dashboard posts + a few settings (the home page's
 * pickleball.com picks). SERVER-ONLY.
 *
 * Production: two Neon tables, created on first use (same idempotent pattern as
 * lib/pb-cache.ts — no migration step). A post is one jsonb `data` blob plus the
 * columns we query on, so adding a field never needs a migration.
 *
 * Local dev has no DATABASE_URL (see CLAUDE.md), so it falls back to a JSON file
 * at `.data/newsroom.json` (gitignored). Never used in production: a Vercel
 * function can't write its filesystem, and silently "saving" to /tmp would lose
 * an editor's work.
 *
 * ⚠ SQL MUST NOT GO THROUGH NEXT'S PATCHED fetch — the 9/28 finding in
 * lib/pb-cache.ts, where Neon queries on force-static routes were cached for a
 * year. Same fix here, and the home page and /news are exactly those routes.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { neon, neonConfig } from "@neondatabase/serverless";

neonConfig.fetchFunction = (input: RequestInfo | URL, init?: RequestInit) => {
  const f = globalThis.fetch as typeof fetch & { _nextOriginalFetch?: typeof fetch };
  return (f._nextOriginalFetch ?? f)(input, init);
};

export type PostStatus = "draft" | "published";

export type DashboardPost = {
  id: string;
  slug: string;
  status: PostStatus;
  category: string;
  title: string;
  /** Standfirst under the H1 (NewsArticle.subtitle). */
  subtitle: string;
  dek: string;
  /** "" = the "PPA Tour" house byline. */
  author: string;
  /** Full ISO timestamp. The sort key and the displayed date. */
  publishedAt: string;
  image: string;
  imageAlt: string;
  /** Hero-only CSS object-position, e.g. "50% 30%". "" = centred. */
  imagePosition: string;
  /** Different image for cards (home, /news, rails). "" = use `image`. */
  cardImage: string;
  /** The hero image is a designed graphic: show it whole, headline below. */
  heroGraphic: boolean;
  /** Optional "Why It Matters" callout. "" = none. */
  whyItMatters: string;
  /** Ties the post to a tour stop (event-page Coverage). */
  eventSlug: string;
  ctaUrl: string;
  ctaLabel: string;
  /** Featured athlete slugs, merged with auto-detected mentions. */
  players: string[];
  tags: string[];
  /** Rich HTML, sanitized on output by renderPostHtml (lib/news-html.ts). */
  bodyHtml: string;
  seoTitle: string;
  seoDescription: string;
  /** Set on posts copied in from code by "Import hand-written posts". */
  importedFrom: { kind: "native" | "authored"; slug: string; wpId?: number } | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
};

export const SETTINGS = {
  /** Pinned pickleball.com articles for the home page. */
  homePbPicks: "home_pb_picks",
} as const;

export function storeConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL) || process.env.NODE_ENV !== "production";
}

/* ───────────────────────────── Neon backend ───────────────────────────── */

type Sql = ReturnType<typeof neon>;

function db(): Sql | null {
  const url = process.env.DATABASE_URL;
  return url ? neon(url) : null;
}

let ready: Promise<void> | null = null;

function init(sql: Sql): Promise<void> {
  ready ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS newsroom_posts (
      id text PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      status text NOT NULL,
      published_at timestamptz,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS newsroom_settings (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_by text NOT NULL DEFAULT '',
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/* ───────────────────────────── file backend ───────────────────────────── */

type FileDb = { posts: DashboardPost[]; settings: Record<string, unknown>; version: string };

const FILE = path.join(process.cwd(), ".data", "newsroom.json");

async function readFile(): Promise<FileDb> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as FileDb;
  } catch {
    return { posts: [], settings: {}, version: "" };
  }
}

async function writeFile(data: FileDb): Promise<void> {
  data.version = new Date().toISOString();
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

function noStore(): never {
  throw new Error("The newsroom database isn't configured (DATABASE_URL).");
}

/* ─────────────────────────────── API ─────────────────────────────── */

/** Every dashboard post, drafts included, newest first. */
export async function listPosts(): Promise<DashboardPost[]> {
  const sql = db();
  let posts: DashboardPost[];
  if (sql) {
    await init(sql);
    const rows = (await sql`SELECT data FROM newsroom_posts`) as { data: DashboardPost }[];
    posts = rows.map((r) => r.data);
  } else if (process.env.NODE_ENV !== "production") {
    posts = (await readFile()).posts;
  } else {
    return [];
  }
  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPost(id: string): Promise<DashboardPost | null> {
  return (await listPosts()).find((p) => p.id === id) ?? null;
}

/** Insert or replace by id. The caller has already validated the post. */
export async function putPost(post: DashboardPost): Promise<void> {
  const sql = db();
  if (sql) {
    await init(sql);
    await sql`
      INSERT INTO newsroom_posts (id, slug, status, published_at, data, updated_at)
      VALUES (${post.id}, ${post.slug}, ${post.status}, ${post.publishedAt || null},
              ${JSON.stringify(post)}::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug, status = EXCLUDED.status,
        published_at = EXCLUDED.published_at, data = EXCLUDED.data, updated_at = now()`;
    await bumpVersion(sql);
    return;
  }
  if (process.env.NODE_ENV === "production") noStore();
  const file = await readFile();
  file.posts = [...file.posts.filter((p) => p.id !== post.id), post];
  await writeFile(file);
}

export async function removePost(id: string): Promise<void> {
  const sql = db();
  if (sql) {
    await init(sql);
    await sql`DELETE FROM newsroom_posts WHERE id = ${id}`;
    await bumpVersion(sql);
    return;
  }
  if (process.env.NODE_ENV === "production") noStore();
  const file = await readFile();
  file.posts = file.posts.filter((p) => p.id !== id);
  await writeFile(file);
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const sql = db();
  if (sql) {
    await init(sql);
    const rows = (await sql`SELECT value FROM newsroom_settings WHERE key = ${key}`) as {
      value: T;
    }[];
    return rows[0]?.value ?? null;
  }
  if (process.env.NODE_ENV === "production") return null;
  return ((await readFile()).settings[key] as T) ?? null;
}

export async function putSetting(key: string, value: unknown, by: string): Promise<void> {
  const sql = db();
  if (sql) {
    await init(sql);
    await sql`
      INSERT INTO newsroom_settings (key, value, updated_by, updated_at)
      VALUES (${key}, ${JSON.stringify(value)}::jsonb, ${by}, now())
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`;
    await bumpVersion(sql);
    return;
  }
  if (process.env.NODE_ENV === "production") noStore();
  const file = await readFile();
  file.settings[key] = value;
  await writeFile(file);
}

/**
 * A cheap "has anything changed?" probe for the public site's memo
 * (lib/newsroom/published.ts). Every write bumps it, deletes included.
 */
export async function storeVersion(): Promise<string> {
  const sql = db();
  if (sql) {
    await init(sql);
    const rows = (await sql`SELECT value FROM newsroom_settings WHERE key = '__version'`) as {
      value: string;
    }[];
    return rows[0]?.value ?? "";
  }
  if (process.env.NODE_ENV === "production") return "";
  return (await readFile()).version;
}

async function bumpVersion(sql: Sql): Promise<void> {
  const v = JSON.stringify(new Date().toISOString());
  await sql`
    INSERT INTO newsroom_settings (key, value, updated_at) VALUES ('__version', ${v}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
}
