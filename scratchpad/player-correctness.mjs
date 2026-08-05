import { detectAthleteMentions } from "../lib/article-players.ts";

const cases = [
  ["Ben Johns won the final.", ["ben-johns"], "plain mention"],
  ["Ben Johnson is not a pro pickleball player.", [], "longer surname must NOT match"],
  ["Ben Johns' partner Collin Johns took the title.", ["ben-johns","collin-johns"], "possessive + sibling"],
  ["BEN JOHNS BEATS FIELD", ["ben-johns"], "all-caps headline"],
  ["Anna Leigh Waters swept.", ["anna-leigh-waters"], "3-word name"],
  ["Leigh Waters coached from the box.", [], "partial of a longer roster name"],
  ["Estee Widdershoven advanced.", ["estee-widdershoven"], "accent-folded query side"],
  ["Estée Widdershoven advanced.", ["estee-widdershoven"], "accented in copy"],
  ["Tyra Black def. Parris Todd", ["tyra-black","paris-todd"], "curated alias spelling → the slug the route prerenders"],
  ["The johns brothers played.", [], "surname alone is not enough"],
  ["Ben Johns, Ben Johns and Ben Johns.", ["ben-johns"], "dedupes, count=3"],
  ["Nothing here at all.", [], "no players"],
];

let pass = 0, fail = 0;
for (const [text, want, label] of cases) {
  const got = detectAthleteMentions(text).map(d => d.slug);
  const ok = got.length === want.length && want.every(w => got.includes(w));
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}\n      want [${want}]  got [${got}]`);
  ok ? pass++ : fail++;
}
console.log(`\n${pass} passed, ${fail} failed`);
const c = detectAthleteMentions("Ben Johns, Ben Johns and Ben Johns.");
console.log("count check:", JSON.stringify(c));
