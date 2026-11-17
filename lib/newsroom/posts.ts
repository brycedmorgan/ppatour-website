/**
 * Newsroom post rules: validation, blank posts, and the one-time copy of the
 * hand-written code posts into the dashboard. SERVER-ONLY.
 */
import { athletes } from "@/lib/athletes";
import { newsArticles, type NewsArticle } from "@/lib/news-articles";
import { authoredPosts } from "@/lib/news-posts-authored";
import { getWpPost } from "@/lib/wp-news";
import type { DashboardPost } from "@/lib/newsroom/store";

/** How many pickleball.com articles the home page shows (HomeContent). */
export const HOME_PB_SLOTS = 4;

/** The categories in use across the archive, offered as suggestions. */
export const CATEGORY_SUGGESTIONS = [
  "News",
  "Recap",
  "Preview",
  "Partner News",
  "Announcement",
  "Feature",
  "Stats",
];

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Posts live at the ROOT (`/{slug}/`), and Next serves a real route before the
 * `app/[slug]` catch-all — so a post slugged "events" would publish to nowhere.
 * Every top-level route segment, as of 11/17. Add new top-level folders here.
 */
const RESERVED = new Set([
  "about", "ambassadors", "api", "athletes", "blog", "brackets", "europe", "events",
  "following", "fonts", "game", "hero-preview", "hq", "leaderboards", "live", "news",
  "newsroom", "opt-in", "paddle-lab", "partners", "play", "ppa-blog", "rankings",
  "scores", "search", "shop", "tour", "tournament", "vacations", "watch", "today",
  "sitemap", "robots", "manifest", "icon", "opengraph-image",
]);

export function slugify(s: string): string {
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

/** An error message, or null when the slug can be used by this post. */
export function slugProblem(slug: string, post: DashboardPost, others: DashboardPost[]): string | null {
  if (!SLUG_RE.test(slug)) {
    return "The URL may only use lowercase letters, numbers and single hyphens.";
  }
  if (RESERVED.has(slug)) return `"/${slug}/" is already a page on the site. Pick another URL.`;
  if (athletes.some((a) => a.slug === slug)) {
    return `"/${slug}/" redirects to an athlete profile. Pick another URL.`;
  }
  if (others.some((p) => p.id !== post.id && p.slug === slug)) {
    return "Another dashboard post already uses this URL.";
  }
  // A code post may share the slug only if this IS that post, copied in.
  const isOwnImport = post.importedFrom?.slug === slug;
  if (!isOwnImport && (getWpPost(slug) || newsArticles.some((a) => a.slug === slug))) {
    return "An existing article already uses this URL. Pick another.";
  }
  return null;
}

/** Problems that block publishing (a draft can be saved half-finished). */
export function publishProblems(p: DashboardPost): string[] {
  const out: string[] = [];
  if (!p.title.trim()) out.push("a headline");
  if (!p.dek.trim()) out.push("a summary (dek)");
  if (!p.category.trim()) out.push("a category");
  if (!p.image.trim()) out.push("a hero image");
  if (!p.bodyHtml.replace(/<[^>]*>/g, "").trim()) out.push("body text");
  return out;
}

export function blankPost(id: string, by: string): DashboardPost {
  const now = new Date().toISOString();
  return {
    id,
    slug: `untitled-${id.slice(0, 8)}`,
    status: "draft",
    category: "News",
    title: "",
    subtitle: "",
    dek: "",
    author: "",
    publishedAt: now,
    image: "",
    imageAlt: "",
    imagePosition: "",
    cardImage: "",
    heroGraphic: false,
    whyItMatters: "",
    eventSlug: "",
    ctaUrl: "",
    ctaLabel: "",
    players: [],
    tags: [],
    bodyHtml: "",
    seoTitle: "",
    seoDescription: "",
    importedFrom: null,
    createdAt: now,
    updatedAt: now,
    updatedBy: by,
  };
}

/* ─────────────────────── importing the code posts ─────────────────────── */

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * "2026-11-16T12:00:00" read as Eastern wall-clock time → a real ISO instant.
 * Tries both Eastern offsets and keeps the one that round-trips, so a summer
 * date lands on EDT and a winter one on EST.
 */
export function easternToIso(wall: string): string {
  for (const offset of ["-04:00", "-05:00"]) {
    const d = new Date(`${wall}${offset}`);
    const back = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(d);
    if (back.replace(", ", "T").startsWith(wall.slice(0, 13))) return d.toISOString();
  }
  return new Date(`${wall}-05:00`).toISOString();
}

/** "Nov 16" (2026, like lib/news.ts) → ISO at noon Eastern. */
function nativeDateIso(date: string): string {
  const [mon, day] = date.trim().split(/\s+/);
  const m = MONTHS.indexOf((mon ?? "").slice(0, 3).toLowerCase());
  const d = Number(day);
  if (m === -1 || !d) return easternToIso("2026-01-01T12:00:00");
  return easternToIso(`2026-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}T12:00:00`);
}

/** Paragraph array → HTML. "## " entries are subheadings (see ArticleView). */
function paragraphsToHtml(body: string[]): string {
  return body
    .map((p) => (p.startsWith("## ") ? `<h2>${escapeHtml(p.slice(3))}</h2>` : `<p>${escapeHtml(p)}</p>`))
    .join("\n");
}

function fromNative(a: NewsArticle, id: string, by: string): DashboardPost {
  const now = new Date().toISOString();
  return {
    ...blankPost(id, by),
    slug: a.slug,
    status: a.status,
    category: a.category,
    title: a.title,
    subtitle: a.subtitle ?? "",
    dek: a.dek,
    author: a.author ?? "",
    publishedAt: nativeDateIso(a.date),
    image: a.image,
    imagePosition: a.imagePosition ?? "",
    cardImage: a.cardImage ?? "",
    heroGraphic: a.heroGraphic ?? false,
    whyItMatters: a.whyItMatters,
    eventSlug: a.eventSlug ?? "",
    ctaUrl: a.ctaUrl ?? "",
    ctaLabel: a.ctaLabel ?? "",
    players: a.players ?? [],
    bodyHtml: paragraphsToHtml(a.body),
    importedFrom: { kind: "native", slug: a.slug },
    createdAt: now,
    updatedAt: now,
  };
}

type Authored = (typeof authoredPosts)[number];

function fromAuthored(p: Authored, id: string, by: string): DashboardPost {
  const now = new Date().toISOString();
  return {
    ...blankPost(id, by),
    slug: p.slug,
    status: "published",
    category: p.category,
    title: p.title,
    dek: p.dek,
    author: p.author,
    publishedAt: easternToIso(p.publishedAt.slice(0, 19)),
    image: p.image?.url ?? "",
    imageAlt: p.image?.alt ?? "",
    imagePosition: p.image?.position ?? "",
    ctaUrl: p.ctaUrl ?? "",
    ctaLabel: p.ctaLabel ?? "",
    players: p.players,
    tags: p.tags,
    bodyHtml: p.bodyHtml,
    seoTitle: p.seo?.title ?? "",
    seoDescription: p.seo?.description ?? "",
    importedFrom: { kind: "authored", slug: p.slug, wpId: p.wpId },
    createdAt: now,
    updatedAt: now,
  };
}

export type CodePost = { slug: string; title: string; kind: "native" | "authored" };

/** The hand-written posts that live in code (both files), drafts included. */
export function codePosts(): CodePost[] {
  return [
    ...newsArticles.map((a) => ({ slug: a.slug, title: a.title, kind: "native" as const })),
    ...authoredPosts.map((p) => ({ slug: p.slug, title: p.title, kind: "authored" as const })),
  ];
}

/** Dashboard copies of every code post whose slug isn't in the dashboard yet. */
export function importablePosts(
  existing: DashboardPost[],
  by: string,
  newId: () => string,
): DashboardPost[] {
  const taken = new Set(existing.map((p) => p.slug));
  return [
    ...newsArticles.filter((a) => !taken.has(a.slug)).map((a) => fromNative(a, newId(), by)),
    ...authoredPosts.filter((p) => !taken.has(p.slug)).map((p) => fromAuthored(p, newId(), by)),
  ];
}
