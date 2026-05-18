@AGENTS.md

# PPA Tour Website Rebuild — `ppatour-website`

Content-first rebuild of `ppatour.com`. The site is the **content / discovery /
streaming** layer; commerce redirects out to partners (tixr for tickets,
pickleballtournaments.com for amateur registration). Do **not** embed checkout,
build a cart, or replicate registration forms.

**Full brief:** read [`CLAUDE_CODE_PASSOFF_v2.md`](CLAUDE_CODE_PASSOFF_v2.md)
end-to-end before touching code. The strategy doc (`Option B — Content-First
Strategy`) is the ultimate source of truth.

**Owner:** Bryce Morgan (President + CMO, PPA Tour)

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · shadcn/ui ·
Sanity (CMS, pending confirm) · Vercel (staging) → AWS (prod, Phase 3).

## Session Log

### 2026-05-18 — Official brand applied (Carvana PPA Tour)
- Bryce supplied the official **Carvana PPA Tour Brand Guide** + tournament
  logo kit. Rebranded the site off the guide (images skipped — API image-size
  limit; worked from the guide PDF text + SVGs).
- **Palette** (replaces the guessed red system): navy `#0C2B44`, deep navy
  `#07223A`, bright blue `#228BE6` (accent/CTA), CTA-hover `#005D9B`,
  sky `#4DC1EF`, yellow `#E7E700`, paper `#F3F5F7`, line `#D7DEE4`.
  §13 brand-hex open question is now **resolved**.
- **Fonts** (replaces Anton/Archivo): **Gobold Bold** display + **Gotham**
  body (Book/Medium/Bold/Black), self-hosted in `app/fonts/` via
  `next/font/local`. Font files are from the official kit.
- Token rename across all files: `ppa-ink`→`ppa-navy`, `ppa-coal`→
  `ppa-navy-deep`, `ppa-red`→`ppa-blue`, `ppa-red-dark`→`ppa-blue-deep`.
  Added `ppa-navy-soft`, `ppa-sky`. Scrims retinted near-black→navy.
- Official logo: horizontal white lockup now in Header + Footer (was a text
  wordmark). `public/ppa/logos/` holds white/blue horizontal + primary white.
  `app/icon.svg` = holding-shape favicon (default create-next-app one removed).
- Verified: `next build` passes (16 pages); hero renders on-brand; DOM +
  computed styles confirm all 8 sections, navy/paper backgrounds, Gobold/
  Gotham fonts, logo SVG. (Mid-page preview screenshots still flake — known
  environmental issue.)
- **Still interim:** imagery is the scraped stand-ins from the old site.
  **Not yet deployed** — awaiting Bryce's go-ahead to push/deploy.

### 2026-05-18 — Redesign v2 (LIV Golf direction)
- Direction set with Bryce: lead with LIV Golf energy; light/premium
  editorial body with dark hero + feature blocks; more distinctive type;
  art-directed imagery; **main-tour events only (1,000+ ranking points).**
- Type system: **Anton** (display) + **Archivo** (body) — replaced Oswald.
- Palette: light `ppa-paper` body, near-black `ppa-ink` hero/feature blocks,
  `ppa-red #e4002b`. (Brand hex still unconfirmed — §13.)
- Homepage: oversized LIV-style hero, dark stat band, numbered main-tour
  schedule cards, editorial feature grid, athlete roster (grayscale→color).
- `placeholder-data.ts` now holds 6 main-tour events (Atlanta, Las Vegas,
  Chicago, Virginia Beach, Nationals, Masters) with `points` field.
- **Gotcha:** `<Image fill>` behind sibling overlays did not paint until the
  img was promoted to its own compositing layer — fixed with
  `will-change-transform` on all fill images. Image scrims also moved to
  plain-rgba `.scrim-*` classes in globals.css (Tailwind oklab gradients
  were unreliable).
- Live: https://ppatour-website.vercel.app

### 2026-05-18 — Homepage redesign (cinematic)
- First homepage build was too flat/generic. Redesigned toward "BNP Paribas
  Open x LIV Golf": dark `ppa-ink` base, Oswald display font, full-bleed
  imagery, bold uppercase type.
- Pulled real PPA Tour action photography + content from `ppatour.com` into
  `public/ppa/` (14 interim assets — hero/action shots, destination photos,
  3 athlete headshots, logo). These are stand-ins; swap for proper assets
  via Sanity later.
- Homepage now: full-bleed hero, image-backed Watch/Play fork, destination
  event rail, editorial story grid, athlete cards, where-to-watch.
- Restyled Header/Footer/ComingSoon + schedule + event pages dark.
- **Note:** `ppa-red` nudged to `#d81e3c`. Brand hex still unconfirmed (§13).
- Live: https://ppatour-website.vercel.app

### 2026-05-18 — Phase 2: homepage + global components
- Built the first real homepage on the new stack. Live (production):
  https://ppatour-website.vercel.app
- Brand theme added to `globals.css` (`@theme`): `ppa-red #c8102e`,
  `ppa-navy #0a1733`, `ppa-yellow #ffd21f` (+ dark variants). **Approximate
  hex — confirm against the official brand guide (§13 open question).**
- Global components in `components/global/`: `ScoreTicker` (NEXT/LIVE modes,
  §9.1), `Header` (mobile drawer, §9.5), `CookieBanner` (footer-only, §9.4),
  `SiteFooter`, `LeadMagnetCapture` (§9.8), `ComingSoon`.
- Homepage (`app/page.tsx`): next-event hero, two-path Watch/Play fork,
  Next Stop stack, Story of the Match carousel, sponsors row, email capture.
- `lib/utm.ts` — `withUtm()` appends attribution to every outbound commerce
  link (revenue lever #1). `lib/placeholder-data.ts` — 3 placeholder
  tournaments + ticker/date helpers (NO live data; replace with Sanity +
  scoring API).
- Routes: `/events` (schedule list), `/events/[slug]` (UPCOMING-state stub —
  NOT the full §7 state machine yet), `/watch` `/play` `/athletes` `/about`
  (branded Coming Soon). `/api/lead-capture` is a stub that logs (no
  Customer.io yet).
- **State:** homepage + nav shipped on placeholder data. No CMS, no scoring
  API, no GA4/GTM, no tests/CI.
- **Next:** the §7 tournament state machine (LIVE state + sticky division
  tabs — the #1 UX fix), then `/watch` + `/play` hubs, schedule filters, and
  athlete profiles. Wire Sanity + scoring API + GTM. Resolve §13 open
  questions (brand hex, scoring/tixr/Customer.io creds, CMS confirm).

### 2026-05-18 — Phase 0: repo + scaffold
- Created GitHub repo `brycedmorgan/ppatour-website` (public) and local folder
  `/Users/bryce/Documents/ppatour-website`.
- Scaffolded with `create-next-app` (Next.js 16.2.6, App Router, TypeScript
  strict, Tailwind v4, ESLint, `@/*` import alias, no `src/` dir).
- Initialized shadcn/ui (`components/ui/button.tsx`, `lib/utils.ts`).
- Laid down the §5 directory scaffold (`.gitkeep` placeholders) for marketing /
  content / events / athletes / api routes, component groups, and `lib/`.
- Saved the passoff brief as `CLAUDE_CODE_PASSOFF_v2.md`.
- Deployed to Vercel (`gull-stack` scope): project `ppatour-website`, live at
  https://ppatour-website-mpohate97-gull-stack.vercel.app — auto-deploys on
  push to `main`.
- **State:** empty scaffold, default create-next-app homepage. Nothing built yet.
- **Next:** Phase 0 remaining items — Sanity studio decision, GTM container,
  env vars, Playwright + Vitest + CI. Then
  Phase 2 build starts with the global components (§9). Resolve §13 open
  questions with Bryce/Jason (repo org transfer, scoring API creds, tixr API,
  CMS confirm, brand hex values).
