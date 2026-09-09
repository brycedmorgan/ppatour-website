/**
 * Production /api/ticker: is the edge actually shielding origin?
 * 24 polls at 2s — roughly what one open tab does in ~6 min, compressed.
 * Run: node scratchpad/probe-ticker-cache.mjs
 */
const URL_ = "https://www.ppatour.com/api/ticker/";
const N = 24, GAP_MS = 2000;
const seen = { HIT: 0, MISS: 0, STALE: 0, REVALIDATED: 0, BYPASS: 0, other: 0 };
const ccs = new Map();
const ids = new Set();

for (let i = 0; i < N; i++) {
  const t0 = Date.now();
  try {
    const r = await fetch(URL_, { headers: { "cache-control": "" } });
    const cache = r.headers.get("x-vercel-cache") ?? "(none)";
    const cc = r.headers.get("cache-control") ?? "(none)";
    const age = r.headers.get("age") ?? "-";
    const id = r.headers.get("x-vercel-id") ?? "";
    ids.add(id.split("::")[0]);
    ccs.set(cc, (ccs.get(cc) ?? 0) + 1);
    if (cache in seen) seen[cache]++; else seen.other++;
    const body = await r.json();
    const state = body.stale ? "STALE-DATA" : (body.matches?.length ? `${body.matches.length} matches` : "quiet");
    console.log(
      `${String(i + 1).padStart(2)}  ${r.status}  ${cache.padEnd(11)} age=${String(age).padStart(3)}  ` +
      `${String(Date.now() - t0).padStart(4)}ms  ${state.padEnd(12)}  ${cc}`,
    );
  } catch (e) {
    console.log(`${String(i + 1).padStart(2)}  ERR ${e.message}`);
  }
  if (i < N - 1) await new Promise((r) => setTimeout(r, GAP_MS));
}

const total = Object.values(seen).reduce((a, b) => a + b, 0);
console.log(`\n--- ${total} polls over ~${((N - 1) * GAP_MS) / 1000}s ---`);
for (const [k, v] of Object.entries(seen)) if (v) console.log(`  ${k.padEnd(12)} ${v}  (${((v / total) * 100).toFixed(0)}%)`);
console.log(`  edge regions hit: ${[...ids].join(", ")}`);
console.log("  cache-control served:");
for (const [cc, n] of ccs) console.log(`    ${n}x  ${cc}`);
const origin = seen.MISS + seen.REVALIDATED + seen.BYPASS + seen.other;
console.log(`\norigin-reaching responses: ${origin}/${total}; shielded by edge: ${total - origin}`);
