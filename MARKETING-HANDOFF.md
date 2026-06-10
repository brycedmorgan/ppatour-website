# Marketing & Content Handoff

Welcome in. This is the PPA Tour site rebuild.

- **Live:** https://ppatour-website.vercel.app
- **Repo:** github.com/brycedmorgan/ppatour-website
- **Stack:** Next.js (App Router), TypeScript, Tailwind. Push to `main`, ping me, deploy goes out via Vercel (the GitHub auto-deploy reconnect is on Jason's list).

If you want the engineering context, the original brief is in `CLAUDE_CODE_PASSOFF_v2.md`.

## Five-minute tour

Click these in order:

1. **Homepage** — https://ppatour-website.vercel.app
   The five-lane audience strip under the hero (Watch · Tickets · Follow · Play · Sponsor) is the new front door. Notice the live-scores rail, the points race, the schedule, the sponsor pitch surfaced as a peer to the fan paths.

2. **An event page** — https://ppatour-website.vercel.app/events/veolia-pickleball-national-championships
   This is where everything funnels. Dual audience: Ragnar for those coming, PGA Tour for those at home. Trip guide, real broadcast schedule, tickets, players, watch.

3. **An athlete profile** — https://ppatour-website.vercel.app/athletes/anna-leigh-waters
   Real headshots, short bios, per-division standings.

4. **Sponsor pitch** — https://ppatour-website.vercel.app/about/sponsors
   The full media-kit-style brand pitch. Read it like a brand team would.

5. **Pickleball in 90 seconds** — https://ppatour-website.vercel.app/about/what-is-pickleball
   Swipeable card walkthrough for first-time fans.

## Voice and positioning (locked)

- We are the **Carvana PPA Tour**. Official brand guide: navy `#0C2B44`, blue `#228BE6`, yellow `#E7E700`, sky `#4DC1EF`. Gotham everywhere, Gotham Black for headlines.
- Tone is world-class premium sports brand. Think LIV Golf, PGA, ATP. Not casual lifestyle.
- "The Pro Tour of Pickleball" is the standing tagline.
- **Five audience doors site-wide:** Watch, Tickets, Follow, Play, Sponsor. Anything we add should serve one of those.
- **Drive traffic to the event page, not straight to ticket checkout.** The event page converts tickets, sells the trip, and sells the broadcast. The homepage hero, the schedule cards, and the score ticker all route there.
- Real PPA tier system everywhere: Worlds 3,000 / Slam 2,000 / Cup 1,500 / Open 1,000. We only showcase 1,000+ events on the homepage and schedule.

## Where copy and content live

Most editable content lives in `lib/` files so you don't have to dig through layout code.

**News and editorial**
- The `/news` page and the homepage news module both pull from `news` in `lib/home-content.ts`. Currently 15 placeholder headlines.
- The "From Pickleball.com" sidebar links out to pickleball.com (same file, `ecosystemNews`).

**Athlete bios**
- 40 profile pages at `/athletes/[slug]`. Data in `lib/athletes.ts`.
- One short paragraph per pro, written from public knowledge. Take a pass.

**Event editorial**
- Event names, cities, venues, prize money, ticket starting prices in `lib/placeholder-data.ts`.
- Per-event trip guides (hotels, restaurants, things to do, parking, airport) in `lib/event-guides.ts`. Picks are real well-known spots, framed as curated.

**Broadcast schedule**
- Real round-by-round windows from the broadcast sheet in `lib/broadcast.ts`. PBTV every round, Tennis Channel and FOX where applicable.

**Sponsor pitch**
- `/about/sponsors` reads as a media kit. The three activation case studies (Carvana, Veolia, Selkirk) are framed in spirit. Real numbers and stories live with the partnerships team.

**About pages**
- 13 about/* pages, all with placeholder-but-believable content. Files in `app/(marketing)/about/`.

**Newsletter**
- Three lead-magnet variants (fan, amateur, streaming) wired into a stub API. Customer.io creds drop in and they go live.

**Social cards**
- Default Open Graph card is branded. Event pages override with the event's hero photo. Athlete pages override with the headshot. So shared links preview cleanly.

## What's still placeholder

Don't promote any of this externally until it's real:

- All web traffic, social follower, broadcast hour, and arena attendance numbers in the stat band and sponsor pitch.
- Player bios.
- Defending champions on event pages (same names across every event currently).
- Tournament history year-by-year winners.
- "Hospitality and Suites" links on event pages.
- Event/venue action photography. Player headshots are real and official; the action shots are scraped stand-ins.

## What I need from you to keep moving

- Voice signoff on the sponsor pitch headline ("Reach the Hardest-to-Reach Audience in Sports") and the five-lane audience framing.
- A first batch of real news pieces. Three live articles would unlock the news page from feeling demo-y.
- Athlete features priority list. Which pros get long-form bios first?
- Confirm social handles. I assumed `@ppatour` on IG, X, YouTube, TikTok, Facebook.
- The editorial calendar through Nationals (Aug 31). What recaps, previews, profiles are you planning?
- A read on which "Official Tour Hotel" labels in the trip guides are real partnerships I can keep versus strip.

## How to edit

- Most copy: search the repo for the visible text. It almost certainly lives in a `lib/*.ts` file.
- Layout and styling: `app/` for pages, `components/` for reusable pieces.
- Push to `main`. Ping me to trigger the deploy until auto-deploy is back online.
- Branch + PR if you want eyes on it before it goes live.

## First wins this week

- One real news piece live on `/news`.
- One athlete deep-dive (real bio + a quote or two) on a top profile.
- Social posts pushing the new homepage. The OG cards make shared links preview cleanly.

Holler with questions. Hit me direct.

Bryce
