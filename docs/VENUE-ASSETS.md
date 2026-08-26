# Venue / Aerial Photo Asset Gaps — for Sadie's venue-asset pipeline

**Directive (Connor Pardoe, 7/20/2026):** event cards and event pages lead
with **venue/aerial photography**, not player action shots. The North
Carolina Nationals page is the reference standard (drone shot of a packed
Cary Tennis Park champ court + a 9-photo venue gallery).

## What the site does today

- **Nationals (Cary, NC)** — real assets: hero
  `/ppa/nationals-drone-champcourt.jpg` + 9-photo gallery. DONE. ✅
- **Every other main-tour stop** — no venue photography exists in the repo,
  so cards cycle three *generic stadium placeholder* scenes
  (`/ppa/event-melbourne.jpg`, `/ppa/event-macao.jpg`,
  `/ppa/event-gold-coast.webp`). These are stand-ins, not the real venues.
- Challenger + international cards keep generic action shots (smaller card
  treatments, lower priority).

## The ask (per event, in priority order)

One wide drone/aerial hero (≥2400px) + 4–8 grounds/crowd shots each:

| Event | Venue |
| --- | --- |
| Veolia Arizona Open | Arizona Athletic Grounds, Mesa AZ |
| Rate Las Vegas Open | Darling Tennis Center, Las Vegas NV |
| Veolia Chicago Cup | Life Time — Northbrook, IL |
| Virginia Beach Open | Virginia Beach Sports Center, VA |
| Pickleball World Championships | Brookhaven Country Club, Farmers Branch TX |
| Proton Daytona Beach Open | Pictona at Holly Hill, FL |
| Veolia Malibu Showcase | Pepperdine University, Malibu CA |
| Carvana Pickleball Masters | Hyatt Regency Indian Wells, Rancho Mirage CA |
| Minneapolis Indoor Open | Life Time — Lakeville, MN |
| Cape Coral Open | Cape Coral Racquet Club, FL |
| Carvana Mesa Cup | Bell Bank Park, Mesa AZ |
| Newport Beach Open | Tennis Club at Newport Beach, CA |
| Texas Open | The Courts of McKinney, TX |
| Greater Zion Cup | Black Desert Resort, St. George UT |
| Sacramento Open | Life Time — Arden, CA |
| Cincinnati Open | Lindner Family Tennis Center, OH |
| Atlanta Pickleball Championships | Life Time — Peachtree Corners, GA |
| PPA Finals | Life Time — Rancho San Clemente, CA |

## How to wire a new asset (dev note)

Drop optimized JPGs under `public/ppa/`, then in `lib/placeholder-data.ts`:
set the event's `image:` in `SCHEDULE` (hero + card) and add a
`GALLERY_BY_SLUG` entry (flip-through gallery renders automatically).
No component changes needed.
