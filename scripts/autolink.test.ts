/**
 * Checks for lib/autolink.ts — run with:
 *
 *   node --experimental-strip-types scripts/autolink.test.ts
 *
 * The cases that matter are the ones that corrupt markup or link the wrong
 * person when they go wrong: a name already inside <a>, a name split by a
 * tag, a name inside an attribute, a name nested in a longer name, headings
 * and figcaptions, and the per-document cap.
 */
import assert from "node:assert/strict";
import { autolinkHtml, tokenizeHtml } from "../lib/autolink.ts";

const ben = { name: "Ben Johns", slug: "ben-johns" };
const alw = { name: "Anna Leigh Waters", slug: "anna-leigh-waters" };
const leigh = { name: "Leigh Waters", slug: "leigh-waters" };
const link = (slug: string, text: string) => `<a href="/athletes/${slug}/">${text}</a>`;

// First mention linked, second left alone.
assert.equal(
  autolinkHtml("<p>Ben Johns won. Ben Johns smiled.</p>", [ben]),
  `<p>${link("ben-johns", "Ben Johns")} won. Ben Johns smiled.</p>`,
);

// Name already inside an existing <a>: untouched, and the NEXT plain mention is the first.
assert.equal(
  autolinkHtml('<p><a href="/x">Ben Johns</a> and Ben Johns</p>', [ben]),
  `<p><a href="/x">Ben Johns</a> and ${link("ben-johns", "Ben Johns")}</p>`,
);

// Nested anchor content with inline tags inside the <a> still counts as inside.
assert.equal(
  autolinkHtml('<a href="/x"><strong>Ben Johns</strong></a>', [ben]),
  '<a href="/x"><strong>Ben Johns</strong></a>',
);

// Name split by a tag: no link, markup intact.
const split = "<p>Ben <strong>Johns</strong> won.</p>";
assert.equal(autolinkHtml(split, [ben]), split);

// Name inside an attribute is never touched.
const attr = '<img alt="Ben Johns serving" src="/a.jpg" /><p>Ben Johns</p>';
assert.equal(
  autolinkHtml(attr, [ben]),
  `<img alt="Ben Johns serving" src="/a.jpg" /><p>${link("ben-johns", "Ben Johns")}</p>`,
);

// Headings and figcaptions are skipped; the body mention is the one linked.
assert.equal(
  autolinkHtml("<h2>Ben Johns</h2><figure><img src=x><figcaption>Ben Johns</figcaption></figure><p>Ben Johns</p>", [ben]),
  `<h2>Ben Johns</h2><figure><img src=x><figcaption>Ben Johns</figcaption></figure><p>${link("ben-johns", "Ben Johns")}</p>`,
);

// Boundaries: "Ben Johnson" is not Ben Johns; a possessive still matches.
assert.equal(autolinkHtml("<p>Ben Johnson</p>", [ben]), "<p>Ben Johnson</p>");
assert.equal(
  autolinkHtml("<p>Ben Johns' partner</p>", [ben]),
  `<p>${link("ben-johns", "Ben Johns")}' partner</p>`,
);

// Longest name wins: "Anna Leigh Waters" is not a "Leigh Waters" mention.
assert.equal(
  autolinkHtml("<p>Anna Leigh Waters</p>", [leigh, alw]),
  `<p>${link("anna-leigh-waters", "Anna Leigh Waters")}</p>`,
);

// Cap: only `max` links per document, in document order.
const many = Array.from({ length: 10 }, (_, i) => ({ name: `Player Number${i}`, slug: `p${i}` }));
const doc = `<p>${many.map((p) => p.name).join(", ")}</p>`;
const capped = autolinkHtml(doc, many, { max: 3 });
assert.equal((capped.match(/<a /g) ?? []).length, 3);
assert.ok(capped.includes(link("p0", "Player Number0")));
assert.ok(capped.includes(link("p2", "Player Number2")));
assert.ok(!capped.includes(link("p3", "Player Number3")));

// Custom href + class; the class is attribute-escaped.
assert.equal(
  autolinkHtml("<p>Ben Johns</p>", [ben], { hrefFor: (s) => `/pro/${s}`, className: 'x "y' }),
  '<p><a href="/pro/ben-johns" class="x &quot;y">Ben Johns</a></p>',
);

// Comments are opaque.
assert.equal(autolinkHtml("<!-- Ben Johns --><p>Ben Johns</p>", [ben]), `<!-- Ben Johns --><p>${link("ben-johns", "Ben Johns")}</p>`);

// No targets / empty input are identity.
assert.equal(autolinkHtml("<p>Ben Johns</p>", []), "<p>Ben Johns</p>");
assert.equal(autolinkHtml("", [ben]), "");

// Tokenizer sanity: a void tag does not open a nesting level.
const toks = tokenizeHtml("<br><p>x</p>");
assert.equal(toks.length, 4);
assert.equal(toks[0].t === "tag" && toks[0].selfClose, true);

console.log("autolink: all checks passed");
