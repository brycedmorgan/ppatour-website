/**
 * How much of the time is production /api/ticker in the UNCACHEABLE degraded
 * state? Every no-store response reaches origin, so this fraction is what still
 * scales with traffic after the 9/5 fix. 60 polls at 2s = 2 min.
 */
const URL_ = "https://www.ppatour.com/api/ticker/";
let hit = 0, miss = 0, noStore = 0, quiet = 0, staleData = 0, live = 0, errs = 0;
const gens = new Set();
const timeline = [];

for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(URL_);
    const cache = r.headers.get("x-vercel-cache");
    const cc = r.headers.get("cache-control") ?? "";
    const b = await r.json();
    if (cache === "HIT") hit++; else miss++;
    if (/no-store/.test(cc)) noStore++;
    if (b.stale) staleData++; else if (b.matches?.length) live++; else quiet++;
    // A generation = one origin render, identified by its age-0 arrival.
    const age = Number(r.headers.get("age") ?? -1);
    if (age <= 0) gens.add(`${i}:${b.stale ? "degraded" : "ok"}`);
    timeline.push(b.stale ? "!" : ".");
  } catch { errs++; timeline.push("x"); }
  if (i < 59) await new Promise((r) => setTimeout(r, 2000));
}

const n = 60;
console.log(`polls ${n}  errors ${errs}`);
console.log(`edge:   HIT ${hit} (${((hit / n) * 100).toFixed(0)}%)   MISS ${miss}`);
console.log(`header: no-store ${noStore} (${((noStore / n) * 100).toFixed(0)}%)  <- these reach origin on every poll, every tab`);
console.log(`body:   quiet ${quiet}   stale/degraded ${staleData}   with-matches ${live}`);
console.log(`origin generations sampled: ${gens.size}  degraded: ${[...gens].filter((g) => g.endsWith("degraded")).length}`);
console.log(`timeline (. ok  ! degraded  x error):\n${timeline.join("")}`);
