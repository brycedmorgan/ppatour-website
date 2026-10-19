/**
 * Card photos for U.S. PPA Challenger events — real Challenger event photos.
 *
 * SOURCE: Tanner Groff, Slack DM 10/19 — Drive folder "WEBSITE" (owner Jacob
 * Guidry, 1q4ShgtlARd0vNMpLc-857MNqO8wTc69k), 22 shots from 2026 Challengers.
 * Resized to 1600w into public/ppa/challenger/photos/. Brooke flagged (10/19
 * "Website Changes" sheet) that top pros were the Challenger card photos; Nathan
 * flagged Jack Sock in the hero. Never put a pro-tour photo in this file.
 *
 * A city with its own shot gets it, both years (the slug is year-free). Every
 * other Challenger draws from POOL by a stable hash of its slug, so a card
 * keeps the same photo between builds.
 */
const BY_CITY: [RegExp, string][] = [
  [/atlanta/, "atlanta"],
  [/charlotte/, "charlotte"],
  [/fort-collins/, "fort-collins"],
  [/houston/, "houston"],
  [/punta-gorda/, "punta-gorda"],
  [/seattle/, "seattle"],
  [/black-desert/, "black-desert"],
  [/wilson/, "wilson"],
];

const POOL_SIZE = 10;

export const CHALLENGER_HERO = "/ppa/challenger/photos/hero.jpg";

export function challengerPhotoFor(slug: string): string {
  const hit = BY_CITY.find(([re]) => re.test(slug));
  if (hit) return `/ppa/challenger/photos/${hit[1]}.jpg`;
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `/ppa/challenger/photos/pool-${(h % POOL_SIZE) + 1}.jpg`;
}
