/**
 * Entity autolinking over an HTML string (docs/SEO.md, Phase 1 item 12).
 *
 * Links the FIRST plain-text mention of each name to its page, at most
 * `max` links per document, and never inside an existing <a>, a heading, a
 * figcaption, or a dropped subtree (<script>/<style>). It works on the
 * rendered HTML string with a small tokenizer that separates tags from text
 * runs, so a name inside an attribute (an alt, a title, a URL) can never be
 * touched, and a name split across a tag boundary ("Ben <strong>Johns</strong>")
 * is left alone rather than linked halfway — the markup is never corrupted.
 *
 * Boundaries are letter/number lookarounds, not `\b`, matching
 * lib/article-players.ts: "Ben Johns' partner" still matches, "Ben Johnson"
 * never resolves to Ben Johns. Longest name wins the alternation so
 * "Anna Leigh Waters" beats a nested "Leigh Waters".
 *
 * ⚠ PURE AND IMPORT-FREE ON PURPOSE. `lib/news-html.ts` used to do this inline
 * in its sanitize pass, which meant the behaviour could only be tested through
 * the whole sanitizer (and its `@/` imports, which `node --experimental-
 * strip-types` cannot resolve). This module is the unit `scripts/autolink.test.ts`
 * covers; the sanitizer calls it as a second pass over its own output.
 */

export type LinkTarget = { name: string; slug: string };

export type AutolinkOptions = {
  /** Cap on links per document. */
  max?: number;
  /** Builds the href for a slug. */
  hrefFor?: (slug: string) => string;
  /** class="" for the injected anchor. */
  className?: string;
  /** Element names whose text is never linked (in addition to `a`). */
  skipInside?: readonly string[];
};

export const DEFAULT_MAX_LINKS = 8;
const DEFAULT_SKIP = ["a", "h1", "h2", "h3", "h4", "h5", "h6", "figcaption", "script", "style"];
const VOID = new Set(["br", "hr", "img", "source", "col", "input", "meta", "link", "wbr"]);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

type Tok =
  | { t: "text"; raw: string }
  | { t: "tag"; raw: string; name: string; close: boolean; selfClose: boolean };

/** Tags vs text runs. Comments are kept verbatim as opaque "tags". */
export function tokenizeHtml(html: string): Tok[] {
  const out: Tok[] = [];
  const re = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?)>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m.index > last) out.push({ t: "text", raw: html.slice(last, m.index) });
    last = m.index + m[0].length;
    if (!m[1]) {
      // A comment: opaque, never text, never changes nesting.
      out.push({ t: "tag", raw: m[0], name: "!--", close: false, selfClose: true });
      continue;
    }
    out.push({
      t: "tag",
      raw: m[0],
      name: m[1].toLowerCase(),
      close: m[0].startsWith("</"),
      selfClose: m[3] === "/" || VOID.has(m[1].toLowerCase()),
    });
  }
  if (last < html.length) out.push({ t: "text", raw: html.slice(last) });
  return out;
}

export function autolinkHtml(html: string, targets: LinkTarget[], opts: AutolinkOptions = {}): string {
  if (!html || targets.length === 0) return html;
  const max = opts.max ?? DEFAULT_MAX_LINKS;
  const hrefFor = opts.hrefFor ?? ((slug: string) => `/athletes/${slug}/`);
  const skip = new Set(opts.skipInside ?? DEFAULT_SKIP);
  const cls = opts.className ? ` class="${escapeAttr(opts.className)}"` : "";

  // Longest first, deduped by name.
  const byName = new Map<string, string>();
  for (const t of targets) {
    const name = t.name.trim();
    if (name && !byName.has(name)) byName.set(name, t.slug);
  }
  const names = [...byName.keys()].sort((a, b) => b.length - a.length);
  if (names.length === 0) return html;
  const nameRe = new RegExp(
    `(?<![\\p{L}\\p{N}])(${names.map(escapeRe).join("|")})(?![\\p{L}\\p{N}])`,
    "gu",
  );

  const linked = new Set<string>();
  let count = 0;
  let skipDepth = 0;
  const out: string[] = [];

  for (const tok of tokenizeHtml(html)) {
    if (tok.t === "tag") {
      out.push(tok.raw);
      if (tok.selfClose || !skip.has(tok.name)) continue;
      if (tok.close) skipDepth = Math.max(0, skipDepth - 1);
      else skipDepth += 1;
      continue;
    }
    if (skipDepth > 0 || count >= max || !tok.raw.trim()) {
      out.push(tok.raw);
      continue;
    }
    out.push(
      tok.raw.replace(nameRe, (match) => {
        const slug = byName.get(match);
        if (!slug || linked.has(slug) || count >= max) return match;
        linked.add(slug);
        count += 1;
        return `<a href="${escapeAttr(hrefFor(slug))}"${cls}>${match}</a>`;
      }),
    );
  }
  return out.join("");
}
