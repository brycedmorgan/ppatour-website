/**
 * Checks for lib/seo-text.ts — run with:
 *
 *   node --experimental-strip-types scripts/seo-text.test.ts
 *
 * No test runner in this repo (see bracket-merge.test.ts). The module is pure.
 */
import assert from "node:assert/strict";
import {
  BRAND_SUFFIX,
  fitTitle,
  pageTitle,
  seoDescription,
  SHORT_SUFFIX,
} from "../lib/seo-text.ts";

// ── titles ──────────────────────────────────────────────────────────────

// Short enough: the layout template is kept (plain string returned).
assert.equal(pageTitle("Ben Johns Wins Vegas"), "Ben Johns Wins Vegas");
assert.equal(fitTitle("Ben Johns Wins Vegas"), `Ben Johns Wins Vegas${BRAND_SUFFIX}`);

// 42 chars + 19 = 61 → over 60, so the short suffix (42 + 11 = 53) wins.
const t42 = "Waters and Johns Take Mixed Doubles in Mesa"; // 43 chars
assert.equal(t42.length, 43);
assert.deepEqual(pageTitle(t42), { absolute: `${t42}${SHORT_SUFFIX}` });

// 54 chars + 11 = 65 → exactly at the hard max, still keeps the short suffix.
const t54 = "Stats-Wrap: Vulcan Indoor National Championships Final"; // 54
assert.equal(t54.length, 54);
assert.deepEqual(pageTitle(t54), { absolute: `${t54}${SHORT_SUFFIX}` });

// 55 chars + 11 = 66 → over the hard max, bare title.
const t55 = "Stats-Wrap: Vulcan Indoor National Championships Finals"; // 55
assert.equal(t55.length, 55);
assert.deepEqual(pageTitle(t55), { absolute: t55 });

// Exactly 41 + 19 = 60 fits the template.
const t41 = "Carvana PPA Tour Announces 2027 Schedule!"; // 41
assert.equal(t41.length, 41);
assert.equal(pageTitle(t41), t41);

// Whitespace is collapsed before measuring.
assert.equal(pageTitle("  Ben   Johns  "), "Ben Johns");

// Custom suffix list (the Europe mount): one suffix, so it either fits at 60 or drops.
const eu = " · PPA Tour Europe";
assert.equal(fitTitle("Boris Paque — Pro Pickleball Player", [eu]), `Boris Paque — Pro Pickleball Player${eu}`);
assert.equal(
  fitTitle("Karolina Owczarek — Pro Pickleball Player, Ranking & Stats", [eu]),
  "Karolina Owczarek — Pro Pickleball Player, Ranking & Stats",
);

// ── descriptions ─────────────────────────────────────────────────────────

assert.equal(seoDescription("Short one."), "Short one.");
assert.equal(seoDescription("  two   spaces  "), "two spaces");

const long =
  "Relive the excitement! Check out the stats wrap from the thrilling finals of the Vulcan Indoor National Championships on the PPA Tour and dive into the numbers.";
assert.ok(long.length > 155);
const cut = seoDescription(long);
assert.ok(cut.length <= 155, `got ${cut.length}`);
assert.ok(cut.endsWith("…"));
// Ends on a whole word: the kept text is a prefix of the source and the next
// source character is the space the cut landed on.
assert.ok(long.startsWith(cut.slice(0, -1)));
assert.equal(long.charAt(cut.length - 1), " ");

// A dangling comma before the cut is dropped.
const commaCase = `${"word ".repeat(30).trim()}, ${"tail ".repeat(10)}`;
const c2 = seoDescription(commaCase, 155);
assert.ok(!c2.endsWith(",…"));
assert.ok(c2.length <= 155);

// A single unbroken run has no boundary: hard cut, still within the limit.
const run = "x".repeat(200);
assert.equal(seoDescription(run, 20).length, 20);
assert.ok(seoDescription(run, 20).endsWith("…"));

// Exactly at the limit is left alone.
assert.equal(seoDescription("a".repeat(155)), "a".repeat(155));

console.log("seo-text: all checks passed");
