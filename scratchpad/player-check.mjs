import fs from "node:fs";
import { detectAthleteMentions } from "../lib/article-players.ts";

const news = JSON.parse(fs.readFileSync("lib/data/news-posts.json", "utf8"));
const plain = (h) => h.replace(/<(script|style)[\s\S]*?<\/\1>/gi," ").replace(/<[^>]*>/g," ")
  .replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(Number(d))).replace(/&nbsp;/g," ")
  .replace(/&amp;/g,"&").replace(/&(lt|gt|quot|apos|rsquo|hellip|mdash|ndash);/g," ")
  .replace(/\s+/g," ").trim();

let before = 0, after = 0, gained = 0, sizes = [];
const t0 = Date.now();
for (const p of news) {
  const tagged = new Set(p.players || []);
  const det = detectAthleteMentions(`${p.title} ${p.dek} ${plain(p.bodyHtml)}`);
  const union = new Set([...tagged, ...det.map(d => d.slug)]);
  if (tagged.size) before++;
  if (union.size) after++;
  if (!tagged.size && union.size) gained++;
  sizes.push(union.size);
}
const ms = Date.now() - t0;
sizes.sort((a,b)=>a-b);
const q = (f) => sizes[Math.floor(sizes.length*f)];
console.log(`posts: ${news.length}`);
console.log(`rail rendered BEFORE (tags only): ${before}  (${(before/news.length*100).toFixed(1)}%)`);
console.log(`rail rendered AFTER  (union):     ${after}  (${(after/news.length*100).toFixed(1)}%)`);
console.log(`posts that gain a rail they never had: ${gained}`);
console.log(`rail size p50 ${q(.5)} p90 ${q(.9)} max ${sizes[sizes.length-1]}  |  >10 (uses the expander): ${sizes.filter(s=>s>10).length}`);
console.log(`detection cost: ${ms}ms for ${news.length} posts (${(ms/news.length).toFixed(2)}ms/post)`);

// Spot-check ordering on a well-known story.
const pick = news.find(p => p.slug.includes("championship-sunday") ) || news[0];
console.log(`\nSAMPLE: ${pick.title}`);
console.log("  tags:", (pick.players||[]).slice(0,6).join(", ") || "(none)");
console.log("  detected(top6):", detectAthleteMentions(`${pick.title} ${pick.dek} ${plain(pick.bodyHtml)}`).slice(0,6).map(d=>`${d.slug}×${d.count}`).join(", "));
