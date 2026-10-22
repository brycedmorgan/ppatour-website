/**
 * Checks for lib/athlete-bio.ts — run with:
 *
 *   node --experimental-strip-types scripts/athlete-bio.test.ts
 *
 * The rule under test: no field, no clause. Every assertion below is either
 * "this fact appears because it was given" or "this phrase is absent because
 * the fact was not".
 */
import assert from "node:assert/strict";
import { generatedBio, genericBio } from "../lib/athlete-bio.ts";

// Name only → one honest sentence, nothing else.
const bare = generatedBio({ name: "Danny Phillips" });
assert.deepEqual(bare, ["Danny Phillips is a professional pickleball player on the Carvana PPA Tour."]);
assert.ok(!bare.join(" ").includes("No."));
assert.ok(!bare.join(" ").includes("title"));

// Full facts.
const full = generatedBio({
  name: "Boris Paque",
  country: "Belgium",
  divisions: ["Men's Doubles", "Men's Mixed Doubles", "Men's Singles"],
  turnedPro: "2025",
  resides: "Herstal, Belgium",
  plays: "Left",
  age: 27,
  rank: 143,
  board: "Men's",
  points: 1234.5,
  medals: { gold: 2, silver: 1, semifinals: 4 },
  paddle: "Fox Pickleball Alpha",
});
assert.equal(full.length, 2);
assert.equal(
  full[0],
  "Boris Paque is a professional pickleball player from Belgium on the Carvana PPA Tour, competing in men's doubles, mixed doubles and men's singles. Boris is currently No. 143 in the Men's World Pickleball Rankings with 1,234.5 points.",
);
assert.equal(
  full[1],
  "On tour, Boris has won 2 PPA Tour titles, reached 1 final and made 4 semifinals. Boris, 27, turned pro in 2025, is based in Herstal, Belgium and plays left-handed. Boris plays the Fox Pickleball Alpha.",
);

// Unranked (rank 0) says nothing about a ranking; zero medals says nothing about titles.
const unranked = generatedBio({
  name: "Alexia Alvarez",
  country: "Spain",
  divisions: ["Women's Singles"],
  rank: 0,
  medals: { gold: 0, silver: 0, semifinals: 0 },
});
assert.equal(unranked.length, 1);
assert.ok(!unranked[0].includes("Rankings"));
assert.ok(!unranked[0].includes("title"));
assert.ok(unranked[0].includes("women's singles"));

// Quick-info handedness spelling is normalised; unknown handedness is dropped.
assert.ok(generatedBio({ name: "A B", plays: "Right-Handed" })[1].includes("plays right-handed"));
assert.equal(generatedBio({ name: "A B", plays: "Ambidextrous" }).length, 1);

// Singular forms.
const one = generatedBio({ name: "Jesus Campos", medals: { gold: 1, silver: 0, semifinals: 1 } });
assert.equal(one[1], "On tour, Jesus has won 1 PPA Tour title and made 1 semifinal.");

// Country names that take an article read naturally.
assert.ok(generatedBio({ name: "Danny Phillips", country: "USA" })[0].includes("from the United States on"));
assert.ok(generatedBio({ name: "James Ling", country: "United Kingdom" })[0].includes("from the United Kingdom on"));
assert.ok(generatedBio({ name: "Boris Paque", country: "Belgium" })[0].includes("from Belgium on"));

// skipIdentity: no intro sentence; facts only. Nothing at all when there are no facts.
const under = generatedBio({ name: "Boris Paque", country: "Belgium", rank: 143, board: "Men's" }, { skipIdentity: true });
assert.deepEqual(under, ["Boris is currently No. 143 in the Men's World Pickleball Rankings."]);
assert.deepEqual(generatedBio({ name: "Boris Paque", country: "Belgium" }, { skipIdentity: true }), []);

// The generic placeholder is recognisable so the page can drop it.
assert.ok(genericBio("X Y").startsWith("X Y is a professional pickleball player ranked"));

console.log("athlete-bio: all checks passed");
