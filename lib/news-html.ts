/**
 * Renders migrated WordPress post bodies.
 *
 * The archive arrives as rendered Gutenberg HTML (verified: no shortcodes, no
 * page-builder markup). Three jobs happen in one pass:
 *
 *   1. Sanitize — allowlist tags and attributes, drop scripts/handlers, and
 *      restrict iframes to known embed hosts. The content is first-party, but
 *      a compromised CMS shouldn't become stored XSS on this domain.
 *   2. Style — Tailwind's preflight resets every element to no margins and no
 *      list markers, and `@tailwindcss/typography` is NOT a dependency here, so
 *      unstyled WP HTML renders as one undifferentiated wall. Classes are
 *      injected per tag to match the hand-built article layout.
 *   3. Link athletes — the same "Players in This Story" behavior the native
 *      articles get, but done on text nodes only.
 *
 * ⚠ Why not reuse `linkifyPlayers` from the article page: it does
 * `text.includes(name)` then splits the whole string. Against HTML that
 * matches inside tags and attributes — an alt text or URL containing a
 * player's name would get an <a> spliced into the middle of a tag and corrupt
 * the markup. Here linkification only ever touches text runs, and never
 * inside an existing <a>.
 */

import { isDeadAsset, resolveAsset, resolveLink } from "@/lib/wp-media";
import { athleteProfileHref } from "@/lib/published-athletes";

/**
 * Legacy athlete-profile URL shapes found in the archive — `/athlete/x`,
 * `/pro/x`, and the current `/athletes/x` — absolute or relative.
 */
const ATHLETE_HREF = /^(?:https?:\/\/(?:www\.)?ppatour\.com)?\/(?:athletes?|pro)\/([a-z0-9-]+)\/?$/i;

/**
 * Points an in-body athlete reference at a page that exists: their profile, or
 * the roster index when we publish none. Returns null for any other href.
 *
 * Doing this at render time rather than with redirect rules covers every
 * athlete the archive mentions — including ones nobody has enumerated yet — and
 * skips a 308 hop for the links that do resolve.
 */
function rewriteAthleteHref(href: string): string | null {
  const m = href.match(ATHLETE_HREF);
  return m ? athleteProfileHref(m[1].toLowerCase()) : null;
}

/** Tags kept. Anything else is unwrapped (content survives, tag doesn't). */
const ALLOWED = new Set([
  "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "a", "h2", "h3", "h4",
  "ul", "ol", "li", "blockquote", "figure", "figcaption", "img", "iframe",
  "table", "thead", "tbody", "tr", "th", "td", "sup", "sub", "span", "div",
]);

/** Dropped along with everything inside them. */
const DROP_TREE = new Set([
  "script", "style", "noscript", "form", "input", "select", "textarea",
  "button", "object", "embed", "svg", "canvas", "template",
]);

const VOID = new Set(["br", "hr", "img", "source", "col"]);

/** Embed hosts we allow to frame content on our domain. */
const IFRAME_HOSTS = [
  "youtube.com", "www.youtube.com", "youtube-nocookie.com",
  "www.youtube-nocookie.com", "player.vimeo.com", "platform.twitter.com",
  "www.instagram.com", "instagram.com", "www.facebook.com",
  "open.spotify.com", "player.pickleball.tv",
];

const ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title"]),
  img: new Set(["src", "alt", "width", "height"]),
  iframe: new Set(["src", "title", "allow", "allowfullscreen", "width", "height"]),
};

/** Matches the hand-built article body treatment. */
const CLASSES: Record<string, string> = {
  p: "text-[15px] leading-[1.75] text-ppa-navy/75",
  h2: "mt-9 font-display text-xl uppercase leading-tight text-ppa-navy",
  h3: "mt-7 font-display text-lg uppercase leading-tight text-ppa-navy",
  h4: "mt-6 text-base font-bold text-ppa-navy",
  ul: "list-disc space-y-1.5 pl-5 text-[15px] leading-[1.75] text-ppa-navy/75",
  ol: "list-decimal space-y-1.5 pl-5 text-[15px] leading-[1.75] text-ppa-navy/75",
  li: "pl-1",
  blockquote:
    "border-l-4 border-ppa-blue bg-ppa-paper px-4 py-3 text-[15px] font-semibold leading-relaxed text-ppa-navy",
  a: "font-semibold text-ppa-blue underline decoration-ppa-blue/30 underline-offset-2 transition-colors hover:decoration-ppa-blue",
  figure: "my-2",
  figcaption: "mt-2 text-xs leading-relaxed text-ppa-navy/55",
  img: "h-auto w-full",
  iframe: "aspect-video h-auto w-full",
  table: "w-full border-collapse text-left text-sm text-ppa-navy/80",
  th: "border border-ppa-line bg-ppa-paper px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-ppa-navy",
  td: "border border-ppa-line px-3 py-2",
  hr: "border-ppa-line",
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", mdash: "—", ndash: "–", rsquo: "’",
  lsquo: "‘", rdquo: "”", ldquo: "“",
};

/**
 * Attribute values arrive already entity-encoded by WP. Decoding first is what
 * keeps `&quot;` from becoming `&amp;quot;` and rendering as literal text in
 * the output (an oEmbed title showed exactly that).
 */
const decodeEntities = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED_ENTITIES[n.toLowerCase()] ?? m);

const escapeAttr = (s: string) =>
  decodeEntities(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function isSafeUrl(raw: string): boolean {
  // Strip whitespace and control chars first -- they are how `java\nscript:`
  // and tab/newline-obfuscated payloads slip past a naive prefix check.
  const v = Array.from(raw)
    .filter((ch) => ch.charCodeAt(0) > 0x20)
    .join("")
    .toLowerCase();
  return !/^(javascript|vbscript|data):/.test(v);
}

function iframeAllowed(src: string): boolean {
  try {
    return IFRAME_HOSTS.includes(new URL(src, "https://ppatour.com").host);
  } catch {
    return false;
  }
}

type Tok =
  | { t: "text"; raw: string }
  | { t: "tag"; name: string; close: boolean; selfClose: boolean; attrs: string };

/** Splits HTML into tags and text runs. Comments and doctypes are discarded. */
function tokenize(html: string): Tok[] {
  const out: Tok[] = [];
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?)>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m.index > last) out.push({ t: "text", raw: html.slice(last, m.index) });
    last = m.index + m[0].length;
    if (!m[1]) continue; // comment / CDATA
    out.push({
      t: "tag",
      name: m[1].toLowerCase(),
      close: m[0].startsWith("</"),
      selfClose: m[3] === "/",
      attrs: m[2] ?? "",
    });
  }
  if (last < html.length) out.push({ t: "text", raw: html.slice(last) });
  return out;
}

function parseAttrs(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const v = m[2] ?? "";
    out[m[1].toLowerCase()] = v.replace(/^["']|["']$/g, "");
  }
  return out;
}

export type LinkablePlayer = { name: string; slug: string };

/**
 * Sanitized, styled, athlete-linked HTML ready for
 * `dangerouslySetInnerHTML`. Returns "" for empty input.
 */
export function renderPostHtml(html: string, players: LinkablePlayer[] = []): string {
  if (!html) return "";

  // Longest name first so "Anna Leigh Waters" wins over a nested "Leigh Waters".
  const linkable = [...players].sort((a, b) => b.name.length - a.name.length);
  const nameRe = linkable.length
    ? new RegExp(`(${linkable.map((p) => escapeRe(p.name)).join("|")})`, "g")
    : null;
  const slugOf = new Map(linkable.map((p) => [p.name, p.slug]));

  const out: string[] = [];
  let dropDepth = 0; // inside a DROP_TREE element
  let anchorDepth = 0; // inside an <a> — never nest another link
  const dropStack: string[] = [];
  /**
   * Open tags we emitted nothing for (a non-allowlisted iframe host, a dead
   * image) so their close tag must be swallowed too — otherwise a stray
   * `</iframe>` lands in the output.
   */
  const orphanedCloses: Record<string, number> = {};

  for (const tok of tokenize(html)) {
    if (tok.t === "text") {
      if (dropDepth > 0) continue;
      let text = tok.raw;
      if (nameRe && anchorDepth === 0 && text.trim()) {
        text = text.replace(nameRe, (match) => {
          const slug = slugOf.get(match);
          return slug
            ? `<a href="/athletes/${slug}" class="${CLASSES.a}">${match}</a>`
            : match;
        });
      }
      out.push(text);
      continue;
    }

    const { name, close, selfClose, attrs } = tok;

    if (DROP_TREE.has(name)) {
      if (close) {
        const i = dropStack.lastIndexOf(name);
        if (i !== -1) { dropStack.splice(i, 1); dropDepth = dropStack.length; }
      } else if (!selfClose) {
        dropStack.push(name);
        dropDepth = dropStack.length;
      }
      continue;
    }
    if (dropDepth > 0) continue;
    if (!ALLOWED.has(name)) continue; // unwrap: content is kept, tag dropped

    if (close) {
      if (orphanedCloses[name]) {
        orphanedCloses[name] -= 1;
        continue; // its open tag was dropped — swallow the close too
      }
      if (name === "a") anchorDepth = Math.max(0, anchorDepth - 1);
      out.push(`</${name}>`);
      continue;
    }

    const preParsed = name === "a" ? parseAttrs(attrs) : null;
    // A link to an asset that 404s upstream is worse than no link: unwrap it so
    // the label survives as plain text and the dead click-through doesn't ship.
    if (name === "a" && preParsed?.href && isDeadAsset(preParsed.href)) {
      if (!selfClose) orphanedCloses[name] = (orphanedCloses[name] ?? 0) + 1;
      continue;
    }

    if (name === "a" && !selfClose) anchorDepth += 1;

    const parsed = parseAttrs(attrs);
    const keep = ATTRS[name];
    const built: string[] = [];

    if (name === "img") {
      const src = resolveAsset(parsed.src ?? "");
      if (!src || !isSafeUrl(src)) continue; // dead or unsafe → drop the image
      built.push(`src="${escapeAttr(src)}"`);
      built.push(`alt="${escapeAttr(parsed.alt ?? "")}"`);
      if (parsed.width) built.push(`width="${escapeAttr(parsed.width)}"`);
      if (parsed.height) built.push(`height="${escapeAttr(parsed.height)}"`);
      built.push('loading="lazy"', 'decoding="async"');
    } else if (name === "iframe") {
      const src = parsed.src ?? "";
      if (!isSafeUrl(src) || !iframeAllowed(src)) {
        if (!selfClose) orphanedCloses[name] = (orphanedCloses[name] ?? 0) + 1;
        continue;
      }
      built.push(`src="${escapeAttr(src)}"`);
      if (parsed.title) built.push(`title="${escapeAttr(parsed.title)}"`);
      built.push('loading="lazy"', 'allowfullscreen=""');
    } else if (keep) {
      for (const [k, v] of Object.entries(parsed)) {
        if (!keep.has(k)) continue;
        if ((k === "href" || k === "src") && !isSafeUrl(v)) continue;
        // Repoint links at rehosted assets (the draw PDFs) and at athlete
        // profiles that actually exist.
        const value =
          name === "a" && k === "href"
            ? (rewriteAthleteHref(v) ?? resolveLink(v))
            : v;
        built.push(`${k}="${escapeAttr(value)}"`);
      }
      if (name === "a") {
        const raw = parsed.href ?? "";
        const href = rewriteAthleteHref(raw) ?? resolveLink(raw);
        const external = /^https?:\/\//i.test(href) && !href.includes("ppatour.com");
        if (external) built.push('target="_blank"', 'rel="noopener noreferrer"');
      }
    }

    const cls = CLASSES[name];
    if (cls) built.push(`class="${cls}"`);
    out.push(`<${name}${built.length ? " " + built.join(" ") : ""}${VOID.has(name) ? " /" : ""}>`);
  }

  let html_ = out.join("");
  // Gutenberg wraps blocks in divs that carry only classes we strip, leaving
  // empty shells behind. Loop because removal can expose another empty parent.
  for (let i = 0; i < 4; i++) {
    const next = html_.replace(/<(div|span|p|figure)>\s*<\/\1>/g, "");
    if (next === html_) break;
    html_ = next;
  }
  return html_
    // Gutenberg leaves runs of blank lines between blocks.
    .replace(/(\s*\n\s*){2,}/g, "\n")
    .trim();
}

/** Plain text, for search indexing and reading-time estimates. */
export function postPlainText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&(lt|gt|quot|apos|rsquo|hellip|mdash|ndash);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Rounded reading time in minutes, floored at 1. */
export function readingMinutes(html: string): number {
  return Math.max(1, Math.round(postPlainText(html).split(/\s+/).filter(Boolean).length / 225));
}
