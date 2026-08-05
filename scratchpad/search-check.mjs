import { eventMatcher, eventSearchText } from "../lib/event-search.ts";

// Rebuild the curated RAW_EVENTS rows straight out of the source so the check
// runs against real records without booting Next.
import fs from "node:fs";
const src = fs.readFileSync("lib/placeholder-data.ts", "utf8");
const rows = [...src.matchAll(/^\s*\{ name: "(.+?)".*$/gm)].map((m) => m[0]);
const evs = [];
for (const line of rows) {
  const g = (k) => (line.match(new RegExp(`${k}: "(.*?)"`)) || [])[1];
  const name = g("name");
  if (!name) continue;
  const type = g("type");
  const tier = g("tier");
  evs.push({
    name,
    slug: g("slug") || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    city: g("city") || "",
    state: g("state") || "",
    venue: g("venue") || "",
    startDate: g("start") || "",
    endDate: g("end") || "",
    presentedBy: undefined,
    tierKey: tier || (type === "challenger" ? "challenger" : type === "international" ? "open" : "open"),
    region: type === "international" ? "international" : undefined,
    country: g("country"),
    status: "upcoming",
  });
}
console.log("curated events parsed:", evs.length);

const QUERIES = [
  "Washington", "washington", "wa", "north carolina", "Texas", "Nevada",
  "Dallas", "Raleigh", "Phoenix", "Palm Springs", "Twin Cities",
  "challenger", "challangers", "major", "slam", "cup", "worlds",
  "1500", "125", "1,000 points",
  "September", "sept 2026", "august", "2027",
  "australia", "asia", "europe", "canada", "international",
  "las vagas", "virgina beach", "cincinatti",
  "seattle", "seattle challenger", "chicago cup", "washington challenger",
  "zzzz",
];
for (const q of QUERIES) {
  const m = eventMatcher(q);
  const hits = evs.filter(m);
  console.log(`${String(hits.length).padStart(3)}  "${q}"  →  ${hits.slice(0, 4).map((e) => e.name).join(" | ")}${hits.length > 4 ? " …" : ""}`);
}
console.log("\nSAMPLE HAYSTACK (Seattle):\n", eventSearchText(evs.find((e) => e.city === "Seattle")));
